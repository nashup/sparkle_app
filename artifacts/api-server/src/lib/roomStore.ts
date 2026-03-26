import { WebSocket } from "ws";

// In-memory room store
export interface Player {
  id: string;
  username: string;
  avatar: string;
  isReady: boolean;
}

export interface GameState {
  phase: "lobby" | "playing" | "results" | "finished";
  gameType: "know-me-better" | "pick-one" | "dare-reveal" | null;
  intimacyLevel: number;
  currentCardIndex: number;
  currentTurn: string | null;
  answers: Record<string, string>;
  spinResult: string | null;
}

export interface Room {
  code: string;
  players: Player[];
  gameState: GameState;
  createdAt: string;
}

const rooms: Record<string, Room> = {};

// WebSocket connections per room: roomCode -> Set of WebSocket
const roomConnections: Record<string, Set<WebSocket>> = {};

// playerId -> WebSocket mapping for targeted messages
const playerConnections: Record<string, WebSocket> = {};

export function getRooms() {
  return rooms;
}

export function getRoomConnections() {
  return roomConnections;
}

export function getPlayerConnections() {
  return playerConnections;
}

export function addConnection(
  roomCode: string,
  playerId: string,
  ws: WebSocket
) {
  if (!roomConnections[roomCode]) {
    roomConnections[roomCode] = new Set();
  }
  roomConnections[roomCode].add(ws);
  playerConnections[playerId] = ws;
}

export function removeConnection(roomCode: string, ws: WebSocket) {
  if (roomConnections[roomCode]) {
    roomConnections[roomCode].delete(ws);
    if (roomConnections[roomCode].size === 0) {
      delete roomConnections[roomCode];
    }
  }
  // Remove from player connections
  for (const [pid, socket] of Object.entries(playerConnections)) {
    if (socket === ws) {
      delete playerConnections[pid];
      break;
    }
  }
}

export function broadcastToRoom(roomCode: string, message: unknown) {
  const connections = roomConnections[roomCode];
  if (!connections) return;

  const data = JSON.stringify(message);
  for (const ws of connections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

// Auto-cleanup old rooms after 2 hours
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of Object.entries(rooms)) {
    const age = now - new Date(room.createdAt).getTime();
    if (age > 2 * 60 * 60 * 1000) {
      delete rooms[code];
      delete roomConnections[code];
    }
  }
}, 10 * 60 * 1000);
