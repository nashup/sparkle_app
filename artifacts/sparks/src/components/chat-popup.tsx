import { useState, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/use-game-store';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPopupProps {
  sendChat: (text: string) => void;
  setChatOpen: (open: boolean) => void;
}

export function ChatPopup({ sendChat, setChatOpen }: ChatPopupProps) {
  const { chatMessages, unreadCount, clearUnread, playerInfo } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pos, setPos] = useState({ x: 20, y: 120 });
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      clearUnread();
      setChatOpen(true);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } else {
      setChatOpen(false);
    }
  }, [isOpen, clearUnread, setChatOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.chat-body')) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const newX = Math.max(8, Math.min(window.innerWidth - 72, e.clientX - dragOffset.current.x));
    const newY = Math.max(8, Math.min(window.innerHeight - 72, e.clientY - dragOffset.current.y));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendChat(text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggle = () => setIsOpen(v => !v);

  const bubbleSize = 56;
  const panelWidth = 300;
  const panelHeight = 360;

  // Position panel so it doesn't go off screen
  const panelLeft = pos.x + bubbleSize + 8 > window.innerWidth - panelWidth
    ? pos.x - panelWidth - 8
    : pos.x + bubbleSize + 8;
  const panelTop = Math.min(pos.y, window.innerHeight - panelHeight - 8);

  return (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, originX: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="chat-body absolute rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              width: panelWidth,
              height: panelHeight,
              left: panelLeft - pos.x,
              top: panelTop - pos.y,
              background: 'rgba(20, 12, 40, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onPointerDown={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-pink-400" />
                <span className="text-white font-bold text-sm">Chat</span>
              </div>
              <button onClick={toggle} className="text-white/50 hover:text-white transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 hide-scrollbar">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/30 text-xs text-center gap-1">
                  <MessageCircle className="w-8 h-8 opacity-30" />
                  <span>No messages yet</span>
                  <span>Say something! 💬</span>
                </div>
              )}
              {chatMessages.map(msg => {
                const isMe = msg.playerId === playerInfo.playerId;
                return (
                  <div key={msg.id} className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-lg flex-shrink-0">{msg.avatar}</span>
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      {!isMe && (
                        <span className="text-white/40 text-[10px] ml-1">{msg.username}</span>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm text-white break-words ${
                          isMe
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 rounded-br-sm'
                            : 'bg-white/10 rounded-bl-sm'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-white/10">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400 transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative rounded-full shadow-xl flex items-center justify-center text-white"
        style={{
          width: bubbleSize,
          height: bubbleSize,
          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          boxShadow: '0 4px 20px rgba(236,72,153,0.5)',
        }}
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-5 h-5" />
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-transparent">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
