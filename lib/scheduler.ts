import { prisma } from '@/lib/prisma'
import { sendMessage, MessageChannel } from '@/lib/integrations/twilio'

export async function processScheduledMessages() {
  try {
    console.log('Processing scheduled messages...')
    
    // Get all pending messages that are due to be sent
    const dueMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: {
          lte: new Date() // Messages scheduled for now or earlier
        }
      },
      include: {
        contact: true,
        author: true
      }
    })

    console.log(`Found ${dueMessages.length} messages to process`)

    for (const message of dueMessages) {
      try {
        console.log(`📤 Processing scheduled message ${message.id}...`)

        let result
        
        // Send the message based on channel
        if (!message.contact.phone) {
          throw new Error('No phone number available')
        }

        result = await sendMessage({
          to: message.contact.phone,
          body: message.content,
          channel: message.channel as MessageChannel
        })

        // Create a message record for the sent scheduled message
        const newMessage = await prisma.message.create({
          data: {
            channel: message.channel,
            direction: 'OUTBOUND',
            content: message.content,
            status: 'SENT', // Will be updated by webhook
            contactId: message.contactId,
            authorId: message.authorId,
            twilioSid: result.sid,
            metadata: {
              scheduledMessageId: message.id,
              originalScheduledAt: message.scheduledAt
            }
          },
          include: {
            contact: true,
            author: true
          }
        })

        // Broadcast that the scheduled message has been sent
        try {
          // Import the WebSocket broadcaster dynamically to avoid circular imports
          const { broadcastScheduledMessageSent } = await import('../websocket-server.js')
          const broadcastData = {
            scheduledMessageId: `scheduled-${message.id}`,
            newMessage: {
              id: newMessage.id,
              channel: newMessage.channel,
              direction: newMessage.direction,
              content: newMessage.content,
              status: newMessage.status,
              timestamp: newMessage.timestamp.toISOString(),
              contact: newMessage.contact,
              contactId: newMessage.contactId
            }
          };
          
          console.log('🔔 Broadcasting scheduled message sent:', broadcastData);
          broadcastScheduledMessageSent(broadcastData);
        } catch (wsError) {
          console.log('WebSocket not available for broadcast:', wsError instanceof Error ? wsError.message : 'Unknown error')
        }

        // Update the scheduled message status to SENT after broadcasting
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: { status: 'SENT' }
        })

        console.log(`Sent scheduled message ${message.id} via ${message.channel}`)
      } catch (error) {
        console.error(`Failed to send scheduled message ${message.id}:`, error)
        
        // Update status to FAILED (from PROCESSING)
        await prisma.scheduledMessage.update({
          where: { id: message.id },
          data: { 
            status: 'FAILED'
          }
        })
      }
    }

    console.log('Finished processing scheduled messages')
    return { processed: dueMessages.length }
  } catch (error) {
    console.error('Error in processScheduledMessages:', error)
    throw error
  }
}

// Clean up old completed/failed scheduled messages (optional)
export async function cleanupScheduledMessages(olderThanDays: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.scheduledMessage.deleteMany({
      where: {
        status: {
          in: ['SENT', 'FAILED', 'CANCELLED']
        },
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    console.log(`Cleaned up ${result.count} old scheduled messages`)
    return result
  } catch (error) {
    console.error('Error in cleanupScheduledMessages:', error)
    throw error
  }
}
