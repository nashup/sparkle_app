-- ============================================================
-- Sparks: Add rooms table + Realtime migration
-- Run this in the Supabase SQL Editor after the device-identity migration.
-- ============================================================

-- 1. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
  code        text        PRIMARY KEY,
  players     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  game_state  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- 2. Trigger — keep updated_at current
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

-- 3. Enable Realtime for rooms (game state sync)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;
END $$;

-- 4. Enable Realtime for device_sessions (partner-left detection)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'device_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_sessions;
  END IF;
END $$;

-- 5. Clean up stale rooms function
CREATE OR REPLACE FUNCTION cleanup_stale_rooms(max_age_hours int DEFAULT 2)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM rooms
  WHERE updated_at < now() - (max_age_hours || ' hours')::interval;
$$;

-- NOTE: To schedule automatic cleanup via pg_cron (if enabled):
--   SELECT cron.schedule('cleanup-rooms', '0 * * * *', 'SELECT cleanup_stale_rooms()');
--   SELECT cron.schedule('cleanup-sessions', '*/30 * * * *', 'SELECT cleanup_idle_sessions()');
