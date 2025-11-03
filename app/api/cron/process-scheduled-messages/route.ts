import { NextRequest, NextResponse } from 'next/server';
import { processScheduledMessages, cleanupScheduledMessages } from '@/lib/scheduler';

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - in production, you'd want better security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.CRON_SECRET || 'dev-secret-key';
    
    if (!authHeader || authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const result = await processScheduledMessages();
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in scheduled message cron:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for manual testing
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ message: 'Not available in production' }, { status: 403 });
    }

    const result = await processScheduledMessages();
    
    return NextResponse.json({
      success: true,
      processed: result.processed,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in scheduled message processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
