import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get replies to a note (threading)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const noteId = id

    // Verify the parent note exists and user has access
    const parentNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        contact: {
          createdBy: session.user.id,
        },
      },
    })

    if (!parentNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Get all replies with author information
    const replies = await prisma.note.findMany({
      where: {
        parentId: noteId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json({ replies })
  } catch (error) {
    console.error('Error fetching note replies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

/**
 * Create a reply to a note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has EDITOR or ADMIN role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const noteId = id
    const { content, isPrivate = false, mentions = [] } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Verify the parent note exists and user has access
    const parentNote = await prisma.note.findFirst({
      where: {
        id: noteId,
        contact: {
          createdBy: session.user.id,
        },
      },
      include: {
        contact: true,
      },
    })

    if (!parentNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Create the reply note
    const reply = await prisma.note.create({
      data: {
        content,
        isPrivate,
        parentId: noteId,
        contactId: parentNote.contactId,
        authorId: session.user.id,
        mentions: {
          create: mentions.map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    })

    return NextResponse.json({ reply }, { status: 201 })
  } catch (error) {
    console.error('Error creating note reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
