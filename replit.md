# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (not yet used — game state is in-memory)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **WebSockets**: `ws` library for real-time room sync

## Project: Sparks — Couples Game App

A colorful, mobile-first couples/flirty game app for two users in different locations.

### Features
- Username + emoji avatar selection (12 avatars)
- Age verification for intimacy Levels 3 & 4 (18+)
- Room code pairing system (create or join with 4-letter code)
- Real-time sync via WebSockets (/ws endpoint)
- 3 game types: Know Me Better, Pick One, Dare/Reveal
- 4 intimacy levels: Casual → Flirty → Romantic → Bold/Explicit
- Preloaded questions per game type per level (questions.ts)
- Glassmorphism UI, gradient backgrounds, framer-motion animations
- Emoji reactions after each round

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (rooms, WebSocket)
│   │   ├── src/lib/roomStore.ts    # In-memory room store + WS connections
│   │   ├── src/lib/websocket.ts    # WebSocket server setup
│   │   └── src/routes/rooms.ts     # Room CRUD routes
│   └── sparks/             # React+Vite frontend (Sparks app)
│       ├── src/data/questions.ts   # All preloaded questions
│       ├── src/store/use-game-store.ts  # Zustand game state
│       ├── src/hooks/use-websocket.ts   # WS connection hook
│       └── src/pages/              # Welcome, Lobby, WaitingRoom, Game, Results
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## WebSocket Protocol

- Client connects to `ws://[host]/ws`
- On connect, sends: `{ type: "join", roomCode, playerId }`
- Server responds with: `{ type: "room:updated", room: Room }`
- Server broadcasts on any state change
- Client polls GET /api/rooms/{code} every 3s as fallback

## API Endpoints

- `POST /api/rooms` — Create room
- `GET /api/rooms/:code` — Get room
- `POST /api/rooms/:code/join` — Join room
- `PUT /api/rooms/:code/game-state` — Update game state (broadcasts to all in room)
