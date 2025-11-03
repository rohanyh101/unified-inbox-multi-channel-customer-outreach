import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get messages with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const channel = searchParams.get('channel')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause - only show messages for contacts created by this user
    const where: any = {
      contact: {
        createdBy: session.user.id,
      },
    }
    
    if (contactId) {
      where.contactId = contactId
    }
    
    if (channel) {
      where.channel = channel
    }

    // Get regular messages
    const messages = await prisma.message.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Get scheduled messages for the same filter criteria and convert them to virtual messages
    const scheduledWhere: any = {
      author: {
        id: session.user.id,
      },
      status: 'PENDING', // Only show pending scheduled messages for now
    }
    
    if (contactId) {
      scheduledWhere.contactId = contactId
    }
    
    if (channel) {
      scheduledWhere.channel = channel
    }

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: scheduledWhere,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })

    // Convert scheduled messages to virtual message format
    const virtualScheduledMessages = scheduledMessages.map((scheduled: any) => ({
      id: `scheduled-${scheduled.id}`,
      channel: scheduled.channel,
      direction: 'OUTBOUND',
      content: scheduled.content,
      status: 'SCHEDULED',
      timestamp: scheduled.scheduledAt.toISOString(),
      scheduledAt: scheduled.scheduledAt.toISOString(),
      scheduledMessageId: scheduled.id,
      contact: scheduled.contact,
      author: scheduled.author,
    }))

    // Combine and sort all messages by timestamp
    const allMessages = [...messages, ...virtualScheduledMessages].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return NextResponse.json(allMessages)
  } catch (error) {
    console.error('Failed to fetch messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
