import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useWs } from '@/hooks/ws-context';
import { useUpdateGameState } from '@workspace/api-client-react';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device';
import { HEARTBEAT_INTERVAL_MS } from '@/lib/session';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { ChatPopup } from '@/components/chat-popup';
import { getQuestionsForGame, Question } from '@/data/questions';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Game() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom, floatingReactions } = useGameStore();

  const { sendChat: wsSendChat, sendReaction: wsSendReaction, setChatOpen, joinRoom } = useWs();
  const sendChat = useCallback((text: string) => wsSendChat(text, code || ''), [wsSendChat, code]);
  const sendReaction = useCallback((emoji: string) => wsSendReaction(emoji, code || ''), [wsSendReaction, code]);

  useEffect(() => {
    if (code) joinRoom(code);
  }, [code, joinRoom]);

  // Heartbeat — keep device session alive while in game
  useEffect(() => {
    if (!code) return;
    const deviceId = getDeviceId();
    const tick = () => supabase.from('device_sessions').update({
      last_active: new Date().toISOString(),
    }).eq('device_id', deviceId);
    tick();
    const interval = setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [code]);

  const updateStateMutation = useUpdateGameState();

  const [answer, setAnswer] = useState('');
  const [countdown, setCountdown] = useState<number | null>(3);
  const [prevCardIndex, setPrevCardIndex] = useState<number>(-1);

  // Seeded question list — same order for both players
  const activeQuestions = useMemo(() => {
    if (!currentRoom?.gameState.gameType) return [];
    return getQuestionsForGame(
      currentRoom.gameState.gameType as Question['type'],
      currentRoom.gameState.intimacyLevel,
      code || ''
    );
  }, [currentRoom?.gameState.gameType, currentRoom?.gameState.intimacyLevel, code]);

  const cardIndex = currentRoom?.gameState.currentCardIndex ?? 0;
  const currentQuestion = activeQuestions[cardIndex] ?? null;
  const partner = currentRoom?.players.find(p => p.id !== playerInfo.playerId);
  const hasMyAnswer = !!currentRoom?.gameState.answers[playerInfo.playerId];
  const hasBothAnswers = currentRoom
    ? Object.keys(currentRoom.gameState.answers).length >= 2
    : false;

  // Countdown on new card
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

  // Route to results when both answered
  useEffect(() => {
    if (!currentRoom || !code) return;
    if (currentRoom.gameState.phase === 'results') {
      setLocation(`/results/${code}`);
    }
    if (currentRoom.gameState.phase === 'lobby') {
      setLocation(`/room/${code}`);
    }
  }, [currentRoom?.gameState.phase, code, setLocation]);

  // If both answered, move to results phase (only host triggers this)
  const isHost = currentRoom?.players[0]?.id === playerInfo.playerId;
  useEffect(() => {
    if (!hasBothAnswers || !isHost || !code || !currentRoom) return;
    if (currentRoom.gameState.phase !== 'playing') return;
    const t = setTimeout(() => {
      updateStateMutation.mutate({
        code,
        data: {
          playerId: playerInfo.playerId,
          gameState: { ...currentRoom.gameState, phase: 'results' }
        }
      });
    }, 400);
    return () => clearTimeout(t);
  }, [hasBothAnswers, isHost]);

  const handleSubmit = useCallback((selectedAnswer: string) => {
    if (hasMyAnswer || countdown !== null || !currentRoom) return;
    const newAnswers = { ...currentRoom.gameState.answers, [playerInfo.playerId]: selectedAnswer };
    updateStateMutation.mutate({
      code: code!,
      data: {
        playerId: playerInfo.playerId,
        gameState: { ...currentRoom.gameState, answers: newAnswers }
      }
    });
    setAnswer('');
  }, [hasMyAnswer, countdown, currentRoom, playerInfo.playerId, code, updateStateMutation]);

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
        {/* Header */}
        <div className="flex justify-between items-center mb-4 glass-panel rounded-full px-4 py-2 flex-shrink-0">
          <span className="text-white/70 text-sm font-bold">
            {cardIndex + 1} / {activeQuestions.length}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-white/60 text-xs mr-1">
              Lvl {currentRoom.gameState.intimacyLevel} {levelEmojis[currentRoom.gameState.intimacyLevel]}
            </span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-lg">{playerInfo.avatar}</span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 text-lg">{partner?.avatar}</span>
          </div>
        </div>

        {/* Countdown overlay */}
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

        {/* Card */}
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

                {/* Answer area — disabled during countdown */}
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
                          disabled={updateStateMutation.isPending}
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
                        disabled={!answer.trim() || updateStateMutation.isPending}
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

        {/* Floating reactions display */}
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
