import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
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

    // Get user's contacts
    const userContacts = await prisma.contact.findMany({
      where: { createdBy: session.user.id },
      select: { id: true },
    })
    
    const contactIds = userContacts.map((c: any) => c.id)

    if (contactIds.length === 0) {
      // Return empty CSV
      const csvContent = "Date,Total Messages,Sent,Received,Channel,Response Time (min)\n"
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-report-${range}-${now.toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Get detailed message data for export
    const messages = await prisma.message.findMany({
      where: {
        contactId: { in: contactIds },
        timestamp: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        contact: {
          select: { name: true }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Generate CSV content
    const csvRows = [
      'Date,Time,Contact,Channel,Direction,Status,Content Length,Response Time (min)'
    ]

    // Process messages and calculate response times
    const messagesByContact = messages.reduce((acc: Record<string, any[]>, message: any) => {
      if (!acc[message.contactId]) {
        acc[message.contactId] = []
      }
      acc[message.contactId].push(message)
      return acc
    }, {} as Record<string, any[]>)

    // Calculate response times and build CSV
    Object.values(messagesByContact).forEach((contactMessages) => {
      const typedMessages = contactMessages as any[]
      typedMessages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      
      for (let i = 0; i < typedMessages.length; i++) {
        const message = typedMessages[i]
        const date = new Date(message.timestamp)
        let responseTime = ''
        
        // Calculate response time if this is an outbound message followed by an inbound
        if (message.direction === 'OUTBOUND' && i < typedMessages.length - 1) {
          const nextMessage = typedMessages[i + 1]
          if (nextMessage.direction === 'INBOUND') {
            const timeDiff = (new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime()) / (1000 * 60)
            responseTime = timeDiff.toFixed(2)
          }
        }
        
        csvRows.push([
          date.toISOString().split('T')[0], // Date
          date.toTimeString().split(' ')[0], // Time
          `"${message.contact.name}"`, // Contact (quoted for CSV safety)
          message.channel,
          message.direction,
          message.status,
          message.content.length.toString(),
          responseTime
        ].join(','))
      }
    })

    // Add summary rows
    csvRows.push('') // Empty row
    csvRows.push('SUMMARY')
    csvRows.push(`Total Messages,${messages.length}`)
    csvRows.push(`Date Range,${startDate.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`)
    
    // Channel breakdown
    const channelCounts = messages.reduce((acc: Record<string, number>, msg: any) => {
      acc[msg.channel] = (acc[msg.channel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(channelCounts).forEach(([channel, count]) => {
      csvRows.push(`${channel} Messages,${count}`)
    })

    const csvContent = csvRows.join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-report-${range}-${now.toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Export analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}
