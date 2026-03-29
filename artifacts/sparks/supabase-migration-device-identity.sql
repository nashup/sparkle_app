-- ============================================================
-- Sparks: Device Identity Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- Drops auth-based tables and recreates them keyed on device_id.
-- RLS is disabled — the anon key is safe because the only secret
-- is the device UUID stored in the user's own localStorage.
-- ============================================================

-- 1. Drop old tables (in dependency order)
DROP TABLE IF EXISTS device_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Profiles — keyed on device_id (no auth.users FK)
CREATE TABLE profiles (
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

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Device sessions — keyed on device_id
CREATE TABLE device_sessions (
  device_id   text        PRIMARY KEY,
  room_code   text,
  last_active timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE device_sessions DISABLE ROW LEVEL SECURITY;

-- 4. Convenience function — clean up idle sessions
CREATE OR REPLACE FUNCTION cleanup_idle_sessions(timeout_minutes int DEFAULT 30)
RETURNS void LANGUAGE sql AS $$
  DELETE FROM device_sessions
  WHERE last_active < now() - (timeout_minutes || ' minutes')::interval;
$$;
