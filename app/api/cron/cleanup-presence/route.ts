import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cleanup old presence records (cron job)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (you might want to add authentication here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    console.log(`Cleaned up ${deleted.count} old presence records`)

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleted.count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error cleaning up presence:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup presence' },
      { status: 500 }
    )
  }
}
