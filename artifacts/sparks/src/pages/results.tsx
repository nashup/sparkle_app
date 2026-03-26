import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useUpdateGameState } from '@workspace/api-client-react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Results() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom } = useGameStore();
  const updateStateMutation = useUpdateGameState();

  useEffect(() => {
    // Fire confetti on load
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff007f', '#7f00ff', '#ff7f00']
    });
  }, []);

  // Watch for next round trigger
  useEffect(() => {
    if (currentRoom?.gameState?.phase === 'playing') {
      setLocation(`/game/${code}`);
    } else if (currentRoom?.gameState?.phase === 'lobby') {
      setLocation(`/room/${code}`);
    }
  }, [currentRoom?.gameState?.phase, code, setLocation]);

  if (!currentRoom) return null;

  const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);
  const myAnswer = currentRoom.gameState.answers[playerInfo.playerId] || 'Skipped';
  const partnerAnswer = partner ? currentRoom.gameState.answers[partner.id] || 'Skipped' : '...';
  const isHost = currentRoom.players[0]?.id === playerInfo.playerId;

  const handleNextRound = () => {
    updateStateMutation.mutate({
      code: code!,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          phase: 'playing',
          currentCardIndex: currentRoom.gameState.currentCardIndex + 1,
          answers: {}, // reset answers for next round
          currentTurn: partner?.id // Alternate start turn
        }
      }
    });
  };

  const handleEndGame = () => {
    updateStateMutation.mutate({
      code: code!,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          phase: 'lobby',
          currentCardIndex: 0,
          answers: {},
          gameType: null
        }
      }
    });
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-6 h-full overflow-y-auto hide-scrollbar">
        <h2 className="text-3xl font-display font-black text-white text-center mt-4 mb-8 text-glow">The Reveal!</h2>

        <div className="flex-1 flex flex-col gap-6 justify-center">
          
          {/* My Answer */}
          <div className="glass-card rounded-3xl p-6 relative">
            <div className="absolute -top-6 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">
              {playerInfo.avatar}
            </div>
            <div className="mt-4">
              <p className="text-white/60 text-sm mb-1">{playerInfo.username}</p>
              <p className="text-white text-xl font-bold">{myAnswer}</p>
            </div>
          </div>

          {/* Partner Answer */}
          <div className="glass-card rounded-3xl p-6 relative">
             <div className="absolute -top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg">
              {partner?.avatar}
            </div>
            <div className="mt-4 text-right">
              <p className="text-white/60 text-sm mb-1">{partner?.username}</p>
              <p className="text-white text-xl font-bold">{partnerAnswer}</p>
            </div>
          </div>

          {/* Emoji Reactions Strip */}
          <div className="glass-panel rounded-full p-2 flex justify-center gap-2 mt-4">
            {['❤️', '🔥', '😂', '🥵', '😳'].map(emoji => (
              <button key={emoji} className="w-12 h-12 rounded-full hover:bg-white/20 text-2xl transition-all hover:scale-110 active:scale-95">
                {emoji}
              </button>
            ))}
          </div>

        </div>

        <div className="mt-8 space-y-3">
          {isHost ? (
            <>
              <Button 
                className="w-full" 
                size="lg" 
                variant="primary"
                onClick={handleNextRound}
                disabled={updateStateMutation.isPending}
              >
                Next Round <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                className="w-full" 
                size="lg" 
                variant="ghost"
                onClick={handleEndGame}
                disabled={updateStateMutation.isPending}
              >
                Back to Lobby <RefreshCcw className="ml-2 w-5 h-5" />
              </Button>
            </>
          ) : (
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-white font-medium">Waiting for Host...</p>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
