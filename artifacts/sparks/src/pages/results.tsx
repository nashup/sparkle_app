import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useAuth } from '@/hooks/use-auth';
import { clearDeviceSession } from '@/pages/lobby';
import { useWs } from '@/hooks/ws-context';
import { useUpdateGameState } from '@workspace/api-client-react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { ChatPopup } from '@/components/chat-popup';
import { Button } from '@/components/ui/button';
import { getQuestionsForGame, Question } from '@/data/questions';
import { ArrowRight, RefreshCcw, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const REACTIONS = ['❤️', '🔥', '😂', '🥵', '😳'];

export default function Results() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom, floatingReactions, leaveRoom } = useGameStore();
  const { user } = useAuth();
  const { sendChat: wsSendChat, sendReaction: wsSendReaction, setChatOpen, joinRoom } = useWs();
  const sendChat = (text: string) => wsSendChat(text, code || '');
  const sendReaction = (emoji: string) => wsSendReaction(emoji, code || '');

  useEffect(() => {
    if (code) joinRoom(code);
  }, [code, joinRoom]);
  const updateStateMutation = useUpdateGameState();

  const [sentReactions, setSentReactions] = useState<Record<string, number>>({});

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#ff007f', '#7f00ff', '#ff7f00', '#ff69b4']
    });
  }, []);

  useEffect(() => {
    if (currentRoom?.gameState?.phase === 'playing') {
      setLocation(`/game/${code}`);
    }
  }, [currentRoom?.gameState?.phase, code, setLocation]);

  if (!currentRoom) return null;

  const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);
  const myAnswer = currentRoom.gameState.answers[playerInfo.playerId] || '…skipped';
  const partnerAnswer = partner ? currentRoom.gameState.answers[partner.id] || '…waiting' : '…';
  const isHost = currentRoom.players[0]?.id === playerInfo.playerId;

  // Check if next round would exceed questions
  const totalQuestions = currentRoom.gameState.gameType
    ? getQuestionsForGame(
        currentRoom.gameState.gameType as Question['type'],
        currentRoom.gameState.intimacyLevel,
        code || ''
      ).length
    : 0;

  const isLevelComplete = currentRoom.gameState.currentCardIndex + 1 >= totalQuestions;

  const handleNextRound = () => {
    updateStateMutation.mutate({
      code: code!,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          phase: 'playing',
          currentCardIndex: currentRoom.gameState.currentCardIndex + 1,
          answers: {},
          currentTurn: partner?.id ?? null
        }
      }
    });
  };

  const handleLevelComplete = async () => {
    confetti({ particleCount: 150, spread: 120, origin: { y: 0.4 } });
    if (user) await clearDeviceSession(user.id);
    leaveRoom();
    setLocation('/lobby');
  };

  const handleReaction = (emoji: string) => {
    sendReaction(emoji);
    setSentReactions(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-5 h-full overflow-y-auto hide-scrollbar relative">

        {isLevelComplete ? (
          <div className="flex flex-col items-center justify-center text-center py-6 gap-2">
            <Trophy className="w-10 h-10 text-yellow-400" />
            <h2 className="text-3xl font-black text-white text-glow">Level Complete!</h2>
            <p className="text-white/60 text-sm">You made it through all the questions 🎉</p>
          </div>
        ) : (
          <h2 className="text-3xl font-black text-white text-center mt-4 mb-1 text-glow">The Reveal!</h2>
        )}

        <div className="flex flex-col gap-4 mt-4">

          {/* My answer */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
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

          {/* Partner answer */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
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

          {/* Emoji reactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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

        {/* Floating reactions display */}
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

        {/* Buttons */}
        <div className="mt-6 space-y-3 flex-shrink-0 pb-4">
          {isHost ? (
            <>
              {isLevelComplete ? (
                <Button
                  className="w-full"
                  size="lg"
                  variant="primary"
                  onClick={handleLevelComplete}
                  disabled={updateStateMutation.isPending}
                >
                  <Trophy className="mr-2 w-5 h-5" /> Back to Lobby
                </Button>
              ) : (
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
                    onClick={handleLevelComplete}
                    disabled={updateStateMutation.isPending}
                  >
                    End Game <RefreshCcw className="ml-2 w-5 h-5" />
                  </Button>
                </>
              )}
            </>
          ) : (
            <div className="glass-card p-4 rounded-2xl text-center">
              <p className="text-white font-medium animate-pulse">Waiting for host…</p>
            </div>
          )}
        </div>
      </div>

      <ChatPopup sendChat={sendChat} setChatOpen={setChatOpen} />
    </LayoutWrapper>
  );
}
