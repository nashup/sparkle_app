import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/use-game-store';
import { AVATARS } from '@/data/questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { LayoutWrapper } from '@/components/layout-wrapper';

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const { setPlayerInfo } = useGameStore();

  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthYearLocked, setBirthYearLocked] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata || {};
    if (meta.full_name || meta.name) {
      const parts = (meta.full_name || meta.name || '').split(' ');
      setFirstName(meta.given_name || parts[0] || '');
      setLastName(meta.family_name || parts.slice(1).join(' ') || '');
    }
    if (meta.first_name) setFirstName(meta.first_name);
    if (meta.last_name) setLastName(meta.last_name);

    // Check if birth year came from Google (some providers include birthdate)
    if (meta.birth_year) {
      setBirthYear(String(meta.birth_year));
      setBirthYearLocked(true);
    }
  }, [user]);

  const checkUsername = useCallback(async (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleaned !== val) { setUsernameStatus('invalid'); return; }
    if (val.length < 3) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', val)
      .neq('id', user?.id ?? '')
      .single();
    setUsernameStatus(data ? 'taken' : 'ok');
  }, [user?.id]);

  useEffect(() => {
    if (username.length < 3) { setUsernameStatus('idle'); return; }
    const t = setTimeout(() => checkUsername(username), 500);
    return () => clearTimeout(t);
  }, [username, checkUsername]);

  const handleSave = async () => {
    if (!user) return;
    const year = parseInt(birthYear);
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your full name.'); return; }
    if (usernameStatus !== 'ok') { setError('Please choose a valid, available username.'); return; }
    if (!year || year < 1900 || year > new Date().getFullYear()) { setError('Please enter a valid birth year.'); return; }
    setSaving(true);
    setError('');
    try {
      const { error: err } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        avatar,
        birth_year: year,
        birth_year_locked: birthYearLocked,
        updated_at: new Date().toISOString(),
      });
      if (err) throw err;
      // Sync to local game store
      setPlayerInfo({ playerId: user.id, username: username.trim(), avatar, birthYear: year });
      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const usernameIcon = () => {
    if (usernameStatus === 'checking') return <Loader2 className="w-4 h-4 text-white/50 animate-spin" />;
    if (usernameStatus === 'ok') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (usernameStatus === 'taken') return <XCircle className="w-4 h-4 text-red-400" />;
    if (usernameStatus === 'invalid') return <XCircle className="w-4 h-4 text-red-400" />;
    return null;
  };

  const step1Valid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const step2Valid = usernameStatus === 'ok';
  const step3Valid = birthYear.length === 4 && !isNaN(parseInt(birthYear));

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-2">
          <h1 className="text-2xl font-black text-white text-center">Set Up Your Profile</h1>
          <p className="text-white/60 text-sm text-center mb-6">Just once — saved forever.</p>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'w-6 bg-white' : s < step ? 'w-2 bg-white/60' : 'w-2 bg-white/20'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Name */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="glass-card rounded-3xl p-6 space-y-4">
                <Label className="text-white font-bold text-lg block">What's your name?</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/60 text-xs mb-1 block">First Name</Label>
                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Alex"
                      className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-white/60 text-xs mb-1 block">Last Name</Label>
                    <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith"
                      className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl" />
                  </div>
                </div>
                <Button className="w-full" variant="primary" size="lg" onClick={() => setStep(2)} disabled={!step1Valid}>
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Step 2: Username */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="glass-card rounded-3xl p-6 space-y-4">
                <Label className="text-white font-bold text-lg block">Pick a username</Label>
                <p className="text-white/50 text-xs">Lowercase letters, numbers and underscores only.</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">@</span>
                  <Input value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
                    placeholder="sparksuser"
                    className="h-12 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl pl-8 pr-10" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">{usernameIcon()}</span>
                </div>
                {usernameStatus === 'taken' && <p className="text-red-300 text-xs">Username taken. Try another.</p>}
                {usernameStatus === 'invalid' && <p className="text-red-300 text-xs">3+ characters, letters/numbers/_ only.</p>}
                {usernameStatus === 'ok' && <p className="text-green-300 text-xs">Username available!</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" size="lg" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button className="flex-1" variant="primary" size="lg" onClick={() => setStep(3)} disabled={!step2Valid}>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Avatar */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="glass-card rounded-3xl p-6 space-y-4">
                <Label className="text-white font-bold text-lg block">Choose your avatar</Label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map(emoji => (
                    <button key={emoji} onClick={() => setAvatar(emoji)}
                      className={`text-3xl h-16 w-full rounded-2xl flex items-center justify-center transition-all ${avatar === emoji ? 'bg-white/30 border-2 border-white scale-105 shadow-lg' : 'bg-white/5 border border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="lg" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button className="flex-1" variant="primary" size="lg" onClick={() => setStep(4)}>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Birth Year */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="glass-card rounded-3xl p-6 space-y-4">
                <Label className="text-white font-bold text-lg block">Year of birth</Label>
                <p className="text-white/50 text-xs">Used to unlock spicy levels (18+).{birthYearLocked && ' Locked from your account.'}</p>
                <Input type="number" value={birthYear} onChange={e => !birthYearLocked && setBirthYear(e.target.value.slice(0, 4))}
                  placeholder="YYYY" disabled={birthYearLocked}
                  className="h-14 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-2xl text-center text-2xl font-bold tracking-widest disabled:opacity-60 disabled:cursor-not-allowed" />
                {error && <p className="text-red-300 text-xs text-center">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="secondary" size="lg" onClick={() => setStep(3)} className="flex-1" disabled={saving}>Back</Button>
                  <Button className="flex-1" variant="primary" size="lg" onClick={handleSave} disabled={!step3Valid || saving}>
                    {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</> : "Let's Play 🔥"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LayoutWrapper>
  );
}
