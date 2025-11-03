import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendMessage, MessageChannel, TwilioMessage } from '@/lib/integrations/twilio'
import { sendMessageSchema } from '@/lib/validations'
import { htmlToPlainText, isHtmlContent } from '@/lib/utils/text'
import { broadcastMessage, broadcastStatusUpdate } from '@/lib/websocket'

// Define enums until Prisma client is regenerated
enum MessageDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ'
}

/**
 * Send a message via Twilio
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Get the contact to send message to
    const contact = await prisma.contact.findUnique({
      where: { id: validatedData.contactId },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Determine the recipient based on channel
    let recipient: string
    if (validatedData.channel === 'SMS' || validatedData.channel === 'WHATSAPP') {
      if (!contact.phone) {
        return NextResponse.json(
          { error: `Contact does not have a phone number for ${validatedData.channel}` },
          { status: 400 }
        )
      }
      recipient = contact.phone
    } else if (validatedData.channel === 'EMAIL') {
      if (!contact.email) {
        return NextResponse.json(
          { error: 'Contact does not have an email address' },
          { status: 400 }
        )
      }
      recipient = contact.email
    } else {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    // Prepare content for sending - convert HTML to plain text for SMS/WhatsApp
    const contentForSending = isHtmlContent(validatedData.content) 
      ? htmlToPlainText(validatedData.content)
      : validatedData.content;

    // Send via Twilio (SMS/WhatsApp only for now)
    let twilioResult: TwilioMessage | null = null
    let initialStatus = MessageStatus.PENDING
    
    if (validatedData.channel === 'SMS' || validatedData.channel === 'WHATSAPP') {
      twilioResult = await sendMessage({
        to: recipient,
        body: contentForSending, // Use plain text version for sending
        channel: validatedData.channel as MessageChannel,
        mediaUrl: validatedData.mediaUrl,
      })
      
      // If Twilio accepts the message, set status to SENT
      console.log(`📤 Twilio message sent with status: ${twilioResult.status}`)
      if (twilioResult && ['accepted', 'queued', 'sending', 'sent'].includes(twilioResult.status.toLowerCase())) {
        initialStatus = MessageStatus.SENT
        console.log(`✅ Setting message status to SENT`)
      } else {
        console.log(`⚠️ Keeping message status as PENDING due to Twilio status: ${twilioResult?.status}`)
      }
    }

    // Save message to database
    const message = await prisma.message.create({
      data: {
        contactId: validatedData.contactId,
        content: validatedData.content,
        channel: validatedData.channel as MessageChannel,
        direction: MessageDirection.OUTBOUND,
        status: initialStatus,
        mediaUrl: validatedData.mediaUrl,
        authorId: session.user.id,
        twilioSid: twilioResult?.sid,
      },
      include: {
        contact: true,
        author: true,
      },
    })

    // Broadcast the new message to connected clients
    broadcastMessage(message);

    // For local development, simulate webhook callback after a delay
    if (process.env.NODE_ENV === 'development' && twilioResult?.sid) {
      setTimeout(async () => {
        try {
          // Simulate delivery after 2-3 seconds
          const updatedMessage = await prisma.message.update({
            where: { id: message.id },
            data: { status: 'DELIVERED' }
          });
          
          // Broadcast status update
          broadcastStatusUpdate(message.id, 'DELIVERED');
          console.log(`🚀 Simulated delivery for message ${message.id}`);
        } catch (error) {
          console.error('Error simulating delivery:', error);
        }
      }, 2000 + Math.random() * 1000); // 2-3 second delay
    }

    return NextResponse.json({
      success: true,
      message,
      twilioSid: twilioResult?.sid,
    })
  } catch (error: unknown) {
    console.error('Error sending message:', error)
    
    // Enhanced error handling for WhatsApp
    let errorMessage = 'Failed to send message'
    let userFriendlyMessage = 'An error occurred while sending the message'
    let isWhatsAppError = false
    
    // Type-safe error handling
    if (error instanceof Error) {
      userFriendlyMessage = error.message
      
      // Check if this is a Twilio error with a code property
      const twilioError = error as Error & { code?: string }
      const errorCode = twilioError.code
      const errorMsg = error.message
      
      // Check if this is a WhatsApp-related error
      if (errorCode === '63015' || errorMsg.includes('63015')) {
        isWhatsAppError = true
        errorMessage = 'WhatsApp recipient not verified'
        userFriendlyMessage = 'The recipient must first opt-in to receive WhatsApp messages. They need to send "join satisfied-iron" to +14155238886 from their WhatsApp.'
      } else if (errorCode === '21211' || errorMsg.includes('21211')) {
        isWhatsAppError = true
        errorMessage = 'Invalid phone number format'
        userFriendlyMessage = 'Please ensure the phone number is in the correct format: +[country code][number] with no spaces.'
      } else if (errorCode === '21614' || errorMsg.includes('21614')) {
        isWhatsAppError = true
        errorMessage = 'WhatsApp delivery failed'
        userFriendlyMessage = 'The recipient may not have WhatsApp installed or the number may be invalid.'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: userFriendlyMessage,
        troubleshooting: isWhatsAppError ? {
          step1: 'Recipient must send "join satisfied-iron" to +14155238886',
          step2: 'Wait for Twilio confirmation message',
          step3: 'Then try sending again',
          note: 'This is required for each recipient individually'
        } : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get messages with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const channel = searchParams.get('channel')
    const direction = searchParams.get('direction')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (contactId) {
      where.contactId = contactId
    }
    
    if (channel) {
      where.channel = channel
    }
    
    if (direction) {
      where.direction = direction
    }
    
    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Get messages with pagination
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          contact: true,
          author: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ])

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
