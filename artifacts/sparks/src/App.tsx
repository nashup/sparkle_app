import { useEffect, useRef } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DeviceIdentityProvider, useDeviceIdentity } from '@/hooks/use-device-identity';
import { PrivacyPopup } from '@/components/privacy-popup';
import { useGameStore } from '@/store/use-game-store';
import { supabase } from '@/lib/supabase';
import { SESSION_TIMEOUT_MS } from '@/lib/session';
import { DEVICE_ID_KEY } from '@/lib/device';

import ProfileSetup from './pages/profile-setup';
import Profile from './pages/profile';
import PrivacyPolicyPage from './pages/privacy-policy';
import Lobby from './pages/lobby';
import WaitingRoom from './pages/waiting-room';
import Game from './pages/game';
import Results from './pages/results';
import { Loader2 } from 'lucide-react';

function NotFound({ isProfileComplete }: { isProfileComplete: boolean }) {
  const [, setLocation] = useLocation();
  const redirected = useRef(false);
  useEffect(() => {
    if (!redirected.current) {
      redirected.current = true;
      setLocation(isProfileComplete ? '/lobby' : '/profile-setup');
    }
  }, [isProfileComplete, setLocation]);
  return null;
}

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoading, isProfileComplete, profile, deviceId, resetProfile } = useDeviceIdentity();
  const { setPlayerInfo } = useGameStore();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (profile) {
      setPlayerInfo({
        playerId: deviceId,
        username: profile.username,
        avatar: profile.avatar,
        birthYear: profile.birth_year ?? undefined,
      });
    }
  }, [profile, deviceId, setPlayerInfo]);

  useEffect(() => {
    if (!profile || isLoading) return;
    supabase
      .from('device_sessions')
      .select('last_active')
      .eq('device_id', deviceId)
      .single()
      .then(({ data }) => {
        if (data?.last_active) {
          const age = Date.now() - new Date(data.last_active).getTime();
          if (age > SESSION_TIMEOUT_MS) {
            localStorage.removeItem(DEVICE_ID_KEY);
            resetProfile().then(() => setLocation('/profile-setup'));
          }
        }
      });
  }, [profile, deviceId, isLoading, resetProfile, setLocation]);

  useEffect(() => {
    if (isLoading) return;
    if (location === '/auth') {
      setLocation('/');
      return;
    }
    if (!isProfileComplete && location !== '/profile-setup' && !location.startsWith('/privacy-policy')) {
      setLocation('/profile-setup');
      return;
    }
    if (isProfileComplete && (location === '/' || location === '/profile-setup')) {
      setLocation('/lobby');
      return;
    }
  }, [isLoading, isProfileComplete, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
          <p className="text-white/60 text-sm">Loading Sparks…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/profile" component={Profile} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/lobby" component={Lobby} />
        <Route path="/room/:code" component={WaitingRoom} />
        <Route path="/game/:code" component={Game} />
        <Route path="/results/:code" component={Results} />
        <Route>
          <NotFound isProfileComplete={isProfileComplete} />
        </Route>
      </Switch>

      {isProfileComplete && profile && !profile.privacy_accepted && (
        <PrivacyPopup onAccepted={() => {}} />
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <DeviceIdentityProvider>
            <AppRoutes />
          </DeviceIdentityProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
