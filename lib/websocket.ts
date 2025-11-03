import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { IncomingMessage } from 'http';

let wss: WebSocketServer | null = null;

export function initializeWebSocketServer() {
  if (wss) return wss;

  // Create HTTP server for WebSocket
  const server = createServer();
  wss = new WebSocketServer({ server, path: '/api/ws' });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: WebSocket.Data) => {
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

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Start server on port 3001 for development
  if (process.env.NODE_ENV !== 'production') {
    server.listen(3001, () => {
      console.log('WebSocket server running on port 3001');
    });
  }

  return wss;
}

export function broadcastMessage(message: any) {
  if (!wss) return;

  const messageString = JSON.stringify({
    type: 'message',
    data: message,
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

export function broadcastStatusUpdate(messageId: string, status: string) {
  if (!wss) return;

  const messageString = JSON.stringify({
    type: 'status_update',
    data: { messageId, status },
  });

  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

export { wss };
