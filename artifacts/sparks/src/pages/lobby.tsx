import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useDeviceIdentity } from '@/hooks/use-device-identity';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device';
import { SESSION_TIMEOUT_MS, HEARTBEAT_INTERVAL_MS } from '@/lib/session';
import { createRoom, joinRoom } from '@/lib/rooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Users, PlusCircle, UserCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

async function claimDeviceSession(roomCode: string): Promise<{ ok: boolean; existingRoom?: string }> {
  const deviceId = getDeviceId();

  const { data: existing } = await supabase
    .from('device_sessions')
    .select('room_code, last_active')
    .eq('device_id', deviceId)
    .single();

  if (existing?.room_code && new Date(existing.last_active).getTime() > Date.now() - SESSION_TIMEOUT_MS) {
    return { ok: false, existingRoom: existing.room_code };
  }

  await supabase.from('device_sessions').upsert({
    device_id: deviceId,
    room_code: roomCode,
    last_active: new Date().toISOString(),
  }, { onConflict: 'device_id' });

  return { ok: true };
}

export async function clearDeviceSession() {
  const deviceId = getDeviceId();
  await supabase.from('device_sessions').update({
    room_code: null,
    last_active: new Date().toISOString(),
  }).eq('device_id', deviceId);
}

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { playerInfo, setRoom } = useGameStore();
  const { profile } = useDeviceIdentity();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS).toISOString();
    supabase.from('device_sessions').update({
      room_code: null,
      last_active: new Date().toISOString(),
    })
      .eq('device_id', deviceId)
      .lt('last_active', cutoff)
      .then(() => {});

    const interval = setInterval(() => {
      supabase.from('device_sessions').update({
        last_active: new Date().toISOString(),
      }).eq('device_id', deviceId).then(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const room = await createRoom({
        id: playerInfo.playerId,
        username: playerInfo.username,
        avatar: playerInfo.avatar,
      });
      const { ok, existingRoom } = await claimDeviceSession(room.code);
      if (!ok) {
        toast({
          title: 'Already in a room',
          description: `Your device is already linked to room ${existingRoom}. Leave that room first.`,
          variant: 'destructive',
        });
        return;
      }
      setRoom(room);
      setLocation(`/room/${room.code}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Failed to create room', description: msg, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length !== 4) return;
    setJoining(true);
    try {
      const room = await joinRoom(joinCode.toUpperCase(), {
        id: playerInfo.playerId,
        username: playerInfo.username,
        avatar: playerInfo.avatar,
      });
      const { ok, existingRoom } = await claimDeviceSession(room.code);
      if (!ok) {
        toast({
          title: 'Already in a room',
          description: `Your device is already linked to room ${existingRoom}. Leave that room first.`,
          variant: 'destructive',
        });
        return;
      }
      setRoom(room);
      setLocation(`/room/${room.code}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Room not found or full';
      toast({ title: 'Failed to join', description: msg, variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="w-10 h-10" />
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
            <span className="text-xl">{playerInfo.avatar}</span>
            <span className="text-white font-medium">{profile?.first_name || playerInfo.username}</span>
          </div>
          <button
            onClick={() => setLocation('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <UserCircle2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="glass-card rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/50 rounded-full blur-2xl" />
            <h2 className="text-2xl font-display font-bold text-white relative z-10">Start a Game</h2>
            <p className="text-white/80 text-sm relative z-10">Create a room and share the code.</p>
            <Button className="w-full" size="lg" variant="primary" onClick={handleCreate} disabled={creating}>
              <PlusCircle className="mr-2 w-5 h-5" />
              {creating ? 'Creating…' : 'Create Room'}
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/20" />
            <span className="mx-4 text-white/50 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-white/20" />
          </div>

          <div className="glass-card rounded-3xl p-6 text-center space-y-4">
            <h2 className="text-2xl font-display font-bold text-white">Join a Game</h2>
            <p className="text-white/80 text-sm">Enter the 4-letter code from your partner.</p>
            <div className="flex gap-2">
              <Input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                className="h-14 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-2xl text-2xl font-bold text-center uppercase focus-visible:ring-white/50 tracking-widest"
              />
              <Button className="h-14 px-6" variant="secondary" onClick={handleJoin}
                disabled={joinCode.length !== 4 || joining}>
                <Users className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
