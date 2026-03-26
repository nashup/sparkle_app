import { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useWs } from '@/hooks/ws-context';
import { useUpdateGameState } from '@workspace/api-client-react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Copy, Play, Lock, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GameStateGameType } from '@workspace/api-client-react';

export default function WaitingRoom() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom, isAdult } = useGameStore();
  const { toast } = useToast();
  
  const { isConnected, joinRoom } = useWs();

  useEffect(() => {
    if (code) joinRoom(code);
  }, [code, joinRoom]);

  const updateStateMutation = useUpdateGameState();

  // Watch for game start
  useEffect(() => {
    if (currentRoom?.gameState?.phase === 'playing') {
      setLocation(`/game/${code}`);
    }
  }, [currentRoom?.gameState?.phase, code, setLocation]);

  if (!currentRoom || !code) {
    return (
      <LayoutWrapper>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      </LayoutWrapper>
    );
  }

  const isHost = currentRoom.players[0]?.id === playerInfo.playerId;
  const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Room code copied to clipboard." });
  };

  const setLevel = (level: number) => {
    if ((level === 3 || level === 4) && !isAdult()) {
      toast({
        title: "Locked",
        description: "Levels 3 and 4 are for 18+ only.",
        variant: "destructive"
      });
      return;
    }
    
    updateStateMutation.mutate({
      code,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          intimacyLevel: level
        }
      }
    });
  };

  const setType = (type: GameStateGameType) => {
    updateStateMutation.mutate({
      code,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          gameType: type
        }
      }
    });
  };

  const startGame = () => {
    if (!currentRoom.gameState.gameType) {
      toast({ title: "Select a game type first", variant: "destructive" });
      return;
    }
    if (!partner) {
       toast({ title: "Wait for partner to join", variant: "destructive" });
       return;
    }
    
    updateStateMutation.mutate({
      code,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          phase: 'playing',
          currentTurn: currentRoom.players[0].id // Host goes first
        }
      }
    });
  };

  const GAME_TYPES = [
    { id: 'know-me-better' as GameStateGameType, label: 'Know Me Better', desc: 'Questions about each other' },
    { id: 'pick-one' as GameStateGameType, label: 'Pick One', desc: 'This or that scenarios' },
    { id: 'dare-reveal' as GameStateGameType, label: 'Dare or Reveal', desc: 'Spice things up' }
  ];

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-6 h-full overflow-y-auto hide-scrollbar">
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">Room Code</p>
          <div 
            onClick={handleCopy}
            className="inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-6 py-2 rounded-2xl cursor-pointer backdrop-blur-sm border border-white/20"
          >
            <h1 className="text-4xl font-display font-black text-white tracking-widest">{code}</h1>
            <Copy className="w-5 h-5 text-white/70" />
          </div>
          {!isConnected && <p className="text-red-300 text-xs mt-2 animate-pulse">Connecting to server...</p>}
        </div>

        <div className="flex justify-between items-center gap-4 mb-8">
          <div className="flex-1 glass-card rounded-2xl p-4 flex flex-col items-center justify-center">
            <span className="text-4xl mb-2">{playerInfo.avatar}</span>
            <span className="text-white font-bold truncate w-full text-center">{playerInfo.username}</span>
            <span className="text-xs text-white/50 mt-1">You</span>
          </div>
          
          <div className="text-white/30 text-2xl font-bold font-display">VS</div>
          
          <div className={`flex-1 rounded-2xl p-4 flex flex-col items-center justify-center border border-dashed transition-all ${partner ? 'glass-card border-solid border-white/30' : 'bg-black/20 border-white/20'}`}>
            {partner ? (
              <>
                <span className="text-4xl mb-2">{partner.avatar}</span>
                <span className="text-white font-bold truncate w-full text-center">{partner.username}</span>
                <span className="text-xs text-emerald-300 mt-1">Ready</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse mb-2"></div>
                <span className="text-white/40 text-sm font-medium">Waiting...</span>
              </>
            )}
          </div>
        </div>

        {/* Settings Area */}
        <div className="space-y-6 flex-1">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-white font-bold text-lg">Intimacy Level</label>
              <span className="text-primary-foreground/70 text-sm font-medium flex items-center gap-1">
                Level {currentRoom.gameState.intimacyLevel} <Flame className="w-4 h-4 text-orange-400" />
              </span>
            </div>
            
            <div className="glass-panel rounded-2xl p-2 flex gap-2">
              {[1, 2, 3, 4].map((level) => {
                const isActive = currentRoom.gameState.intimacyLevel === level;
                const isLocked = (level === 3 || level === 4) && !isAdult();
                
                return (
                  <button
                    key={level}
                    disabled={!isHost}
                    onClick={() => setLevel(level)}
                    className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-gradient-primary text-white shadow-lg' 
                        : 'bg-transparent text-white/60 hover:bg-white/10'
                    } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {isLocked ? <Lock className="w-5 h-5 mb-1 opacity-50" /> : <span className="font-bold">{level}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-white font-bold text-lg">Game Type</label>
            <div className="space-y-2">
              {GAME_TYPES.map((type) => (
                <button
                  key={type.id}
                  disabled={!isHost}
                  onClick={() => setType(type.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    currentRoom.gameState.gameType === type.id
                      ? 'bg-white/20 border-white/50 shadow-md backdrop-blur-md'
                      : 'bg-black/20 border-white/10 hover:bg-white/10'
                  } ${!isHost && 'cursor-default'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                       currentRoom.gameState.gameType === type.id ? 'border-primary' : 'border-white/30'
                    }`}>
                      {currentRoom.gameState.gameType === type.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{type.label}</h3>
                      <p className="text-white/50 text-xs">{type.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4">
          {isHost ? (
            <Button 
              className="w-full" 
              size="lg" 
              variant="primary"
              onClick={startGame}
              disabled={!partner || !currentRoom.gameState.gameType || updateStateMutation.isPending}
            >
              <Play className="mr-2 w-5 h-5 fill-current" /> 
              Start Game
            </Button>
          ) : (
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-white font-medium">Waiting for Host to start...</p>
            </div>
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
