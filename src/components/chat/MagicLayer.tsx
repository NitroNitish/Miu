import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { Message } from '../../types';

// Simple in‑memory private chat – never persisted to Supabase.
export const MagicLayer: React.FC<{
  onExit: () => void;
}> = ({ onExit }) => {
  const [magicMessages, setMagicMessages] = useState<Message[]>([]);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');

  // Blur / clear when the app goes to background.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        // Hide content – keep messages in memory but blur UI.
        setLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleSend = (text: string) => {
    if (locked) return;
    const newMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36),
      sender: 'user',
      content: text,
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    setMagicMessages((prev) => [...prev, newMsg]);
  };

  const handleLockToggle = () => {
    if (locked && pin) {
      const entered = prompt('Enter PIN to unlock Magic Layer');
      if (entered !== pin) {
        alert('Incorrect PIN');
        return;
      }
    }
    setLocked(!locked);
  };

  const handleSetPin = () => {
    const newPin = prompt('Set a PIN for Magic Layer (4‑6 digits)');
    if (newPin) setPin(newPin);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0a0a0a] text-white">
      {/* Discreet exit button – appears on hover of top‑right corner */}
      <button
        onClick={onExit}
        className="absolute top-2 right-2 text-xs text-neutral-400 hover:text-white transition-opacity opacity-30 hover:opacity-100"
        aria-label="Exit Magic Layer"
        title="Exit Magic Layer"
      >
        ⨉
      </button>

      {/* Simple lock toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-[#222]">
        <span className="text-sm font-medium">Magic Layer</span>
        <div className="flex items-center gap-2">
          {pin && (
            <button
              onClick={handleLockToggle}
              className="px-2 py-1 bg-[#222] rounded text-xs hover:bg-[#333]"
            >
              {locked ? 'Unlock' : 'Lock'}
            </button>
          )}
          {!pin && (
            <button
              onClick={handleSetPin}
              className="px-2 py-1 bg-[#222] rounded text-xs hover:bg-[#333]"
            >
              Set PIN
            </button>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {magicMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {/* Keep a dummy element for scrolling to bottom */}
        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
      </div>

      {/* Composer – disabled when locked */}
      <div className="p-2 border-t border-[#222]">
        {locked ? (
          <div className="text-center text-neutral-500 text-sm">Locked – unlock to type</div>
        ) : (
          <MessageComposer
            onSendMessage={handleSend}
            onSendMedia={() => {}}
            onSendVoice={() => {}}
            replyingTo={null}
            onCancelReply={() => {}}
          />
        )}
      </div>
    </div>
  );
};
