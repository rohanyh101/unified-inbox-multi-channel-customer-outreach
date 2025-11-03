import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseIncomingWebhook, validateWebhook } from '@/lib/integrations/twilio'
import { twilioWebhookSchema } from '@/lib/validations'
import { verifyTwilioWebhook, webhookRateLimiter } from '@/lib/webhook-security'
import { broadcastMessage, broadcastStatusUpdate } from '@/lib/websocket'
import { withRetry, AppError } from '@/lib/error-handling'

/**
 * Handle incoming messages from Twilio webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
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
    
    // Convert URLSearchParams to object
    const webhookData: Record<string, string> = {}
    for (const [key, value] of params.entries()) {
      webhookData[key] = value
    }

    // Enhanced webhook signature validation
    const signature = request.headers.get('X-Twilio-Signature')
    const url = request.url
    
    if (!signature) {
      throw new AppError('Missing webhook signature', 'MISSING_SIGNATURE', 401, {}, false);
    }
    
    // Use the enhanced signature verification
    const isValidSignature = verifyTwilioWebhook(
      url,
      webhookData,
      signature,
      process.env.TWILIO_AUTH_TOKEN!
    );

    if (!isValidSignature) {
      throw new AppError('Invalid webhook signature', 'INVALID_SIGNATURE', 401, {}, false);
    }

    // Validate and parse the webhook data
    const validatedData = twilioWebhookSchema.parse(webhookData)
    const incomingMessage = parseIncomingWebhook(webhookData)

    // Find or create contact based on phone number with retry logic
    let contact = await withRetry(async () => {
      return await prisma.contact.findFirst({
        where: {
          phone: incomingMessage.from,
        },
      });
    });

    if (!contact) {
      // Create a new contact for unknown numbers with retry logic
      contact = await withRetry(async () => {
        return await prisma.contact.create({
          data: {
            name: `Unknown (${incomingMessage.from})`,
            phone: incomingMessage.from,
            createdBy: 'system', // You might want to assign to a default user
          },
        });
      });
    }

    // Save the incoming message with retry logic
    const message = await withRetry(async () => {
      return await prisma.message.create({
        data: {
          contactId: contact.id,
          content: incomingMessage.body,
          channel: incomingMessage.channel as any,
          direction: 'INBOUND',
          status: 'DELIVERED',
          mediaUrl: incomingMessage.mediaUrls?.[0], // Take first media URL if present
          twilioSid: incomingMessage.messageSid,
        },
        include: {
          contact: true,
        },
      });
    });

    // Broadcast the new message to connected WebSocket clients
    broadcastMessage(message);

    // Log the incoming message
    console.log('Received incoming message:', {
      from: incomingMessage.from,
      body: incomingMessage.body,
      channel: incomingMessage.channel,
      contactName: contact.name,
    })

    // Respond to Twilio with success
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    )
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    
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
    
    // For other errors, still return 200 to Twilio to avoid retries for malformed data
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      }
    );
  }
}

/**
 * Handle Twilio status callback webhooks
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Twilio webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
