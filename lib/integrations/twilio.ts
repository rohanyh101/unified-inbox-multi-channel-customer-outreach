import twilio from 'twilio'

// Define the message channel enum to match Prisma schema
export enum MessageChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL'
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export interface SendMessageParams {
  to: string
  body: string
  channel: MessageChannel
  mediaUrl?: string
}

export interface TwilioMessage {
  sid: string
  status: string
  errorCode?: string
  errorMessage?: string
}

/**
 * Format phone number to E.164 format
 * Removes spaces, dashes, parentheses and ensures proper formatting
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except the leading +
  let formatted = phoneNumber.replace(/[^\d+]/g, '')
  
  // Ensure the number starts with + if it doesn't already
  if (!formatted.startsWith('+')) {
    // If the number starts with a country code (like 91 for India), add +
    if (formatted.length >= 10) {
      formatted = '+' + formatted
    }
  }
  
  return formatted
}

/**
 * Send a message via Twilio (SMS or WhatsApp)
 */
export async function sendMessage(params: SendMessageParams): Promise<TwilioMessage> {
  const { to, body, channel, mediaUrl } = params
  
  try {
    let fromNumber: string
    let toNumber: string
    
    // Format the phone number to E.164 format
    const formattedPhoneNumber = formatPhoneNumber(to)
    
    if (channel === MessageChannel.SMS) {
      fromNumber = process.env.TWILIO_PHONE_NUMBER!
      toNumber = formattedPhoneNumber
    } else if (channel === MessageChannel.WHATSAPP) {
      fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!
      toNumber = `whatsapp:${formattedPhoneNumber}`
    } else {
      throw new Error(`Unsupported channel: ${channel}`)
    }
    
    const messageOptions: any = {
      body,
      from: fromNumber,
      to: toNumber,
    }

    // Only add status callback for production or when WEBHOOK_URL is set
    const webhookUrl = process.env.WEBHOOK_URL || process.env.NGROK_URL
    if (webhookUrl) {
      messageOptions.statusCallback = `${webhookUrl}/api/webhooks/twilio-status`
    }
    
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl]
    }
    
    const message = await client.messages.create(messageOptions)
    
    return {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode?.toString() || undefined,
      errorMessage: message.errorMessage || undefined,
    }
  } catch (error: any) {
    console.error('Twilio send error:', error)
    throw error
  }
}

/**
 * Get message status from Twilio
 */
export async function getMessageStatus(messageSid: string) {
  try {
    const message = await client.messages(messageSid).fetch()
    return {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode?.toString() || undefined,
      errorMessage: message.errorMessage || undefined,
    }
  } catch (error) {
    console.error('Error fetching message status:', error)
    throw error
  }
}

/**
 * Validate webhook signature from Twilio
 */
export function validateWebhook(signature: string, url: string, params: Record<string, any>): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  return twilio.validateRequest(authToken, signature, url, params)
}

/**
 * Parse incoming webhook from Twilio
 */
export interface IncomingMessage {
  from: string
  to: string
  body: string
  messageSid: string
  mediaUrls?: string[]
  channel: MessageChannel
}

export function parseIncomingWebhook(body: Record<string, string>): IncomingMessage {
  const { From, To, Body, MessageSid, NumMedia } = body
  
  // Determine channel based on 'To' field
  const channel = To.startsWith('whatsapp:') ? MessageChannel.WHATSAPP : MessageChannel.SMS
  
  // Clean phone numbers (remove whatsapp: prefix if present)
  const from = From.replace('whatsapp:', '')
  const to = To.replace('whatsapp:', '')
  
  // Parse media URLs if present
  const mediaUrls: string[] = []
  if (NumMedia && parseInt(NumMedia) > 0) {
    for (let i = 0; i < parseInt(NumMedia); i++) {
      const mediaUrl = body[`MediaUrl${i}`]
      if (mediaUrl) {
        mediaUrls.push(mediaUrl)
      }
    }
  }
  
  return {
    from,
    to,
    body: Body || '',
    messageSid: MessageSid,
    mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    channel,
  }
}
