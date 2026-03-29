import { useEffect } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WsProvider } from '@/hooks/ws-context';
import { DeviceIdentityProvider, useDeviceIdentity } from '@/hooks/use-device-identity';
import { PrivacyPopup } from '@/components/privacy-popup';
import { useGameStore } from '@/store/use-game-store';

import ProfileSetup from './pages/profile-setup';
import Profile from './pages/profile';
import PrivacyPolicyPage from './pages/privacy-policy';
import Lobby from './pages/lobby';
import WaitingRoom from './pages/waiting-room';
import Game from './pages/game';
import Results from './pages/results';
import NotFound from '@/pages/not-found';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function AppRoutes() {
  const { isLoading, isProfileComplete, profile, deviceId } = useDeviceIdentity();
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
    if (isLoading) return;
    // Legacy /auth route — always redirect away
    if (location === '/auth') {
      setLocation(isProfileComplete ? '/lobby' : '/profile-setup');
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
        <Route component={NotFound} />
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
            <WsProvider>
              <AppRoutes />
            </WsProvider>
          </DeviceIdentityProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
