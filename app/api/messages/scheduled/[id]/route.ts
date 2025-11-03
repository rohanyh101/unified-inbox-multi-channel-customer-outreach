import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function DELETE(
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

    // Verify scheduled message exists and belongs to user
    const scheduledMessage = await prisma.scheduledMessage.findFirst({
      where: {
        id,
        authorId: session.user.id,
        status: 'PENDING' // Only allow cancelling pending messages
      }
    });

    if (!scheduledMessage) {
      return NextResponse.json(
        { message: 'Scheduled message not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    // Update status to CANCELLED instead of deleting
    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    return NextResponse.json(
      { message: 'Failed to cancel scheduled message' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { content, scheduledAt } = body;

    // Verify scheduled message exists and belongs to user
    const scheduledMessage = await prisma.scheduledMessage.findFirst({
      where: {
        id,
        authorId: session.user.id,
        status: 'PENDING' // Only allow editing pending messages
      }
    });

    if (!scheduledMessage) {
      return NextResponse.json(
        { message: 'Scheduled message not found or cannot be edited' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    
    if (content) {
      updateData.content = content.trim();
    }
    
    if (scheduledAt) {
      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { message: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
      updateData.scheduledAt = scheduledDate;
    }

    const updatedMessage = await prisma.scheduledMessage.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ scheduledMessage: updatedMessage });
  } catch (error) {
    console.error('Error updating scheduled message:', error);
    return NextResponse.json(
      { message: 'Failed to update scheduled message' },
      { status: 500 }
    );
  }
}
