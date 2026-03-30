-- ============================================================
-- Sparks App — Supabase Database Setup (Device Identity)
-- Run this in your Supabase project: SQL Editor > New Query
-- ============================================================
-- No auth.users dependency. Players are identified by a UUID
-- stored in localStorage (device_id).
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  device_id          text        PRIMARY KEY,
  first_name         text        NOT NULL DEFAULT '',
  last_name          text        NOT NULL DEFAULT '',
  username           text        NOT NULL UNIQUE,
  avatar             text        NOT NULL DEFAULT '🐱',
  birth_year         integer,
  birth_year_locked  boolean     NOT NULL DEFAULT false,
  privacy_accepted   boolean     NOT NULL DEFAULT false,
  privacy_accepted_at timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. DEVICE SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.device_sessions (
  device_id   text        PRIMARY KEY,
  room_code   text,
  last_active timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.device_sessions DISABLE ROW LEVEL SECURITY;

-- 3. ROOMS TABLE
-- Stores all active rooms. game_state is a JSONB blob that includes
-- readyPlayers (string[]) and skipsUsed (int) for the new game mechanics.
CREATE TABLE IF NOT EXISTS public.rooms (
  code        text        PRIMARY KEY,
  players     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  game_state  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- Trigger to keep updated_at fresh on every rooms row update
CREATE OR REPLACE FUNCTION public.set_rooms_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rooms_updated_at ON public.rooms;
CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_rooms_updated_at();

-- Enable Realtime for the rooms table so clients can subscribe to changes.
-- Run this ONCE — it's idempotent via the IF NOT EXISTS check on the publication.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;
END $$;

-- Also enable Realtime for device_sessions (used for partner-left detection)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'device_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_sessions;
  END IF;
END $$;

-- 4. Convenience function — clean up idle sessions (30-min default)
CREATE OR REPLACE FUNCTION cleanup_idle_sessions(timeout_minutes int DEFAULT 30)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM device_sessions
  WHERE room_code IS NOT NULL
    AND last_active < now() - (timeout_minutes || ' minutes')::interval;
$$;

-- 5. Convenience function — clean up stale rooms (2-hour default)
-- Schedule via pg_cron: SELECT cron.schedule('cleanup-rooms','0 * * * *','SELECT cleanup_stale_rooms()');
CREATE OR REPLACE FUNCTION cleanup_stale_rooms(max_age_hours int DEFAULT 2)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rooms
  WHERE updated_at < now() - (max_age_hours || ' hours')::interval;
$$;
