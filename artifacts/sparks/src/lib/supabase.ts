import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string;
  username: string;
  avatar: string;
  birth_year: number | null;
  birth_year_locked: boolean;
  privacy_accepted: boolean;
  privacy_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DeviceSession = {
  id: string;
  user_id: string;
  device_id: string;
  room_code: string | null;
  last_active: string;
};
