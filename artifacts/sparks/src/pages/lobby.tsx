import { useState } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { getDeviceId } from '@/lib/device';
import { useCreateRoom, useJoinRoom } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Users, PlusCircle, UserCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SESSION_ACTIVE_MS = 2 * 60 * 60 * 1000; // 2 hours

async function claimDeviceSession(userId: string, roomCode: string): Promise<{ ok: boolean; existingRoom?: string }> {
  const deviceId = getDeviceId();

  const { data: existing } = await supabase
    .from('device_sessions')
    .select('room_code, last_active')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .single();

  if (existing?.room_code && new Date(existing.last_active).getTime() > Date.now() - SESSION_ACTIVE_MS) {
    return { ok: false, existingRoom: existing.room_code };
  }

  await supabase.from('device_sessions').upsert({
    user_id: userId,
    device_id: deviceId,
    room_code: roomCode,
    last_active: new Date().toISOString(),
  }, { onConflict: 'user_id,device_id' });

  return { ok: true };
}

export async function clearDeviceSession(userId: string) {
  const deviceId = getDeviceId();
  await supabase.from('device_sessions').update({
    room_code: null,
    last_active: new Date().toISOString(),
  }).eq('user_id', userId).eq('device_id', deviceId);
}

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { playerInfo, setRoom } = useGameStore();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState('');

  const createRoomMutation = useCreateRoom({
    mutation: {
      onSuccess: async (room) => {
        if (user) {
          const { ok, existingRoom } = await claimDeviceSession(user.id, room.code);
          if (!ok) {
            toast({
              title: 'Already in a room',
              description: `Your device is already linked to room ${existingRoom}. Leave that room first.`,
              variant: 'destructive',
            });
            return;
          }
        }
        setRoom(room);
        setLocation(`/room/${room.code}`);
      },
      onError: (error: any) => {
        toast({ title: 'Failed to create room', description: error.message || 'An error occurred', variant: 'destructive' });
      },
    },
  });

  const joinRoomMutation = useJoinRoom({
    mutation: {
      onSuccess: async (room) => {
        if (user) {
          const { ok, existingRoom } = await claimDeviceSession(user.id, room.code);
          if (!ok) {
            toast({
              title: 'Already in a room',
              description: `Your device is already linked to room ${existingRoom}. Leave that room first.`,
              variant: 'destructive',
            });
            return;
          }
        }
        setRoom(room);
        setLocation(`/room/${room.code}`);
      },
      onError: () => {
        toast({ title: 'Failed to join', description: 'Room not found or full', variant: 'destructive' });
      },
    },
  });

  const handleCreate = () => {
    createRoomMutation.mutate({
      data: { playerId: playerInfo.playerId, username: playerInfo.username, avatar: playerInfo.avatar },
    });
  };

  const handleJoin = () => {
    if (joinCode.length !== 4) return;
    joinRoomMutation.mutate({
      code: joinCode.toUpperCase(),
      data: { playerId: playerInfo.playerId, username: playerInfo.username, avatar: playerInfo.avatar },
    });
  };

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
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
          {/* Create room */}
          <div className="glass-card rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/50 rounded-full blur-2xl" />
            <h2 className="text-2xl font-display font-bold text-white relative z-10">Start a Game</h2>
            <p className="text-white/80 text-sm relative z-10">Create a room and share the code.</p>
            <Button className="w-full" size="lg" variant="primary" onClick={handleCreate}
              disabled={createRoomMutation.isPending}>
              <PlusCircle className="mr-2 w-5 h-5" />
              {createRoomMutation.isPending ? 'Creating…' : 'Create Room'}
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/20" />
            <span className="mx-4 text-white/50 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-white/20" />
          </div>

          {/* Join room */}
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
                disabled={joinCode.length !== 4 || joinRoomMutation.isPending}>
                <Users className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
