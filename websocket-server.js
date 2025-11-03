import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

let wss = null;

function initializeWebSocketServer() {
  if (wss) return wss;

  // Create HTTP server for WebSocket
  const server = createServer();
  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'heartbeat' }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`🚀 WebSocket server running on port ${PORT}`);
    console.log(`   Path: /api/ws`);
    console.log(`   Full URL: ws://localhost:${PORT}/api/ws`);
  });

  return wss;
}

// Broadcast functions
function broadcastMessage(messageData) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: 'new_message',
    data: messageData
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastStatusUpdate(messageId, status) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: 'status_update',
    data: { messageId, status }
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Broadcast when a scheduled message gets sent
function broadcastScheduledMessageSent(data) {
  if (!wss) return;
  
  const message = JSON.stringify({
    type: 'scheduled_message_sent',
    data: data
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Export functions for use in other modules
export { broadcastMessage, broadcastStatusUpdate, broadcastScheduledMessageSent };

// Auto-scheduler for development (process scheduled messages every minute)
let schedulerInterval = null;

function startAutoScheduler() {
  console.log('🕐 Starting auto-scheduler for scheduled messages (every minute)');
  
  schedulerInterval = setInterval(async () => {
    try {
      // Simple HTTP call to our own cron endpoint
      const response = await fetch('http://localhost:3000/api/cron/process-scheduled-messages', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer dev-secret-key',
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.processed > 0) {
        console.log(`📧 Auto-scheduler: Processed ${result.processed} scheduled messages`);
      }
    } catch (error) {
      // Silently fail if Next.js server isn't running yet
      // console.log('Auto-scheduler waiting for Next.js server...');
    }
  }, 60000); // Every minute
}

function stopAutoScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('🛑 Auto-scheduler stopped');
  }
}

// Initialize WebSocket server for development
if (process.env.NODE_ENV !== 'production') {
  initializeWebSocketServer();
  console.log('✅ WebSocket server initialized for development');
  
  // Start auto-scheduler after a short delay to let Next.js start
  setTimeout(() => {
    startAutoScheduler();
  }, 5000);
  
  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development services...');
    stopAutoScheduler();
    process.exit(0);
  });
}
