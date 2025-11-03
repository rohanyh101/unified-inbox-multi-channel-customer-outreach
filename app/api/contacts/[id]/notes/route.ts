import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const notes = await prisma.note.findMany({
      where: { 
        contactId: id,
        parentId: null, // Only get top-level notes, not replies
      },
      include: {
        author: {
          select: { 
            id: true,
            name: true, 
            email: true,
            role: true,
          }
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
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, isPrivate = false, mentions = [] } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'Note content is required' },
        { status: 400 }
      );
    }

    // Check if user has permission to create notes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || user.role === 'VIEWER') {
      return NextResponse.json(
        { message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        createdBy: session.user.id
      }
    });

    if (!contact) {
      return NextResponse.json(
        { message: 'Contact not found' },
        { status: 404 }
      );
    }

    const note = await prisma.note.create({
      data: {
        content: content.trim(),
        isPrivate: Boolean(isPrivate),
        contactId: id,
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
          }
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
      }
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { message: 'Failed to create note' },
      { status: 500 }
    );
  }
}
