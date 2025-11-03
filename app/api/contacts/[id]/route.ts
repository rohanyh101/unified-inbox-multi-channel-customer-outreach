import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateContactSchema } from '@/lib/validations'

/**
 * Get a single contact with messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        createdBy: session.user.id,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
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
            messages: true,
            notes: true,
          },
        },
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

/**
 * Update a contact
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;
    const body = await request.json()
    const validatedData = updateContactSchema.parse(body)

    // Check if contact exists and user owns it
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        createdBy: session.user.id,
      },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            messages: true,
            notes: true,
          },
        },
      },
    })

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

/**
 * Delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params;

    // Check if contact exists and user owns it
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        createdBy: session.user.id,
      },
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    await prisma.contact.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
