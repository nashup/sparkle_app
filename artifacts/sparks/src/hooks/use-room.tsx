import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/lib/supabase';
import { useGameStore } from '@/store/use-game-store';
import type { ChatMessage, FloatingReaction } from '@/store/use-game-store';
import { getRoom } from '@/lib/rooms';
import { v4 as uuidv4 } from 'uuid';

interface UseRoomReturn {
  room: Room | null;
  sendChat: (text: string) => void;
  sendReaction: (emoji: string) => void;
  setChatOpen: (open: boolean) => void;
  isConnected: boolean;
}

export function useRoom(code: string | undefined): UseRoomReturn {
  const {
    playerInfo,
    setRoom,
    addChatMessage,
    incrementUnread,
    addFloatingReaction,
    removeFloatingReaction,
    setIsConnected,
  } = useGameStore();

  const isChatOpen = useRef(false);
  const [isConnected, setIsConnectedState] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!code) return;

    const upper = code.toUpperCase();

    getRoom(upper).then((room) => {
      if (room) setRoom(room);
    });

    const channelName = `room-${upper}`;

    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: true } },
    });

    channelRef.current = channel;

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `code=eq.${upper}`,
        },
        (payload) => {
          const row = payload.new as {
            code: string;
            players: unknown;
            game_state: unknown;
            created_at: string;
          } | null;
          if (!row) return;
          const updated: Room = {
            code: row.code,
            players: row.players as Room['players'],
            gameState: row.game_state as Room['gameState'],
            createdAt: row.created_at,
          };
          setRoom(updated);
        }
      )
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        if (!payload) return;
        const msg = payload as ChatMessage;
        addChatMessage(msg);
        if (!isChatOpen.current && msg.playerId !== playerInfo.playerId) {
          incrementUnread();
        }
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        if (!payload) return;
        const reaction: FloatingReaction = {
          id: uuidv4(),
          emoji: payload.emoji as string,
          playerId: payload.playerId as string,
          x: Math.random() * 80 + 10,
        };
        addFloatingReaction(reaction);
        setTimeout(() => removeFloatingReaction(reaction.id), 2500);
      })
      .subscribe((status) => {
        const connected = status === 'SUBSCRIBED';
        setIsConnectedState(connected);
        setIsConnected(connected);
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnectedState(false);
      setIsConnected(false);
    };
  }, [code, setRoom, addChatMessage, incrementUnread, addFloatingReaction, removeFloatingReaction, setIsConnected]);

  const sendChat = useCallback((text: string) => {
    const ch = channelRef.current;
    if (!ch) return;
    const msg: ChatMessage = {
      id: uuidv4(),
      playerId: playerInfo.playerId,
      username: playerInfo.username,
      avatar: playerInfo.avatar,
      text: text.slice(0, 500),
      timestamp: Date.now(),
    };
    ch.send({ type: 'broadcast', event: 'chat', payload: msg });
  }, [playerInfo]);

  const sendReaction = useCallback((emoji: string) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({
      type: 'broadcast',
      event: 'reaction',
      payload: { emoji, playerId: playerInfo.playerId },
    });
  }, [playerInfo.playerId]);

  const setChatOpen = useCallback((open: boolean) => {
    isChatOpen.current = open;
  }, []);

  const room = useGameStore((s) => s.currentRoom);

  return { room, sendChat, sendReaction, setChatOpen, isConnected };
}
