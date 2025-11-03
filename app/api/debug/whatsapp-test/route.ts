import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendMessage, MessageChannel } from '@/lib/integrations/twilio'

/**
 * Debug API endpoint for testing WhatsApp message sending
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phoneNumber, message } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    console.log('🧪 Debug WhatsApp test initiated')
    console.log(`📞 Target number: ${phoneNumber}`)
    console.log(`💬 Message: ${message}`)

    // Test the Twilio integration directly
    const result = await sendMessage({
      to: phoneNumber,
      body: message,
      channel: MessageChannel.WHATSAPP,
    })

    console.log('✅ Debug test result:', result)

    // Return detailed debugging information
    return NextResponse.json({
      success: true,
      twilioSid: result.sid,
      status: result.status,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      debugInfo: {
        timestamp: new Date().toISOString(),
        channel: 'WHATSAPP',
        formattedNumber: phoneNumber,
        sandboxNumber: process.env.TWILIO_WHATSAPP_NUMBER,
        accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
      }
    })

  } catch (error: any) {
    console.error('❌ Debug test error:', error)
    
    // Return detailed error information
    return NextResponse.json(
      { 
        error: 'WhatsApp test failed',
        details: error.message,
        debugInfo: {
          timestamp: new Date().toISOString(),
          errorType: error.name || 'Unknown',
          twilioCode: error.code || null,
        }
      },
      { status: 500 }
    )
  }
}
