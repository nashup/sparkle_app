import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { clearDeviceSession } from '@/pages/lobby';
import { useRoom } from '@/hooks/use-room';
import { updateGameState } from '@/lib/rooms';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/session';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { ChatPopup } from '@/components/chat-popup';
import { Button } from '@/components/ui/button';
import { Trophy, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const QUESTIONS_PER_GAME = 10;
const REACTIONS = ['❤️', '🔥', '😂', '🥵', '😳'];

export default function Results() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom, floatingReactions, leaveRoom } = useGameStore();
  const { sendChat, sendReaction, setChatOpen } = useRoom(code);
  const [sentReactions, setSentReactions] = useState<Record<string, number>>({});
  const [partnerLeft, setPartnerLeft] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const internalTransitionRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    const deviceId = getDeviceId();
    internalTransitionRef.current = false;
    const tick = () => supabase.from('device_sessions').upsert({
      device_id: deviceId,
      room_code: code,
      last_active: new Date().toISOString(),
    }, { onConflict: 'device_id' });
    tick();
    const interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      if (!internalTransitionRef.current) {
        supabase.from('device_sessions').update({
          room_code: null,
          last_active: new Date().toISOString(),
        }).eq('device_id', deviceId).then(() => {});
      }
    };
  }, [code]);

  useEffect(() => {
    confetti({
      particleCount: 80, spread: 70, origin: { y: 0.5 },
      colors: ['#ff007f', '#7f00ff', '#ff7f00', '#ff69b4']
    });
  }, []);

  useEffect(() => {
    if (!currentRoom || !code) return;
    if (currentRoom.gameState.phase === 'playing') {
      internalTransitionRef.current = true;
      setLocation(`/game/${code}`);
    }
    if (currentRoom.gameState.phase === 'lobby') {
      internalTransitionRef.current = true;
      setLocation(`/room/${code}`);
    }
  }, [currentRoom?.gameState?.phase, code, setLocation]);

  useEffect(() => {
    if (!currentRoom || !code) return;
    const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);
    if (!partner) return;

    const channel = supabase.channel(`partner-session-${partner.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_sessions',
          filter: `device_id=eq.${partner.id}`,
        },
        (payload) => {
          const updated = payload.new as { room_code: string | null };
          if (updated.room_code === null) {
            setPartnerLeft(true);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentRoom, code, playerInfo.playerId]);

  useEffect(() => {
    if (!currentRoom || !code) return;
    const { readyPlayers, phase } = currentRoom.gameState;
    if (phase !== 'results') return;
    const isHost = currentRoom.players[0]?.id === playerInfo.playerId;
    if (!isHost) return;

    const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);
    if (!partner) return;

    const bothReady = readyPlayers.includes(playerInfo.playerId) && readyPlayers.includes(partner.id);
    if (!bothReady) return;

    const nextIndex = currentRoom.gameState.currentCardIndex + 1;
    const isLast = nextIndex >= QUESTIONS_PER_GAME;

    setIsUpdating(true);
    if (isLast) {
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.4 } });
      updateGameState(code, {
        ...currentRoom.gameState,
        phase: 'lobby',
        answers: {},
        readyPlayers: [],
        currentCardIndex: 0,
        skipsUsed: 0,
      }).finally(() => setIsUpdating(false));
    } else {
      internalTransitionRef.current = true;
      updateGameState(code, {
        ...currentRoom.gameState,
        phase: 'playing',
        currentCardIndex: nextIndex,
        answers: {},
        readyPlayers: [],
        currentTurn: partner.id,
      }).finally(() => setIsUpdating(false));
    }
  }, [currentRoom?.gameState?.readyPlayers, currentRoom?.gameState?.phase]);

  if (!currentRoom) return null;

  const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);
  const myAnswer = currentRoom.gameState.answers[playerInfo.playerId] || '…skipped';
  const partnerAnswer = partner ? currentRoom.gameState.answers[partner.id] || '…waiting' : '…';
  const isHost = currentRoom.players[0]?.id === playerInfo.playerId;
  const isLevelComplete = currentRoom.gameState.currentCardIndex + 1 >= QUESTIONS_PER_GAME;
  const readyPlayers = currentRoom.gameState.readyPlayers ?? [];
  const amIReady = readyPlayers.includes(playerInfo.playerId);
  const isPartnerReady = partner ? readyPlayers.includes(partner.id) : false;

  const handleToggleReady = useCallback(async () => {
    if (!code || !currentRoom || isUpdating) return;
    const current = currentRoom.gameState.readyPlayers ?? [];
    const updated = current.includes(playerInfo.playerId)
      ? current.filter(id => id !== playerInfo.playerId)
      : [...current, playerInfo.playerId];
    setIsUpdating(true);
    try {
      await updateGameState(code, { ...currentRoom.gameState, readyPlayers: updated });
    } finally {
      setIsUpdating(false);
    }
  }, [code, currentRoom, playerInfo.playerId, isUpdating]);

  const handleEndGame = useCallback(async () => {
    if (!code || !currentRoom || isUpdating) return;
    internalTransitionRef.current = true;
    setIsUpdating(true);
    try {
      await updateGameState(code, {
        ...currentRoom.gameState,
        phase: 'lobby',
        answers: {},
        readyPlayers: [],
        currentCardIndex: 0,
        skipsUsed: 0,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [code, currentRoom, isUpdating]);

  const handleLeaveRoom = useCallback(async () => {
    internalTransitionRef.current = true;
    await clearDeviceSession();
    leaveRoom();
    setLocation('/lobby');
  }, [leaveRoom, setLocation]);

  const handleReaction = (emoji: string) => {
    sendReaction(emoji);
    setSentReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-5 h-full overflow-y-auto hide-scrollbar relative">

        {partnerLeft && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl p-8 text-center max-w-sm w-full space-y-4"
            >
              <div className="text-6xl">😢</div>
              <h2 className="text-2xl font-black text-white">
                {partner?.username || 'Your partner'} left the room
              </h2>
              <p className="text-white/60 text-sm">Looks like they had to go…</p>
              <Button variant="primary" className="w-full" onClick={handleLeaveRoom}>
                Return to Home
              </Button>
            </motion.div>
          </div>
        )}

        {isLevelComplete ? (
          <div className="flex flex-col items-center justify-center text-center py-6 gap-2">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h2 className="text-3xl font-black text-white text-glow">Game Complete!</h2>
            <p className="text-white/60 text-sm">You made it through all the questions 🎉</p>
          </div>
        ) : (
          <h2 className="text-3xl font-black text-white text-center mt-4 mb-1 text-glow">The Reveal!</h2>
        )}

        <div className="flex flex-col gap-4 mt-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-3xl p-5 relative"
          >
            <div className="absolute -top-5 left-5 w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
              {playerInfo.avatar}
            </div>
            <div className="mt-3">
              <p className="text-white/50 text-xs mb-1">{playerInfo.username} (you)</p>
              <p className="text-white text-lg font-bold leading-snug">{myAnswer}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="glass-card rounded-3xl p-5 relative"
          >
            <div className="absolute -top-5 right-5 w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-lg">
              {partner?.avatar}
            </div>
            <div className="mt-3 text-right">
              <p className="text-white/50 text-xs mb-1">{partner?.username}</p>
              <p className="text-white text-lg font-bold leading-snug">{partnerAnswer}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-panel rounded-full py-2 px-3 flex justify-center gap-1"
          >
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="relative w-12 h-12 rounded-full hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center text-2xl"
              >
                {emoji}
                {sentReactions[emoji] ? (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {sentReactions[emoji]}
                  </span>
                ) : null}
              </button>
            ))}
          </motion.div>
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingReactions.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 1, y: '80%', scale: 0.5 }}
                animate={{ opacity: 0, y: '10%', scale: 2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="absolute text-4xl"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-6 space-y-3 flex-shrink-0 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              className="w-full"
              size="lg"
              variant={amIReady ? 'secondary' : 'primary'}
              onClick={handleToggleReady}
              disabled={isUpdating}
            >
              <CheckCircle2 className={`mr-2 w-5 h-5 ${amIReady ? 'text-emerald-300' : ''}`} />
              {amIReady ? "Ready ✓" : "I'm Ready"}
              {isPartnerReady && !amIReady && (
                <span className="ml-2 text-xs text-white/60">{partner?.username} is ready</span>
              )}
            </Button>

            <div className="flex justify-center items-center gap-3 mt-2">
              <div className={`flex items-center gap-1.5 text-xs font-medium ${amIReady ? 'text-emerald-300' : 'text-white/40'}`}>
                <span>{playerInfo.avatar}</span>
                {amIReady ? '✓' : '…'}
              </div>
              <span className="text-white/20 text-xs">·</span>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${isPartnerReady ? 'text-emerald-300' : 'text-white/40'}`}>
                <span>{partner?.avatar || '?'}</span>
                {isPartnerReady ? '✓' : '…'}
              </div>
            </div>
          </motion.div>

          {isHost && (
            <Button className="w-full opacity-60" size="lg" variant="ghost" onClick={handleEndGame} disabled={isUpdating}>
              {isLevelComplete ? <><Trophy className="mr-2 w-5 h-5" /> Play Again</> : 'End Game'}
            </Button>
          )}
        </div>
      </div>

      <button
        onClick={handleLeaveRoom}
        className="absolute bottom-20 right-4 z-10 flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs transition-colors bg-black/20 hover:bg-black/30 rounded-full px-3 py-1.5 backdrop-blur-sm"
      >
        <LogOut className="w-3.5 h-3.5" /> Leave Room
      </button>

      <ChatPopup sendChat={sendChat} setChatOpen={setChatOpen} />
    </LayoutWrapper>
  );
}
