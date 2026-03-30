import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useRoom } from '@/hooks/use-room';
import { updateGameState } from '@/lib/rooms';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/session';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { ChatPopup } from '@/components/chat-popup';
import { getQuestionsForGame, Question } from '@/data/questions';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS_PER_GAME = 10;
const MAX_SKIPS = 3;

export default function Game() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom, floatingReactions } = useGameStore();
  const { sendChat, sendReaction, setChatOpen } = useRoom(code);

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

  const [answer, setAnswer] = useState('');
  const [countdown, setCountdown] = useState<number | null>(3);
  const [prevCardIndex, setPrevCardIndex] = useState<number>(-1);
  const [isUpdating, setIsUpdating] = useState(false);

  const activeQuestions = useMemo(() => {
    if (!currentRoom?.gameState.gameType) return [];
    return getQuestionsForGame(
      currentRoom.gameState.gameType as Question['type'],
      currentRoom.gameState.intimacyLevel,
      code || ''
    ).slice(0, QUESTIONS_PER_GAME);
  }, [currentRoom?.gameState.gameType, currentRoom?.gameState.intimacyLevel, code]);

  const cardIndex = currentRoom?.gameState.currentCardIndex ?? 0;
  const currentQuestion = activeQuestions[cardIndex] ?? null;
  const partner = currentRoom?.players.find(p => p.id !== playerInfo.playerId);
  const hasMyAnswer = !!currentRoom?.gameState.answers[playerInfo.playerId];
  const hasBothAnswers = currentRoom
    ? Object.keys(currentRoom.gameState.answers).length >= 2
    : false;
  const isHost = currentRoom?.players[0]?.id === playerInfo.playerId;
  const skipsUsed = currentRoom?.gameState.skipsUsed ?? 0;
  const canSkip = isHost && skipsUsed < MAX_SKIPS && !hasMyAnswer && countdown === null;

  useEffect(() => {
    if (cardIndex !== prevCardIndex) {
      setPrevCardIndex(cardIndex);
      setCountdown(3);
      setAnswer('');
    }
  }, [cardIndex, prevCardIndex]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      const t = setTimeout(() => setCountdown(null), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!currentRoom || !code) return;
    if (currentRoom.gameState.phase === 'results') {
      internalTransitionRef.current = true;
      setLocation(`/results/${code}`);
    }
    if (currentRoom.gameState.phase === 'lobby') {
      internalTransitionRef.current = true;
      setLocation(`/room/${code}`);
    }
  }, [currentRoom?.gameState.phase, code, setLocation]);

  // Host auto-advances to results screen when both players have submitted answers
  useEffect(() => {
    if (!hasBothAnswers || !isHost || !code || !currentRoom) return;
    if (currentRoom.gameState.phase !== 'playing') return;
    const t = setTimeout(async () => {
      setIsUpdating(true);
      try {
        await updateGameState(code, { ...currentRoom.gameState, phase: 'results' });
      } finally {
        setIsUpdating(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [hasBothAnswers, isHost]);

  const handleSubmit = useCallback(async (selectedAnswer: string) => {
    if (hasMyAnswer || countdown !== null || !currentRoom || !code) return;
    const newAnswers = { ...currentRoom.gameState.answers, [playerInfo.playerId]: selectedAnswer };
    setIsUpdating(true);
    try {
      await updateGameState(code, { ...currentRoom.gameState, answers: newAnswers });
    } finally {
      setIsUpdating(false);
    }
    setAnswer('');
  }, [hasMyAnswer, countdown, currentRoom, playerInfo.playerId, code]);

  const handleSkip = useCallback(async () => {
    if (!canSkip || !currentRoom || !code) return;
    setIsUpdating(true);
    try {
      const nextIndex = cardIndex + 1;
      const isLast = nextIndex >= QUESTIONS_PER_GAME;
      await updateGameState(code, {
        ...currentRoom.gameState,
        skipsUsed: skipsUsed + 1,
        currentCardIndex: isLast ? cardIndex : nextIndex,
        answers: {},
        readyPlayers: [],
        phase: isLast ? 'results' : 'playing',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [canSkip, currentRoom, code, cardIndex, skipsUsed]);

  if (!currentRoom || !currentQuestion) {
    return (
      <LayoutWrapper>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-white rounded-full border-t-transparent" />
        </div>
      </LayoutWrapper>
    );
  }

  const levelEmojis = ['', '😊', '😏', '🔥', '🥵'];

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-5 h-full relative">
        <div className="flex justify-between items-center mb-4 glass-panel rounded-full px-4 py-2 flex-shrink-0">
          <span className="text-white/70 text-sm font-bold">
            {cardIndex + 1} / {QUESTIONS_PER_GAME}
          </span>
          <div className="flex items-center gap-2">
            {isHost && (
              <button
                onClick={handleSkip}
                disabled={!canSkip || isUpdating}
                className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${canSkip && !isUpdating ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                title={skipsUsed >= MAX_SKIPS ? 'No skips left' : `Skip (${MAX_SKIPS - skipsUsed} left)`}
              >
                {skipsUsed >= MAX_SKIPS ? 'No skips left' : `Skip (${MAX_SKIPS - skipsUsed})`}
              </button>
            )}
            <span className="text-white/60 text-xs">
              Lvl {currentRoom.gameState.intimacyLevel} {levelEmojis[currentRoom.gameState.intimacyLevel]}
            </span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-lg">{playerInfo.avatar}</span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-lg">{partner?.avatar}</span>
          </div>
        </div>

        <AnimatePresence>
          {countdown !== null && (
            <motion.div
              key={`cd-${countdown}`}
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="text-[120px] font-black text-white drop-shadow-2xl select-none leading-none">
                {countdown === 0 ? '🔥' : countdown}
              </div>
              {countdown > 0 && (
                <p className="text-white/60 text-lg font-bold mt-2">Get ready!</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.04 }}
              transition={{ duration: 0.35, type: 'spring' }}
              className="glass-card rounded-[36px] p-7 flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-primary" />

              <div className="flex flex-col items-center text-center space-y-5">
                <span className="text-white/40 font-bold tracking-widest uppercase text-xs">
                  {currentQuestion.type.replace(/-/g, ' ')}
                </span>

                <h2 className="text-2xl font-bold text-white leading-snug">
                  {currentQuestion.text}
                </h2>

                <div className={`w-full mt-2 transition-opacity ${countdown !== null ? 'opacity-30 pointer-events-none' : ''}`}>
                  {hasMyAnswer ? (
                    <div className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 text-center">
                      <p className="text-white/60 text-sm mb-1">Your answer</p>
                      <p className="text-white font-bold">{currentRoom.gameState.answers[playerInfo.playerId]}</p>
                      {!hasBothAnswers && (
                        <div className="mt-3 flex items-center justify-center gap-2 animate-pulse">
                          <span className="text-xl">{partner?.avatar}</span>
                          <p className="text-white/50 text-sm">Waiting for {partner?.username}...</p>
                        </div>
                      )}
                    </div>
                  ) : currentQuestion.options ? (
                    <div className="space-y-2 w-full">
                      {currentQuestion.options.map(opt => (
                        <Button
                          key={opt}
                          variant="glass"
                          className="w-full h-14 text-base"
                          onClick={() => handleSubmit(opt)}
                          disabled={isUpdating}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      <textarea
                        className="w-full bg-black/20 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none text-sm"
                        rows={3}
                        placeholder="Type your answer..."
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                      />
                      <Button
                        variant="primary"
                        className="w-full"
                        disabled={!answer.trim() || isUpdating}
                        onClick={() => handleSubmit(answer)}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AnimatePresence>
            {floatingReactions.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 1, y: '80vh', scale: 0.5 }}
                animate={{ opacity: 0, y: '10vh', scale: 1.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.2, ease: 'easeOut' }}
                className="absolute text-4xl"
                style={{ left: `${r.x}%` }}
              >
                {r.emoji}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <ChatPopup sendChat={sendChat} setChatOpen={setChatOpen} />
    </LayoutWrapper>
  );
}
