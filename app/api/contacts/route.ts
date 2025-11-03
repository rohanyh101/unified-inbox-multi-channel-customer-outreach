import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createContactSchema, contactFiltersSchema } from '@/lib/validations'

/**
 * Get contacts with filtering and pagination
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
    const filters = contactFiltersSchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    const where: any = {
      createdBy: session.user.id,
    }
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Get contacts with message counts
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          _count: {
            select: {
              messages: true,
              notes: true,
            },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              id: true,
              content: true,
              timestamp: true,
              channel: true,
              direction: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({
      contacts,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

/**
 * Create a new contact
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    // Check if contact already exists with the same phone or email
    const existingContact = await prisma.contact.findFirst({
      where: {
        createdBy: session.user.id,
        OR: [
          ...(validatedData.phone ? [{ phone: validatedData.phone }] : []),
          ...(validatedData.email ? [{ email: validatedData.email }] : []),
        ],
      },
    })

    if (existingContact) {
      return NextResponse.json(
        { error: 'Contact with this phone number or email already exists' },
        { status: 400 }
      )
    }

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        createdBy: session.user.id,
      },
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
    console.error('Error creating contact:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to create contact', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
