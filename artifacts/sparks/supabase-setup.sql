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

-- 3. Convenience function — clean up idle sessions (30-min default)
CREATE OR REPLACE FUNCTION cleanup_idle_sessions(timeout_minutes int DEFAULT 30)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM device_sessions
  WHERE room_code IS NOT NULL
    AND last_active < now() - (timeout_minutes || ' minutes')::interval;
$$;
