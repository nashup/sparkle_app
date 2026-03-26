import { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore, ChatMessage, FloatingReaction } from '../store/use-game-store';
import { v4 as uuidv4 } from 'uuid';
import type { Room } from '@workspace/api-client-react';

interface WsContextValue {
  sendChat: (text: string, roomCode: string) => void;
  sendReaction: (emoji: string, roomCode: string) => void;
  setChatOpen: (open: boolean) => void;
  joinRoom: (roomCode: string) => void;
  isConnected: boolean;
}

const WsContext = createContext<WsContextValue>({
  sendChat: () => {},
  sendReaction: () => {},
  setChatOpen: () => {},
  joinRoom: () => {},
  isConnected: false,
});

export function WsProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isChatOpen = useRef(false);
  const [isConnected, setIsConnectedState] = useState(false);

  // Pending room to join — stored so we can send it once the socket opens
  const pendingRoomRef = useRef<string | null>(null);

  // Stable ref to Zustand store — never needs to be in dependency arrays
  const storeRef = useRef(useGameStore.getState());
  useEffect(() => useGameStore.subscribe(s => { storeRef.current = s; }), []);

  const sendJoin = useCallback((roomCode: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const playerId = storeRef.current.playerInfo.playerId;
    if (!playerId) return;
    ws.send(JSON.stringify({ type: 'join', roomCode, playerId }));
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current && (
      wsRef.current.readyState === WebSocket.OPEN ||
      wsRef.current.readyState === WebSocket.CONNECTING
    )) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnectedState(true);
        storeRef.current.setIsConnected(true);
        // Flush any pending room join
        if (pendingRoomRef.current) {
          sendJoin(pendingRoomRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const store = storeRef.current;

          if (data.type === 'room:updated' && data.room) {
            store.setRoom(data.room as Room);
          }

          if (data.type === 'chat:message' && data.message) {
            store.addChatMessage(data.message as ChatMessage);
            if (!isChatOpen.current) {
              store.incrementUnread();
            }
          }

          if (data.type === 'reaction' && data.emoji) {
            const reaction: FloatingReaction = {
              id: uuidv4(),
              emoji: data.emoji,
              playerId: data.playerId,
              x: Math.random() * 80 + 10,
            };
            store.addFloatingReaction(reaction);
            setTimeout(() => store.removeFloatingReaction(reaction.id), 2500);
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        setIsConnectedState(false);
        storeRef.current.setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => { ws.close(); };

      wsRef.current = ws;
    } catch { /* ignore */ }
  }, [sendJoin]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const joinRoom = useCallback((roomCode: string) => {
    pendingRoomRef.current = roomCode;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      sendJoin(roomCode);
    }
    // else: sendJoin will be called in onopen when the connection opens
  }, [sendJoin]);

  const sendChat = useCallback((text: string, roomCode: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const { playerInfo } = storeRef.current;
    wsRef.current.send(JSON.stringify({
      type: 'chat', roomCode,
      playerId: playerInfo.playerId,
      username: playerInfo.username,
      avatar: playerInfo.avatar,
      text,
    }));
  }, []);

  const sendReaction = useCallback((emoji: string, roomCode: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    const { playerInfo } = storeRef.current;
    wsRef.current.send(JSON.stringify({
      type: 'react', roomCode,
      playerId: playerInfo.playerId,
      emoji,
    }));
  }, []);

  const setChatOpen = useCallback((open: boolean) => {
    isChatOpen.current = open;
  }, []);

  return (
    <WsContext.Provider value={{ sendChat, sendReaction, setChatOpen, joinRoom, isConnected }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWs() {
  return useContext(WsContext);
}
