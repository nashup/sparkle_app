import { useState } from 'react';
import { useLocation } from 'wouter';
import { useGameStore } from '@/store/use-game-store';
import { useCreateRoom, useJoinRoom } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { Users, PlusCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { playerInfo, setRoom } = useGameStore();
  const { toast } = useToast();
  
  const [joinCode, setJoinCode] = useState('');
  
  const createRoomMutation = useCreateRoom({
    mutation: {
      onSuccess: (room) => {
        setRoom(room);
        setLocation(`/room/${room.code}`);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to create room",
          description: error.message || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const joinRoomMutation = useJoinRoom({
    mutation: {
      onSuccess: (room) => {
        setRoom(room);
        setLocation(`/room/${room.code}`);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to join",
          description: "Room not found or full",
          variant: "destructive"
        });
      }
    }
  });

  const handleCreate = () => {
    createRoomMutation.mutate({
      data: {
        playerId: playerInfo.playerId,
        username: playerInfo.username,
        avatar: playerInfo.avatar
      }
    });
  };

  const handleJoin = () => {
    if (joinCode.length !== 4) return;
    joinRoomMutation.mutate({
      code: joinCode.toUpperCase(),
      data: {
        playerId: playerInfo.playerId,
        username: playerInfo.username,
        avatar: playerInfo.avatar
      }
    });
  };

  if (!playerInfo.username) {
    setLocation('/');
    return null;
  }

  return (
    <LayoutWrapper>
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => setLocation('/')} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
            <span className="text-xl">{playerInfo.avatar}</span>
            <span className="text-white font-medium">{playerInfo.username}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-8">
          <div className="glass-card rounded-3xl p-6 text-center space-y-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-400/50 rounded-full blur-2xl"></div>
            
            <h2 className="text-2xl font-display font-bold text-white relative z-10">Start a Game</h2>
            <p className="text-white/80 text-sm relative z-10">Create a new room and share the code with your partner.</p>
            
            <Button 
              className="w-full" 
              size="lg" 
              variant="primary"
              onClick={handleCreate}
              disabled={createRoomMutation.isPending}
            >
              <PlusCircle className="mr-2 w-5 h-5" />
              {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink-0 mx-4 text-white/50 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>

          <div className="glass-card rounded-3xl p-6 text-center space-y-4">
            <h2 className="text-2xl font-display font-bold text-white">Join a Game</h2>
            <p className="text-white/80 text-sm">Enter the 4-letter code from your partner.</p>
            
            <div className="flex gap-2">
              <Input 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="ABCD"
                className="h-14 bg-black/20 border-white/20 text-white placeholder:text-white/30 rounded-2xl text-2xl font-bold text-center uppercase focus-visible:ring-white/50 tracking-widest uppercase"
              />
              <Button 
                className="h-14 px-6" 
                variant="secondary"
                onClick={handleJoin}
                disabled={joinCode.length !== 4 || joinRoomMutation.isPending}
              >
                <Users className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}
