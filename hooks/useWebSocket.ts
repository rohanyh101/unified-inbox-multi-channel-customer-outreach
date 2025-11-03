import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMessageSubscription } from './useMessages';

// Show startup message once
let hasShownStartupMessage = false;

interface WebSocketMessage {
  type: 'message' | 'status_update' | 'heartbeat' | 'scheduled_message_sent';
  data?: any;
}

export const useWebSocket = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addMessage, updateMessageStatus } = useMessageSubscription();
  const queryClient = useQueryClient();
  
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Use wss:// for production, ws:// for local development
    const wsUrl = process.env.NODE_ENV === 'production' 
      ? `wss://${window.location.host}/api/ws`
      : `ws://localhost:3001/api/ws`;
    
    try {
        
      console.log('Attempting WebSocket connection to:', wsUrl);
        
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        
        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // 30 seconds
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'message':
              if (message.data) {
                addMessage(message.data);
              }
              break;
              
            case 'status_update':
              if (message.data?.messageId && message.data?.status) {
                updateMessageStatus(message.data.messageId, message.data.status);
              }
              break;
              
            case 'scheduled_message_sent':
              if (message.data?.scheduledMessageId && message.data?.newMessage) {
                // Transform the scheduled message to sent status
                console.log('📨 Received scheduled_message_sent event:', {
                  scheduledMessageId: message.data.scheduledMessageId,
                  newMessageId: message.data.newMessage.id,
                  timestamp: new Date().toISOString()
                });
                updateMessageStatus(message.data.scheduledMessageId, 'SENT');
                console.log('📨 Scheduled message status updated to SENT:', message.data.scheduledMessageId);
              }
              break;
              
            case 'heartbeat':
              // Heartbeat received, connection is alive
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = (event) => {
        const codeDescriptions: Record<number, string> = {
          1000: 'Normal closure',
          1001: 'Going away',
          1002: 'Protocol error',
          1003: 'Unsupported data',
          1006: 'Abnormal closure (no close frame)',
          1011: 'Server error',
          1012: 'Service restart'
        };
        
        console.info('WebSocket disconnected (normal without WebSocket server):', {
          code: event.code,
          reason: event.reason || codeDescriptions[event.code] || 'Unknown reason',
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        });
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        // Reconnect after delay (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, Math.random() * 3), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
      
      wsRef.current.onerror = (error: Event) => {
        const readyState = wsRef.current?.readyState;
        const stateNames = {
          0: 'CONNECTING',
          1: 'OPEN', 
          2: 'CLOSING',
          3: 'CLOSED'
        };
        
        console.warn('WebSocket connection error (this is normal without WebSocket server):', {
          state: readyState !== undefined ? `${readyState} (${stateNames[readyState as keyof typeof stateNames] || 'UNKNOWN'})` : 'undefined',
          url: wsUrl,
          type: error.type,
          timestamp: new Date().toISOString(),
          message: 'WebSocket server not running or connection refused'
        });
      };
      
    } catch (error) {
      console.info('WebSocket connection failed (normal without WebSocket server):', {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: wsUrl,
        timestamp: new Date().toISOString(),
        note: 'Run "npm run dev:full" to start with WebSocket server'
      });
    }
  }, [addMessage, updateMessageStatus]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);
  
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);
  
  useEffect(() => {
    // Show helpful message on first use
    if (!hasShownStartupMessage) {
      hasShownStartupMessage = true;
      console.info('💡 WebSocket Real-time Features:', {
        status: 'Attempting connection...',
        note: 'For real-time updates, run: npm run dev:full',
        fallback: 'App works normally without WebSocket server'
      });
    }
    
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    reconnect: connect,
  };
};
