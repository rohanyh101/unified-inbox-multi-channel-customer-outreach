import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get all users that can be mentioned
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
    const query = searchParams.get('query') || ''

    // Get all users except the current user, optionally filtered by search query
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.user.id,
        },
        ...(query && {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 10, // Limit results
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users for mentions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * Get mentions for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'get_mentions') {
      // Get all notes where the current user is mentioned
      const mentions = await prisma.noteMention.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          note: {
            include: {
              author: {
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
              parent: {
                select: {
                  id: true,
                  content: true,
                },
              },
            },
          },
        },
        orderBy: {
          note: {
            createdAt: 'desc',
          },
        },
      })

      return NextResponse.json({ mentions })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error handling mentions:', error)
    return NextResponse.json(
      { error: 'Failed to handle mentions' },
      { status: 500 }
    )
  }
}
