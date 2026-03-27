import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useGameStore } from '@/store/use-game-store';
import { AVATARS } from '@/data/questions';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut, Edit2, Check, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { setPlayerInfo } = useGameStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [editingName, setEditingName] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState('🐱');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAvatar(profile.avatar || '🐱');
    }
  }, [profile]);

  const handleSaveName = async () => {
    if (!user || !firstName.trim() || !lastName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (!error) {
      await refreshProfile();
      toast({ title: 'Name updated!' });
    }
    setSaving(false);
    setEditingName(false);
  };

  const handleSaveAvatar = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      avatar,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (!error) {
      setPlayerInfo({ avatar });
      await refreshProfile();
      toast({ title: 'Avatar updated!' });
    }
    setSaving(false);
    setEditingAvatar(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/auth');
  };

  if (!profile) {
    return (
      <LayoutWrapper>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </LayoutWrapper>
    );
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username;

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-5 overflow-y-auto hide-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setLocation('/lobby')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-black text-lg">My Profile</h1>
          <button onClick={handleSignOut}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-white/70 hover:text-red-300 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-xl"
              style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.4), rgba(139,92,246,0.4))', border: '2px solid rgba(255,255,255,0.2)' }}>
              {profile.avatar}
            </div>
            <button onClick={() => setEditingAvatar(true)}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg hover:bg-pink-400 transition-colors">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="text-white font-black text-xl mt-3">{displayName}</h2>
          <p className="text-white/50 text-sm">@{profile.username}</p>
        </div>

        {/* Avatar picker */}
        {editingAvatar && (
          <div className="glass-card rounded-3xl p-4 mb-4 space-y-3">
            <p className="text-white font-bold text-sm">Choose avatar</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map(emoji => (
                <button key={emoji} onClick={() => setAvatar(emoji)}
                  className={`text-2xl h-12 rounded-xl flex items-center justify-center transition-all ${avatar === emoji ? 'bg-white/30 border-2 border-white scale-110' : 'bg-white/5 border border-white/10 hover:bg-white/15'}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setEditingAvatar(false); setAvatar(profile.avatar); }} disabled={saving}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveAvatar} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Save</>}
              </Button>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-3">
          {/* Name */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white/60 text-xs">Full Name</Label>
              {!editingName && (
                <button onClick={() => setEditingName(true)} className="text-pink-400 hover:text-pink-300 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingName ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First"
                    className="h-10 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl text-sm" />
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last"
                    className="h-10 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-xl text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setEditingName(false); setFirstName(profile.first_name || ''); setLastName(profile.last_name || ''); }} disabled={saving}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="primary" size="sm" className="flex-1" onClick={handleSaveName} disabled={saving || !firstName.trim() || !lastName.trim()}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-white font-semibold">{profile.first_name} {profile.last_name}</p>
            )}
          </div>

          {/* Email */}
          <div className="glass-card rounded-2xl p-4">
            <Label className="text-white/60 text-xs block mb-1">Email</Label>
            <p className="text-white font-semibold truncate">{profile.email || user?.email || '—'}</p>
          </div>

          {/* Birth Year */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white/60 text-xs block mb-1">Birth Year</Label>
                <p className="text-white font-semibold">{profile.birth_year || '—'}</p>
              </div>
              {profile.birth_year_locked && (
                <span className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg px-2 py-1">Locked</span>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="glass-card rounded-2xl p-4">
            <Label className="text-white/60 text-xs block mb-1">Username</Label>
            <p className="text-white font-semibold">@{profile.username}</p>
          </div>
        </div>

        <div className="mt-6">
          <Button variant="secondary" size="lg" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 w-4 h-4" /> Sign Out
          </Button>
        </div>

        <p className="text-center text-white/30 text-xs mt-4">
          <a href="/privacy-policy" className="hover:text-white/50 underline transition-colors">Privacy Policy</a>
        </p>
      </div>
    </LayoutWrapper>
  );
}
