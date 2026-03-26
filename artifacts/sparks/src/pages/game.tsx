import { useEffect, useState, useMemo } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useWebSocket } from '@/hooks/use-websocket';
import { useUpdateGameState } from '@workspace/api-client-react';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { QUESTIONS, Question } from '@/data/questions';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Game() {
  const { code } = useParams();
  const [, setLocation] = useLocation();
  const { playerInfo, currentRoom } = useGameStore();
  
  // Keep socket alive
  useWebSocket(code);
  const updateStateMutation = useUpdateGameState();

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');

  // Get active questions based on room settings (memoized)
  const activeQuestions = useMemo(() => {
    if (!currentRoom) return [];
    return QUESTIONS.filter(q => 
      q.type === currentRoom.gameState.gameType && 
      q.level === currentRoom.gameState.intimacyLevel
    );
  }, [currentRoom?.gameState.gameType, currentRoom?.gameState.intimacyLevel]);

  // Route to results or update current question
  useEffect(() => {
    if (!currentRoom || !code) return;

    if (currentRoom.gameState.phase === 'results') {
      setLocation(`/results/${code}`);
      return;
    }

    const qIndex = currentRoom.gameState.currentCardIndex || 0;
    if (qIndex < activeQuestions.length) {
      setCurrentQuestion(activeQuestions[qIndex]);
    } else if (qIndex >= activeQuestions.length && activeQuestions.length > 0) {
      // Game over, go to results
      updateStateMutation.mutate({
        code,
        data: {
          playerId: playerInfo.playerId,
          gameState: {
            ...currentRoom.gameState,
            phase: 'results'
          }
        }
      });
    }
  }, [currentRoom?.gameState, activeQuestions, code, setLocation, updateStateMutation, playerInfo.playerId]);

  if (!currentRoom || !currentQuestion) {
    return <LayoutWrapper><div className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-white rounded-full"></div></div></LayoutWrapper>;
  }

  const isMyTurn = currentRoom.gameState.currentTurn === playerInfo.playerId;
  const partner = currentRoom.players.find(p => p.id !== playerInfo.playerId);

  const handleSubmit = (selectedAnswer: string) => {
    if (!isMyTurn) return;

    const newAnswers = { ...currentRoom.gameState.answers, [playerInfo.playerId]: selectedAnswer };
    const bothAnswered = Object.keys(newAnswers).length === 2;

    updateStateMutation.mutate({
      code: code!,
      data: {
        playerId: playerInfo.playerId,
        gameState: {
          ...currentRoom.gameState,
          answers: newAnswers,
          currentTurn: bothAnswered ? null : partner?.id,
          // If both answered, we move to a quick reveal state or next card. 
          // For simplicity, if both answered, we immediately go to results for this round, 
          // but our schema just has one global 'answers' dict. 
          // Let's just increment card index and clear answers to keep game going, 
          // OR if we want to show results per card, we change phase.
          // Let's do: when both answer, change phase to 'results'.
          phase: bothAnswered ? 'results' : 'playing'
        }
      }
    });
    setAnswer('');
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-6 h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 glass-panel rounded-full px-4 py-2">
           <span className="text-white/70 text-sm font-bold">Round {currentRoom.gameState.currentCardIndex + 1}/{activeQuestions.length}</span>
           <div className="flex gap-2">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMyTurn ? 'bg-primary border-2 border-white' : 'bg-white/20'}`}>{playerInfo.avatar}</div>
             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isMyTurn ? 'bg-primary border-2 border-white' : 'bg-white/20'}`}>{partner?.avatar}</div>
           </div>
        </div>

        {/* Main Card Area */}
        <div className="flex-1 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 1.05 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="glass-card rounded-[40px] p-8 min-h-[400px] flex flex-col shadow-2xl relative overflow-hidden"
            >
              {/* Card Decor */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-primary"></div>
              
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                <span className="text-primary-foreground/50 font-bold tracking-widest uppercase text-xs">
                  {currentQuestion.type.replace('-', ' ')}
                </span>
                
                <h2 className="text-3xl font-display font-bold text-white leading-tight">
                  {currentQuestion.text}
                </h2>

                {isMyTurn ? (
                  <div className="w-full mt-8">
                    {currentQuestion.options ? (
                      <div className="space-y-3 w-full">
                        {currentQuestion.options.map(opt => (
                          <Button 
                            key={opt}
                            variant="glass" 
                            className="w-full h-16 text-lg"
                            onClick={() => handleSubmit(opt)}
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                        <textarea 
                          className="w-full bg-black/20 border border-white/20 rounded-2xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          rows={3}
                          placeholder="Your answer..."
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                        />
                        <Button 
                          variant="primary" 
                          className="w-full"
                          disabled={!answer.trim() || updateStateMutation.isPending}
                          onClick={() => handleSubmit(answer)}
                        >
                          Submit Answer
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 p-6 rounded-2xl bg-black/20 border border-white/10 w-full">
                    <div className="animate-pulse flex flex-col items-center">
                      <span className="text-4xl mb-2">{partner?.avatar}</span>
                      <p className="text-white/60 font-medium">Waiting for {partner?.username} to answer...</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </LayoutWrapper>
  );
}
