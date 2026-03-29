import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type Profile } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  isProfileComplete: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;
      return data as Profile;
    } catch {
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Supabase v2: onAuthStateChange fires INITIAL_SESSION as its very first
    // event with the current session (including after an OAuth redirect).
    // Using getSession() alongside it creates a race condition and double
    // fetchProfile() calls. We rely solely on onAuthStateChange here.

    // Absolute fallback: force-clear the loading state after 8 s in case
    // INITIAL_SESSION never fires (corrupted localStorage, network error, etc.).
    const fallbackTimer = setTimeout(() => setIsLoading(false), 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(fallbackTimer);
        try {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            const p = await fetchProfile(session.user.id);
            setProfile(p);
          } else {
            setProfile(null);
          }
        } catch {
          // Safety net: ensure we always exit the loading state, even on error.
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const isProfileComplete = !!(
    profile?.username &&
    profile?.avatar &&
    profile?.birth_year
  );

  return (
    <AuthContext.Provider value={{
      user, session, profile, isLoading,
      isAuthenticated: !!user,
      isProfileComplete,
      refreshProfile,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
