import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room } from '@workspace/api-client-react';

interface PlayerInfo {
  playerId: string;
  username: string;
  avatar: string;
  birthYear: number | null;
}

interface GameState {
  // Local Player Info
  playerInfo: PlayerInfo;
  setPlayerInfo: (info: Partial<PlayerInfo>) => void;
  isAdult: () => boolean;
  
  // Room State
  currentRoom: Room | null;
  setRoom: (room: Room | null) => void;
  
  // WS Connection
  isConnected: boolean;
  setIsConnected: (status: boolean) => void;
  
  // Reset
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
        const currentYear = new Date().getFullYear();
        return (currentYear - year) >= 18;
      },
      
      currentRoom: null,
      setRoom: (room) => set({ currentRoom: room }),
      
      isConnected: false,
      setIsConnected: (status) => set({ isConnected: status }),
      
      leaveRoom: () => set({ currentRoom: null, isConnected: false }),
    }),
    {
      name: 'sparks-game-storage',
      partialize: (state) => ({ playerInfo: state.playerInfo }), // Only persist player info
    }
  )
);
