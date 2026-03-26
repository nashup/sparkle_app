import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, ChatMessage, FloatingReaction } from '../store/use-game-store';
import { v4 as uuidv4 } from 'uuid';
import type { Room } from '@workspace/api-client-react';

export function useWebSocket(roomCode?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const { playerInfo, setRoom, setIsConnected, addChatMessage, addFloatingReaction, removeFloatingReaction, incrementUnread } = useGameStore();
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isChatOpen = useRef(false);

  const connect = useCallback(() => {
    if (!roomCode || !playerInfo.playerId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(JSON.stringify({ type: 'join', roomCode, playerId: playerInfo.playerId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'room:updated' && data.room) {
            setRoom(data.room as Room);
          }

          if (data.type === 'chat:message' && data.message) {
            addChatMessage(data.message as ChatMessage);
            if (!isChatOpen.current) {
              incrementUnread();
            }
          }

          if (data.type === 'reaction' && data.emoji) {
            const reaction: FloatingReaction = {
              id: uuidv4(),
              emoji: data.emoji,
              playerId: data.playerId,
              x: Math.random() * 80 + 10,
            };
            addFloatingReaction(reaction);
            setTimeout(() => removeFloatingReaction(reaction.id), 2500);
          }
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // ignore
    }
  }, [roomCode, playerInfo.playerId, setRoom, setIsConnected, addChatMessage, addFloatingReaction, removeFloatingReaction, incrementUnread]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendChat = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      roomCode,
      playerId: playerInfo.playerId,
      username: playerInfo.username,
      avatar: playerInfo.avatar,
      text,
    }));
  }, [roomCode, playerInfo]);

  const sendReaction = useCallback((emoji: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'react',
      roomCode,
      playerId: playerInfo.playerId,
      emoji,
    }));
  }, [roomCode, playerInfo.playerId]);

  const setChatOpen = useCallback((open: boolean) => {
    isChatOpen.current = open;
  }, []);

  return {
    sendChat,
    sendReaction,
    setChatOpen,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}
