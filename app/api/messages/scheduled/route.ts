import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const contactId = searchParams.get('contactId');

    const where: any = {
      authorId: session.user.id
    };

    if (status) {
      where.status = status;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return NextResponse.json({ scheduledMessages });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    return NextResponse.json(
      { message: 'Failed to fetch scheduled messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contactId, content, channel, scheduledAt } = body;

    if (!contactId || !content || !channel || !scheduledAt) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { message: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Verify contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        createdBy: session.user.id
      }
    });

    if (!contact) {
      return NextResponse.json(
        { message: 'Contact not found' },
        { status: 404 }
      );
    }

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        channel,
        content: content.trim(),
        scheduledAt: scheduledDate,
        contactId,
        authorId: session.user.id
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ scheduledMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating scheduled message:', error);
    return NextResponse.json(
      { message: 'Failed to schedule message' },
      { status: 500 }
    );
  }
}
