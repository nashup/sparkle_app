import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/use-game-store';
import { useToast } from './use-toast';
import type { Room } from '@workspace/api-client-react';

export function useWebSocket(roomCode?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const { playerInfo, setRoom, setIsConnected } = useGameStore();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    if (!roomCode || !playerInfo.playerId) return;

    // Use wss:// if https, else ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('[WS] Connecting to', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        // Send join event
        ws.send(JSON.stringify({
          type: 'join',
          roomCode,
          playerId: playerInfo.playerId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] Received:', data.type);
          
          if (data.type === 'room:updated' && data.room) {
            setRoom(data.room as Room);
          }
        } catch (err) {
          console.error('[WS] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Attempt reconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] Attempting to reconnect...');
          connect();
        }, 3000);
      };

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
    }
  }, [roomCode, playerInfo.playerId, setRoom, setIsConnected]);

  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendAction = useCallback((type: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        roomCode,
        playerId: playerInfo.playerId,
        ...payload
      }));
    } else {
      console.warn('[WS] Cannot send action, socket not open');
      toast({
        title: "Connection Issue",
        description: "Trying to reconnect...",
        variant: "destructive"
      });
    }
  }, [roomCode, playerInfo.playerId, toast]);

  return { sendAction, isConnected: wsRef.current?.readyState === WebSocket.OPEN };
}
