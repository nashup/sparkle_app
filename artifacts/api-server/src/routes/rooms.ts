import { Router, type IRouter } from "express";
import {
  CreateRoomBody,
  JoinRoomBody,
  UpdateGameStateBody,
} from "@workspace/api-zod";
import { broadcastToRoom, getRooms } from "../lib/roomStore.js";

const router: IRouter = Router();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// POST /api/rooms - Create a new room
router.post("/", (req, res) => {
  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, avatar, playerId } = parsed.data;
  const rooms = getRooms();

  let code = generateRoomCode();
  while (rooms[code]) {
    code = generateRoomCode();
  }

  const room = {
    code,
    players: [
      {
        id: playerId,
        username,
        avatar,
        isReady: false,
      },
    ],
    gameState: {
      phase: "lobby" as const,
      gameType: null,
      intimacyLevel: 1,
      currentCardIndex: 0,
      currentTurn: null,
      answers: {},
      spinResult: null,
    },
    createdAt: new Date().toISOString(),
  };

  rooms[code] = room;
  res.status(201).json(room);
});

// GET /api/rooms/:code - Get a room by code
router.get("/:code", (req, res) => {
  const { code } = req.params;
  const rooms = getRooms();
  const room = rooms[code.toUpperCase()];
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(room);
});

// POST /api/rooms/:code/join - Join a room
router.post("/:code/join", (req, res) => {
  const { code } = req.params;
  const rooms = getRooms();
  const room = rooms[code.toUpperCase()];

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  if (room.players.length >= 2) {
    const parsed = JoinRoomBody.safeParse(req.body);
    if (parsed.success) {
      const existing = room.players.find((p) => p.id === parsed.data.playerId);
      if (existing) {
        res.json(room);
        return;
      }
    }
    res.status(409).json({ error: "Room is full" });
    return;
  }

  const parsed = JoinRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { username, avatar, playerId } = parsed.data;

  // Don't add if already in room
  const existing = room.players.find((p) => p.id === playerId);
  if (!existing) {
    room.players.push({
      id: playerId,
      username,
      avatar,
      isReady: false,
    });
  }

  broadcastToRoom(code.toUpperCase(), { type: "room:updated", room });
  res.json(room);
});

// PUT /api/rooms/:code/game-state - Update game state
router.put("/:code/game-state", (req, res) => {
  const { code } = req.params;
  const rooms = getRooms();
  const room = rooms[code.toUpperCase()];

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  const parsed = UpdateGameStateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { gameState } = parsed.data;
  room.gameState = gameState as typeof room.gameState;

  broadcastToRoom(code.toUpperCase(), { type: "room:updated", room });
  res.json(room);
});

export default router;
