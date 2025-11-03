import { NextResponse } from 'next/server'

/**
 * Health check endpoint for Docker containers and monitoring
 * @returns JSON response with service status
 */
export async function GET() {
  try {
    // Basic health check - could be extended to check database connectivity
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nextjs: 'running',
        websocket: 'running' // Assume running if Next.js is running
      },
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}
