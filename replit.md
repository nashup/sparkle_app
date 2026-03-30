# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/sparks)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Realtime**: Supabase Realtime (Postgres changes + broadcast channels)
- **State**: Zustand (persisted to localStorage for player identity)
- **Build**: Vite

## Project: Sparks — Couples Game App

A colorful, mobile-first couples/friends party game for two users.

### Identity System
- **No authentication.** Player identity = a UUID (`sparks_device_id`) stored in localStorage.
- `lib/device.ts` — `getDeviceId()` creates/retrieves the device UUID.
- `hooks/use-device-identity.tsx` — React context exposing `deviceId`, `profile`, `isLoading`, `isProfileComplete`, `refreshProfile`, `resetProfile`.
- `lib/session.ts` — shared constants: `SESSION_TIMEOUT_MS` (30 min), `HEARTBEAT_INTERVAL_MS` (60 s).
- Supabase `profiles` table is keyed on `device_id text PRIMARY KEY` (no `auth.users` FK).
- Supabase `device_sessions` table is keyed on `device_id text PRIMARY KEY`, RLS disabled.
- Heartbeat pings `last_active` every 60 s from waiting-room and results pages.
- Session expiry: on app load, if `last_active` is >30min old, profile is deleted and user is redirected to setup.

### Room/Game System
- `lib/rooms.ts` — Supabase CRUD: `createRoom`, `joinRoom`, `updateGameState`, `getRoom`.
- `hooks/use-room.tsx` — Supabase Realtime subscriptions + broadcast channels for chat/reactions.
- `store/use-game-store.ts` — Zustand store for player info, current room, chat, floating reactions.
- `lib/supabase.ts` — Supabase client + full types: `Room`, `Player`, `GameState`, `Profile`, `DeviceSession`.

### Game Rules
- 10 questions per game (`QUESTIONS_PER_GAME = 10` in `game.tsx` and `results.tsx`).
- 3 maximum skips per game (`MAX_SKIPS = 3`); skip button visible to host only.
- Both players submit answers → host advances to results → host clicks Next Question.
- End Game sets `phase: 'lobby'`, resetting `currentCardIndex`, `skipsUsed`, `answers`, `readyPlayers`.
- Results page has Leave Room button (both players) and partner-left modal (Supabase Realtime on `device_sessions`).

### Features
- Username + emoji avatar selection (12 avatars)
- Age verification for intimacy Levels 3 & 4 (18+)
- Room code pairing system (4-letter code, create or join)
- Real-time sync via Supabase Realtime (Postgres changes subscription on `rooms` table)
- Chat and emoji reactions via Supabase broadcast channels
- 3 game types: Know Me Better, Pick One, Dare/Reveal
- 4 intimacy levels: Casual → Flirty → Romantic → Bold/Explicit
- Preloaded questions per game type per level (questions.ts)
- Glassmorphism UI, gradient backgrounds, framer-motion animations

### SQL Setup
- `supabase-setup.sql` — fresh install SQL (all tables including `rooms`).
- `supabase-migration-add-rooms.sql` — adds `rooms` table to existing installs.
- `supabase-migration-device-identity.sql` — migration from old auth-based schema.
- Must enable Supabase Realtime for `rooms` and `device_sessions` tables.

## Structure

```text
artifacts/sparks/               # React+Vite frontend (Sparks app)
├── src/
│   ├── data/questions.ts       # All preloaded questions (seeded shuffle)
│   ├── store/use-game-store.ts # Zustand game state + chat + reactions
│   ├── hooks/
│   │   ├── use-device-identity.tsx  # Device UUID + Supabase profiles
│   │   └── use-room.tsx             # Supabase Realtime subscriptions + broadcast
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client + Room/Player/GameState types
│   │   ├── rooms.ts            # Supabase CRUD operations for rooms
│   │   ├── device.ts           # getDeviceId() localStorage helper
│   │   └── session.ts          # SESSION_TIMEOUT_MS, HEARTBEAT_INTERVAL_MS
│   └── pages/
│       ├── lobby.tsx           # Create/join room (uses lib/rooms.ts directly)
│       ├── waiting-room.tsx    # Room setup (uses useRoom hook)
│       ├── game.tsx            # Question cards, skip mechanic, answers
│       └── results.tsx         # Answer reveal, reactions, next round / end game
├── supabase-setup.sql
├── supabase-migration-add-rooms.sql
└── supabase-migration-device-identity.sql
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`.

## Supabase Realtime Setup

The `rooms` table and `device_sessions` table must have Realtime enabled:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE device_sessions;
```
This is included in both setup SQLs.

## API Server (artifacts/api-server)

The Express API server (`artifacts/api-server`) is a legacy artifact from the old WebSocket-based architecture. It is no longer used by the Sparks frontend but remains in the workspace.
