import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  playerId: string;
  x: number;
}

interface PlayerInfo {
  playerId: string;
  username: string;
  avatar: string;
  birthYear: number | null;
}

interface GameState {
  playerInfo: PlayerInfo;
  setPlayerInfo: (info: Partial<PlayerInfo>) => void;
  isAdult: () => boolean;

  currentRoom: Room | null;
  setRoom: (room: Room | null) => void;

  isConnected: boolean;
  setIsConnected: (status: boolean) => void;

  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;

  floatingReactions: FloatingReaction[];
  addFloatingReaction: (reaction: FloatingReaction) => void;
  removeFloatingReaction: (id: string) => void;

  unreadCount: number;
  incrementUnread: () => void;
  clearUnread: () => void;

  leaveRoom: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerInfo: {
        playerId: uuidv4(),
        username: '',
        avatar: '🐱',
        birthYear: null,
      },

      setPlayerInfo: (info) => set((state) => ({
        playerInfo: { ...state.playerInfo, ...info }
      })),

      isAdult: () => {
        const year = get().playerInfo.birthYear;
        if (!year) return false;
        return (new Date().getFullYear() - year) >= 18;
      },

      currentRoom: null,
      setRoom: (room) => set({ currentRoom: room }),

      isConnected: false,
      setIsConnected: (status) => set({ isConnected: status }),

      chatMessages: [],
      addChatMessage: (msg) => set((state) => {
        if (state.chatMessages.some(m => m.id === msg.id)) return state;
        return { chatMessages: [...state.chatMessages.slice(-99), msg] };
      }),
      clearChat: () => set({ chatMessages: [] }),

      floatingReactions: [],
      addFloatingReaction: (reaction) => set((state) => ({
        floatingReactions: [...state.floatingReactions, reaction]
      })),
      removeFloatingReaction: (id) => set((state) => ({
        floatingReactions: state.floatingReactions.filter(r => r.id !== id)
      })),

      unreadCount: 0,
      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      clearUnread: () => set({ unreadCount: 0 }),

      leaveRoom: () => set({ currentRoom: null, isConnected: false, chatMessages: [] }),
    }),
    {
      name: 'sparks-game-storage',
      partialize: (state) => ({ playerInfo: state.playerInfo }),
    }
  )
);
