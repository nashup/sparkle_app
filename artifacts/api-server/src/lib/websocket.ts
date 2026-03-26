import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { v4 as uuidv4 } from "uuid";
import {
  addConnection,
  removeConnection,
  broadcastToRoom,
  getRooms,
} from "./roomStore.js";
import { logger } from "./logger.js";

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join") {
          const { roomCode, playerId } = message;
          if (!roomCode || !playerId) return;

          currentRoomCode = roomCode.toUpperCase();
          currentPlayerId = playerId;

          addConnection(currentRoomCode, playerId, ws);

          const rooms = getRooms();
          const room = rooms[currentRoomCode];
          if (room) {
            ws.send(JSON.stringify({ type: "room:updated", room }));
          }

          logger.info({ roomCode: currentRoomCode, playerId }, "Player joined WS room");
        }

        if (message.type === "chat" && currentRoomCode) {
          const chatMessage = {
            id: uuidv4(),
            playerId: message.playerId || currentPlayerId,
            username: message.username || "Unknown",
            avatar: message.avatar || "⭐",
            text: String(message.text || "").slice(0, 500),
            timestamp: Date.now(),
          };
          broadcastToRoom(currentRoomCode, { type: "chat:message", message: chatMessage });
        }

        if (message.type === "react" && currentRoomCode) {
          broadcastToRoom(currentRoomCode, {
            type: "reaction",
            emoji: message.emoji,
            playerId: message.playerId || currentPlayerId,
          });
        }

        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore
      }
    });

    ws.on("close", () => {
      if (currentRoomCode) {
        removeConnection(currentRoomCode, ws);
        logger.info({ roomCode: currentRoomCode, playerId: currentPlayerId }, "Player left WS room");
      }
    });

    ws.on("error", (err) => {
      logger.error({ err }, "WebSocket error");
    });
  });

  logger.info("WebSocket server ready at /ws");
}
