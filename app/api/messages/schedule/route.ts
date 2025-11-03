import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/error-handling'
// import { getSession } from '@/lib/auth'

/**
 * Schedule a message to be sent later
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📅 Schedule message API called');
      // TODO: Add proper authentication check
      // For now, try to get the first user or create a default one
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            name: 'Default User',
            email: 'default@example.com',
            id: 'default-user-id'
          }
        });
      }
      const userId = user.id;

      const body = await request.json()
      const { contactId, content, channel, scheduledAt } = body
      console.log('📅 Request body:', { contactId, content, channel, scheduledAt });

      // Validate required fields
      if (!contactId || !content || !channel || !scheduledAt) {
        console.error('❌ Missing required fields:', { contactId: !!contactId, content: !!content, channel: !!channel, scheduledAt: !!scheduledAt });
        throw new AppError('Missing required fields: contactId, content, channel, scheduledAt', 'VALIDATION_ERROR')
      }

      // Validate scheduled time is in the future
      const scheduledDateTime = new Date(scheduledAt)
      if (scheduledDateTime <= new Date()) {
        throw new AppError('Scheduled time must be in the future', 'INVALID_TIME')
      }

      // Validate contact exists and belongs to user's organization
      const contact = await prisma.contact.findFirst({
        where: { 
          id: contactId,
          // Add organization check if needed
        }
      })

      if (!contact) {
        throw new AppError('Contact not found', 'CONTACT_NOT_FOUND')
      }

      // Create scheduled message
      const scheduledMessage = await prisma.scheduledMessage.create({
        data: {
          contactId,
          authorId: userId,
          content,
          channel: channel.toUpperCase(),
          scheduledAt: scheduledDateTime,
          status: 'PENDING'
        },
        include: {
          contact: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          author: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      console.log(`📅 Message scheduled: ${scheduledMessage.id} for ${scheduledDateTime.toLocaleString()}`)

      return NextResponse.json({ 
        success: true,
        scheduledMessage: {
          id: scheduledMessage.id,
          content: scheduledMessage.content,
          channel: scheduledMessage.channel,
          scheduledAt: scheduledMessage.scheduledAt,
          status: scheduledMessage.status,
          contact: scheduledMessage.contact,
          author: scheduledMessage.author
        }
      })
  } catch (error) {
    if (error instanceof AppError) {
      const statusCode = error.code === 'VALIDATION_ERROR' || error.code === 'INVALID_TIME' ? 400 :
                        error.code === 'CONTACT_NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusCode }
      )
    }
    
    console.error('Error scheduling message:', error)
    return NextResponse.json(
      { error: 'Failed to schedule message' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Message scheduling endpoint',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  })
}
