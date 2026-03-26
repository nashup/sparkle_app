import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/use-game-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AVATARS } from '@/data/questions';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const [, setLocation] = useLocation();
  const { playerInfo, setPlayerInfo } = useGameStore();
  
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState(playerInfo.username || '');
  const [avatar, setAvatar] = useState(playerInfo.avatar || AVATARS[0]);
  const [birthYear, setBirthYear] = useState<string>(playerInfo.birthYear?.toString() || '');

  const handleNext = () => {
    if (step === 1 && username.trim().length > 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      const year = parseInt(birthYear);
      if (year > 1900 && year <= new Date().getFullYear()) {
        setPlayerInfo({ username, avatar, birthYear: year });
        setLocation('/lobby');
      }
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s'}}></div>
        
        <div className="w-full max-w-sm glass-card rounded-[32px] p-8 relative z-10">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shadow-lg border border-white/40">
               <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-display font-black text-white text-center mb-2">Sparks</h1>
          <p className="text-white/70 text-center mb-8 text-sm">Ignite your connection.</p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label className="text-white font-bold text-lg">What's your name?</Label>
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name or nickname"
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl text-lg px-5 focus-visible:ring-white/50"
                    maxLength={15}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  />
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  variant="primary"
                  onClick={handleNext}
                  disabled={username.trim().length < 2}
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label className="text-white font-bold text-lg">Pick an avatar</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {AVATARS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setAvatar(emoji)}
                        className={`text-3xl h-16 w-full rounded-2xl flex items-center justify-center transition-all ${
                          avatar === emoji 
                            ? 'bg-white/30 border-2 border-white scale-110 shadow-lg' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  variant="primary"
                  onClick={handleNext}
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <Label className="text-white font-bold text-lg">Birth Year</Label>
                  <p className="text-white/60 text-xs">Used to unlock spicy levels (18+ only).</p>
                  <Input 
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="YYYY"
                    className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-2xl text-lg px-5 text-center focus-visible:ring-white/50 tracking-widest"
                    maxLength={4}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  />
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  variant="primary"
                  onClick={handleNext}
                  disabled={birthYear.length !== 4}
                >
                  Let's Play <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex justify-center mt-6 gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'w-6 bg-white' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
