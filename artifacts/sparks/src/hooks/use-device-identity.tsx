import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type Profile } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device';

interface DeviceIdentityState {
  deviceId: string;
  profile: Profile | null;
  isLoading: boolean;
  isProfileComplete: boolean;
  refreshProfile: () => Promise<void>;
  resetProfile: () => Promise<void>;
}

const DeviceIdentityContext = createContext<DeviceIdentityState>({
  deviceId: '',
  profile: null,
  isLoading: true,
  isProfileComplete: false,
  refreshProfile: async () => {},
  resetProfile: async () => {},
});

export function DeviceIdentityProvider({ children }: { children: React.ReactNode }) {
  const deviceId = getDeviceId();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('device_id', deviceId)
        .single();
      if (error || !data) return null;
      return data as Profile;
    } catch {
      return null;
    }
  }, [deviceId]);

  const refreshProfile = useCallback(async () => {
    const p = await fetchProfile();
    setProfile(p);
  }, [fetchProfile]);

  const resetProfile = useCallback(async () => {
    await supabase.from('profiles').delete().eq('device_id', deviceId);
    await supabase.from('device_sessions').delete().eq('device_id', deviceId);
    setProfile(null);
  }, [deviceId]);

  useEffect(() => {
    fetchProfile().then(p => {
      setProfile(p);
      setIsLoading(false);
    });
  }, [fetchProfile]);

  const isProfileComplete = !!(
    profile?.username &&
    profile?.avatar &&
    profile?.birth_year
  );

  return (
    <DeviceIdentityContext.Provider value={{
      deviceId,
      profile,
      isLoading,
      isProfileComplete,
      refreshProfile,
      resetProfile,
    }}>
      {children}
    </DeviceIdentityContext.Provider>
  );
}

export function useDeviceIdentity() {
  return useContext(DeviceIdentityContext);
}
