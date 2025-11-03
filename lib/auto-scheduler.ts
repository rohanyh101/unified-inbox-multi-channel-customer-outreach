/**
 * Auto-scheduler for development
 * Runs scheduled message processing every minute
 */

import { processScheduledMessages } from './scheduler';

let schedulerInterval: NodeJS.Timeout | null = null;

export function startAutoScheduler() {
  if (schedulerInterval) {
    console.log('⚠️  Auto-scheduler already running');
    return;
  }

  console.log('🚀 Starting auto-scheduler (runs every minute)');
  
  schedulerInterval = setInterval(async () => {
    try {
      const result = await processScheduledMessages();
      if (result.processed > 0) {
        console.log(`📧 Auto-scheduler: Processed ${result.processed} scheduled messages`);
      }
    } catch (error) {
      console.error('❌ Auto-scheduler error:', error);
    }
  }, 60000); // Run every minute

  return schedulerInterval;
}

export function stopAutoScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 Auto-scheduler stopped');
  }
}

// Auto-start in development
if (process.env.NODE_ENV !== 'production') {
  startAutoScheduler();
}
