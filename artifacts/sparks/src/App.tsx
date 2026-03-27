import { useEffect } from 'react';
import { Switch, Route, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WsProvider } from '@/hooks/ws-context';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { PrivacyPopup } from '@/components/privacy-popup';
import { useGameStore } from '@/store/use-game-store';

import Auth from './pages/auth';
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

const PUBLIC_PATHS = ['/auth', '/privacy-policy'];

function AppRoutes() {
  const { isLoading, isAuthenticated, isProfileComplete, profile } = useAuth();
  const { setPlayerInfo } = useGameStore();
  const [location, setLocation] = useLocation();

  // Sync auth profile into game store
  useEffect(() => {
    if (profile) {
      setPlayerInfo({
        playerId: profile.id,
        username: profile.username,
        avatar: profile.avatar,
        birthYear: profile.birth_year ?? undefined,
      });
    }
  }, [profile, setPlayerInfo]);

  // Auth guard routing
  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.some(p => location.startsWith(p));

    if (!isAuthenticated && !isPublic) {
      setLocation('/auth');
      return;
    }
    if (isAuthenticated && !isProfileComplete && location !== '/profile-setup' && !isPublic) {
      setLocation('/profile-setup');
      return;
    }
    if (isAuthenticated && isProfileComplete && (location === '/auth' || location === '/')) {
      setLocation('/lobby');
      return;
    }
  }, [isLoading, isAuthenticated, isProfileComplete, location, setLocation]);

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
        <Route path="/auth" component={Auth} />
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/profile" component={Profile} />
        <Route path="/privacy-policy" component={PrivacyPolicyPage} />
        <Route path="/lobby" component={Lobby} />
        <Route path="/room/:code" component={WaitingRoom} />
        <Route path="/game/:code" component={Game} />
        <Route path="/results/:code" component={Results} />
        <Route component={NotFound} />
      </Switch>

      {/* Privacy popup — shown once after profile setup until accepted */}
      {isAuthenticated && isProfileComplete && profile && !profile.privacy_accepted && (
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
          <AuthProvider>
            <WsProvider>
              <AppRoutes />
            </WsProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
