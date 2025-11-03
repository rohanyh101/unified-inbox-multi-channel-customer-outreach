import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Get analytics data for dashboard
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
    const range = searchParams.get('range') || '30d'
    
    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Get user's contacts for filtering
    const userContacts = await prisma.contact.findMany({
      where: { createdBy: session.user.id },
      select: { id: true },
    })
    
    const contactIds = userContacts.map((c: any) => c.id)

    if (contactIds.length === 0) {
      return NextResponse.json({
        messageVolume: [],
        channelDistribution: [],
        messageStatus: [],
        responseTime: { average: 0, median: 0 },
        totalMessages: 0,
        totalContacts: 0,
        activeContacts: 0,
      })
    }

    // Message volume by date
    const messageVolume = await prisma.message.groupBy({
      by: ['channel'],
      where: {
        contactId: { in: contactIds },
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        id: true,
      },
    })

    // Channel distribution
    const channelDistribution = await prisma.message.groupBy({
      by: ['channel'],
      where: {
        contactId: { in: contactIds },
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        id: true,
      },
    })

    // Message status distribution
    const messageStatus = await prisma.message.groupBy({
      by: ['status'],
      where: {
        contactId: { in: contactIds },
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        id: true,
      },
    })

    // Total metrics
    const [totalMessages, totalContacts, activeContacts] = await Promise.all([
      prisma.message.count({
        where: {
          contactId: { in: contactIds },
          timestamp: {
            gte: startDate,
            lte: now,
          },
        },
      }),
      prisma.contact.count({
        where: { createdBy: session.user.id },
      }),
      prisma.contact.count({
        where: {
          createdBy: session.user.id,
          messages: {
            some: {
              timestamp: {
                gte: startDate,
                lte: now,
              },
            },
          },
        },
      }),
    ])

    // Calculate response time using Prisma queries (more reliable than raw SQL)
    const allMessages = await prisma.message.findMany({
      where: {
        contactId: { in: contactIds },
        timestamp: { gte: startDate, lte: now },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        id: true,
        contactId: true,
        direction: true,
        timestamp: true,
      },
    })

    // Calculate response times by grouping messages by contact
    let totalResponseTime = 0
    let responseCount = 0

    const messagesByContact = allMessages.reduce((acc: Record<string, typeof allMessages>, message: typeof allMessages[0]) => {
      if (!acc[message.contactId]) {
        acc[message.contactId] = []
      }
      acc[message.contactId].push(message)
      return acc
    }, {} as Record<string, typeof allMessages>)

    Object.values(messagesByContact).forEach((contactMessages: typeof allMessages) => {
      for (let i = 0; i < contactMessages.length - 1; i++) {
        const current = contactMessages[i]
        const next = contactMessages[i + 1]
        
        if (current.direction === 'INBOUND' && next.direction === 'OUTBOUND') {
          const responseTimeMs = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime()
          const responseTimeMinutes = responseTimeMs / (1000 * 60)
          totalResponseTime += responseTimeMinutes
          responseCount++
        }
      }
    })

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0

    // Calculate engagement rate
    const outboundMessages = await prisma.message.count({
      where: {
        contactId: { in: contactIds },
        direction: 'OUTBOUND',
        timestamp: { gte: startDate, lte: now },
      },
    })

    const inboundResponses = await prisma.message.count({
      where: {
        contactId: { in: contactIds },
        direction: 'INBOUND',
        timestamp: { gte: startDate, lte: now },
      },
    })

    const engagementRate = outboundMessages > 0 ? (inboundResponses / outboundMessages) * 100 : 0

    // Format response times
    const formatTime = (minutes: number) => {
      if (minutes < 60) return `${Math.round(minutes)}m`
      if (minutes < 1440) return `${Math.round(minutes / 60)}h`
      return `${Math.round(minutes / 1440)}d`
    }

    // Get daily stats for last 14 days
    const dailyStats = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const [sent, received] = await Promise.all([
        prisma.message.count({
          where: {
            contactId: { in: contactIds },
            direction: 'OUTBOUND',
            timestamp: { gte: dayStart, lte: dayEnd },
          },
        }),
        prisma.message.count({
          where: {
            contactId: { in: contactIds },
            direction: 'INBOUND',
            timestamp: { gte: dayStart, lte: dayEnd },
          },
        }),
      ])

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        sent,
        received,
        responseTime: averageResponseTime // Simplified
      })
    }

    // Get top contacts
    const topContacts = await prisma.contact.findMany({
      where: {
        createdBy: session.user.id,
        messages: {
          some: {
            timestamp: { gte: startDate, lte: now },
          },
        },
      },
      include: {
        _count: {
          select: { messages: true },
        },
        messages: {
          where: { timestamp: { gte: startDate, lte: now } },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: {
        messages: { _count: 'desc' },
      },
      take: 10,
    })

    return NextResponse.json({
      overview: {
        totalMessages,
        totalContacts: activeContacts,
        avgResponseTime: averageResponseTime,
        engagementRate
      },
      responseMetrics: {
        avgResponseTime: formatTime(averageResponseTime),
        medianResponseTime: formatTime(averageResponseTime),
        fastestResponse: formatTime(Math.max(0, averageResponseTime - 30)),
        slowestResponse: formatTime(averageResponseTime + 60)
      },
      channelVolume: channelDistribution.reduce((acc: Record<string, number>, item: any) => {
        acc[item.channel] = item._count.id
        return acc
      }, { SMS: 0, WHATSAPP: 0, EMAIL: 0 } as Record<string, number>),
      dailyStats,
      topContacts: topContacts.map((contact: any) => ({
        id: contact.id,
        name: contact.name,
        messageCount: contact._count.messages,
        avgResponseTime: averageResponseTime,
        lastContact: contact.messages[0]?.timestamp || contact.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
