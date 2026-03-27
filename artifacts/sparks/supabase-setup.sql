-- ============================================================
-- Sparks App — Supabase Database Setup
-- Run this in your Supabase project: SQL Editor > New Query
-- ============================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  first_name     text,
  last_name      text,
  username       text unique,
  avatar         text,
  birth_year     integer,
  birth_year_locked boolean not null default false,
  privacy_accepted boolean not null default false,
  privacy_accepted_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2. DEVICE SESSIONS TABLE
create table if not exists public.device_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  device_id   text not null,
  room_code   text,
  last_active timestamptz not null default now(),
  unique(user_id, device_id)
);

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.device_sessions enable row level security;

-- Profiles: users can only read/write their own row
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Device sessions: users can only access their own sessions
create policy "Users can read own device sessions"
  on public.device_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own device sessions"
  on public.device_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own device sessions"
  on public.device_sessions for update
  using (auth.uid() = user_id);

-- 4. AUTO-CREATE PROFILE ON SIGNUP (optional trigger)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), ' ', 1)),
    coalesce(new.raw_user_meta_data->>'last_name', nullif(trim(substring(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '') from position(' ' in coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '')) + 1)), ''))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Google OAuth: also enable in Supabase Dashboard:
--   Authentication > Providers > Google
--   Add your Google Client ID & Secret
-- ============================================================
