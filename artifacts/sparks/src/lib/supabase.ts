import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  device_id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar: string;
  birth_year: number | null;
  birth_year_locked: boolean;
  privacy_accepted: boolean;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DeviceSession = {
  device_id: string;
  room_code: string | null;
  last_active: string;
};

export type Player = {
  id: string;
  username: string;
  avatar: string;
  isReady: boolean;
};

export type GameState = {
  phase: 'lobby' | 'playing' | 'results' | 'finished';
  gameType: 'know-me-better' | 'pick-one' | 'dare-reveal' | null;
  intimacyLevel: number;
  currentCardIndex: number;
  currentTurn: string | null;
  answers: Record<string, string>;
  spinResult: string | null;
  readyPlayers: string[];
  skipsUsed: number;
};

export type Room = {
  code: string;
  players: Player[];
  gameState: GameState;
  createdAt: string;
  updatedAt?: string;
};
