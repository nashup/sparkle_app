import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmail = async () => {
    setError('');
    setSuccess('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && (!firstName || !lastName)) { setError('Please enter your full name.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { first_name: firstName, last_name: lastName } },
        });
        if (error) throw error;
        setSuccess('Account created! Please check your email to confirm.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
        scopes: 'openid email profile',
      },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)' }}
    >
      <div className="absolute top-10 right-10 w-40 h-40 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-3xl flex items-center justify-center shadow-lg border border-white/40 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>Sparks</h1>
          <p className="text-white/70 mt-1 text-sm">Ignite your connection.</p>
        </div>

        <div
          className="rounded-3xl p-6 space-y-5"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          {/* Tabs */}
          <div className="flex rounded-2xl bg-black/20 p-1 gap-1">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white/20 text-white shadow' : 'text-white/50 hover:text-white/80'}`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'signup' && (
              <motion.div
                key="name-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-white/80 text-xs mb-1 block">First Name</Label>
                    <Input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Alex"
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80 text-xs mb-1 block">Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl h-11"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-3">
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl h-12 pl-10"
                  onKeyDown={e => e.key === 'Enter' && handleEmail()}
                />
              </div>
            </div>
            <div>
              <Label className="text-white/80 text-xs mb-1 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl h-12 pr-10"
                  onKeyDown={e => e.key === 'Enter' && handleEmail()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-300 text-xs text-center bg-red-500/20 rounded-xl py-2 px-3">{error}</p>
          )}
          {success && (
            <p className="text-green-300 text-xs text-center bg-green-500/20 rounded-xl py-2 px-3">{success}</p>
          )}

          <Button
            className="w-full h-12 font-bold text-base"
            variant="primary"
            onClick={handleEmail}
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-xs">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm text-white/90 border border-white/20 hover:bg-white/10 active:bg-white/5 transition-all disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>
        </div>

        <p className="text-center text-white/40 text-xs mt-4">
          By continuing, you agree to our{' '}
          <a href="/privacy-policy" className="text-white/70 underline hover:text-white">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
