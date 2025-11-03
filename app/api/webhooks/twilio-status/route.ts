import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhook } from '@/lib/integrations/twilio'
import { verifyTwilioWebhook, webhookRateLimiter } from '@/lib/webhook-security'
import { broadcastStatusUpdate } from '@/lib/websocket'
import { withRetry, AppError } from '@/lib/error-handling'

/**
 * Twilio status callback webhook endpoint
 * This receives delivery status updates for sent messages
 * Configure this URL in Twilio Console -> Messaging -> Settings -> Webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!webhookRateLimiter.isAllowed(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.text()
    const params = new URLSearchParams(body)
    const webhookData = Object.fromEntries(params)
    
    console.log('📥 Twilio status callback received:', webhookData)
    
    // Enhanced webhook signature validation
    const signature = request.headers.get('x-twilio-signature')
    const url = request.url
    
    if (!signature) {
      throw new AppError('Missing webhook signature', 'MISSING_SIGNATURE', 401, {}, false);
    }
    
    const isValidSignature = verifyTwilioWebhook(
      url,
      webhookData,
      signature,
      process.env.TWILIO_AUTH_TOKEN!
    );

    if (!isValidSignature) {
      throw new AppError('Invalid webhook signature', 'INVALID_SIGNATURE', 401, {}, false);
    }
    
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
      From,
      To,
      Body,
      ChannelToAddress
    } = webhookData
    
    if (!MessageSid) {
      console.error('❌ No MessageSid in status callback')
      return NextResponse.json({ error: 'Missing MessageSid' }, { status: 400 })
    }
    
    console.log(`📊 Status update for ${MessageSid}: ${MessageStatus}`)
    
    // Find the message in our database with retry logic
    const message = await withRetry(async () => {
      return await prisma.message.findFirst({
        where: { twilioSid: MessageSid }
      });
    });
    
    if (!message) {
      console.log(`⚠️  Message with SID ${MessageSid} not found in database`)
      return NextResponse.json({ message: 'Message not found' }, { status: 200 })
    }
    
    // Map Twilio status to our status enum
    let newStatus: string
    switch (MessageStatus?.toLowerCase()) {
      case 'accepted':
      case 'queued':
        newStatus = 'PENDING'
        break
      case 'sending':
      case 'sent':
        newStatus = 'SENT'
        break
      case 'delivered':
        newStatus = 'DELIVERED'
        break
      case 'failed':
      case 'undelivered':
        newStatus = 'FAILED'
        break
      case 'read':
        newStatus = 'READ'
        break
      default:
        console.log(`⚠️  Unknown status: ${MessageStatus}`)
        newStatus = message.status // Keep current status
    }
    
    // Prepare update data
    const updateData: any = {
      status: newStatus as any
    }
    
    // Add error information if present
    if (ErrorCode || ErrorMessage) {
      updateData.metadata = {
        ...((message.metadata as any) || {}),
        errorCode: ErrorCode,
        errorMessage: ErrorMessage,
        lastStatusUpdate: new Date().toISOString(),
        twilioStatus: MessageStatus
      }
    }
    
    // Update message status with retry logic
    const updatedMessage = await withRetry(async () => {
      return await prisma.message.update({
        where: { id: message.id },
        data: updateData
      });
    });

    // Broadcast status update to connected WebSocket clients
    broadcastStatusUpdate(message.id, newStatus);
    
    console.log(`✅ Updated message ${MessageSid}: ${message.status} -> ${newStatus}`)
    
    if (ErrorCode) {
      console.error(`❌ Message ${MessageSid} error: ${ErrorCode} - ${ErrorMessage}`)
      
      // Log specific WhatsApp error information
      if (message.channel === 'WHATSAPP') {
        console.error('🔍 WhatsApp delivery failure - possible causes:')
        console.error('  • Recipient has not opted into sandbox')
        console.error('  • Invalid phone number format')
        console.error('  • WhatsApp account not active')
        console.error('  • Rate limits exceeded')
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      messageId: message.id,
      oldStatus: message.status,
      newStatus,
      twilioStatus: MessageStatus
    })
    
  } catch (error) {
    console.error('❌ Status callback processing error:', error);
    
    // Enhanced error handling
    if (error instanceof AppError) {
      if (error.status === 401) {
        // Return 401 for authentication errors
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Status callback processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({ 
    message: 'Twilio status callback webhook endpoint',
    usage: 'Configure this URL in Twilio Console for status callbacks',
    timestamp: new Date().toISOString()
  })
}
