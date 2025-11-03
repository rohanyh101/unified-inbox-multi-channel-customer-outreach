import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get current presence for a contact/resource
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
    const action = searchParams.get('action')

    // Get active presence (last 2 minutes)
    const cutoffTime = new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago

    const presence = await prisma.userPresence.findMany({
      where: {
        ...(contactId && { contactId }),
        ...(action && { action }),
        lastSeenAt: {
          gte: cutoffTime,
        },
        userId: {
          not: session.user.id, // Don't include current user
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    })

    return NextResponse.json({ presence })
  } catch (error) {
    console.error('Error fetching presence:', error)
    return NextResponse.json(
      { error: 'Failed to fetch presence' },
      { status: 500 }
    )
  }
}

/**
 * Update user presence
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { contactId, action, metadata } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Valid actions
    const validActions = [
      'viewing_contact',
      'editing_note',
      'typing_message',
      'scheduling_message',
      'offline'
    ]

    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    if (action === 'offline') {
      // Remove all presence records for this user
      await prisma.userPresence.deleteMany({
        where: {
          userId: session.user.id,
        },
      })

      return NextResponse.json({ success: true })
    }

    // Verify contact exists and user has access (if contactId provided)
    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          createdBy: session.user.id,
        },
      })

      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
    }

    // Upsert presence record
    const presence = await prisma.userPresence.upsert({
      where: {
        userId_contactId_action: {
          userId: session.user.id,
          contactId: contactId || '',
          action,
        },
      },
      update: {
        lastSeenAt: new Date(),
        metadata: metadata || null,
      },
      create: {
        userId: session.user.id,
        contactId,
        action,
        metadata: metadata || null,
        lastSeenAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ presence })
  } catch (error) {
    console.error('Error updating presence:', error)
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    )
  }
}

/**
 * Clean up old presence records
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can cleanup presence
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Remove presence records older than 5 minutes
    const cutoffTime = new Date(Date.now() - 5 * 60 * 1000)

    const deleted = await prisma.userPresence.deleteMany({
      where: {
        lastSeenAt: {
          lt: cutoffTime,
        },
      },
    })

    return NextResponse.json({ deletedCount: deleted.count })
  } catch (error) {
    console.error('Error cleaning up presence:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup presence' },
      { status: 500 }
    )
  }
}
