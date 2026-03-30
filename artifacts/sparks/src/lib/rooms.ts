import { supabase } from '@/lib/supabase';
import type { Player, GameState, Room } from '@/lib/supabase';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

function rowToRoom(row: { code: string; players: unknown; game_state: unknown; created_at: string }): Room {
  return {
    code: row.code,
    players: row.players as Player[],
    gameState: row.game_state as GameState,
    createdAt: row.created_at,
  };
}

const DEFAULT_GAME_STATE: GameState = {
  phase: 'lobby',
  gameType: null,
  intimacyLevel: 1,
  currentCardIndex: 0,
  currentTurn: null,
  answers: {},
  spinResult: null,
  readyPlayers: [],
  skipsUsed: 0,
};

export async function createRoom(player: Pick<Player, 'id' | 'username' | 'avatar'>): Promise<Room> {
  const newPlayer: Player = { ...player, isReady: false };

  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode();

    const { data, error } = await supabase
      .from('rooms')
      .insert({
        code,
        players: [newPlayer],
        game_state: DEFAULT_GAME_STATE,
      })
      .select()
      .single();

    if (!error && data) return rowToRoom(data);

    if (error?.code === '23505') {
      attempts++;
      continue;
    }
    throw new Error(error?.message ?? 'Failed to create room');
  }
  throw new Error('Could not generate a unique room code after 10 attempts');
}

export async function joinRoom(
  code: string,
  player: Pick<Player, 'id' | 'username' | 'avatar'>
): Promise<Room> {
  const upper = code.toUpperCase();

  const { data: existing, error: fetchError } = await supabase
    .from('rooms')
    .select()
    .eq('code', upper)
    .single();

  if (fetchError || !existing) throw new Error('Room not found');

  const players = existing.players as Player[];

  if (players.some((p: Player) => p.id === player.id)) {
    return rowToRoom(existing);
  }

  if (players.length >= 2) throw new Error('Room is full');

  const updated = [...players, { ...player, isReady: false }];

  const { data, error } = await supabase
    .from('rooms')
    .update({ players: updated })
    .eq('code', upper)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to join room');
  return rowToRoom(data);
}

export async function updateGameState(code: string, gameState: GameState): Promise<Room> {
  const { data, error } = await supabase
    .from('rooms')
    .update({ game_state: gameState })
    .eq('code', code.toUpperCase())
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Failed to update game state');
  return rowToRoom(data);
}

export async function getRoom(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from('rooms')
    .select()
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return null;
  return rowToRoom(data);
}
