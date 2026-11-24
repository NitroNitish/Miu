import React, { useState, useRef } from 'react';
import { ArrowLeft, Menu, Trash2, Sun, Moon, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';

interface ChatHeaderProps {
  onSearchClick?: () => void;
  onExit?: () => void;
  onOpenPrivacySettings?: () => void;
  sharePresence?: boolean;
  shareLastSeen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onExit,
  onOpenPrivacySettings,
  sharePresence = true,
  shareLastSeen = true,
}) => {
  const navigate = useNavigate();
  const { partner, clearChat } = useChat();
  const { isDark, setThemeMode } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Discreet double-tap gesture to instantly exit to AI Chatbot
  const handleHeaderTap = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input')) return;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap detected!
      if (onExit) {
        onExit();
      }
    }
    lastTapRef.current = now;
  };

  const handleBack = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/chat');
    }
  };

  const getStatusText = () => {
    if (!sharePresence && !shareLastSeen) {
      return 'Encrypted';
    }
    if (sharePresence && partner.status === 'online') {
      return 'Active now';
    }
    if (shareLastSeen && partner.lastActive) {
      return partner.lastActive;
    }
    return 'Offline';
  };

  return (
    <header
      onClick={handleHeaderTap}
      title="Double-tap to return to AI Chatbot"
      className="shrink-0 w-full bg-[#000000] border-b border-[#1A1A1A] px-3.5 py-2.5 flex items-center justify-between select-none z-50 cursor-default"
    >
      {/* Left: Discreet exit back button & Partner Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back arrow - returns directly to AI Chatbot */}
        <button
          onClick={handleBack}
          aria-label="Return to AI Chatbot"
          title="Return to AI Chatbot (Esc)"
          className="text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer -ml-1 p-1"
        >
          <ArrowLeft className="w-5.5 h-5.5 stroke-[2]" />
        </button>

        {/* Circular profile picture (40px) */}
        <div className="relative group shrink-0">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-neutral-800">
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
          </div>
          {sharePresence && partner.status === 'online' && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-[#35B779] rounded-full ring-2 ring-black"
              title="Online"
            />
          )}
        </div>

        {/* Contact username & privacy-controlled status */}
        <div className="min-w-0 flex flex-col justify-center">
          <h2 className="text-[15.5px] font-semibold text-white truncate leading-tight tracking-tight">
            {partner.name}
          </h2>
          <p className="text-[12px] text-[#737373] leading-tight truncate mt-0.5 font-normal">
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Right: Privacy Shield & Menu */}
      <div className="relative flex items-center gap-1 text-white">
        {/* Quick Privacy Settings Pill Button */}
        {onOpenPrivacySettings && (
          <button
            type="button"
            onClick={onOpenPrivacySettings}
            title="Magic Layer Privacy & Lock"
            className="p-1.5 rounded-full hover:bg-[#1A1A1A] active:scale-95 text-neutral-400 hover:text-[#B6A4DC] transition-all cursor-pointer"
            aria-label="Privacy settings"
          >
            <Shield className="w-[19px] h-[19px] stroke-[1.8]" />
          </button>
        )}

        {/* Hamburger Menu */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Menu"
          className="p-1.5 rounded-full hover:bg-[#1A1A1A] active:scale-95 transition-all cursor-pointer text-white"
          title="Menu options"
        >
          <Menu className="w-[21px] h-[21px] stroke-[2]" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-11 w-56 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl shadow-2xl py-2 z-50 animate-slide-up text-sm font-medium">
              {/* Instant Return to AI Chatbot */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onExit) onExit();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-200 hover:bg-[#262626] transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#B6A4DC]" />
                <span>Return to AI Chatbot (Esc)</span>
              </button>

              {/* Privacy Settings */}
              {onOpenPrivacySettings && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenPrivacySettings();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-200 hover:bg-[#262626] transition-colors text-left cursor-pointer"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Privacy & Lock Settings</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  setThemeMode(isDark ? 'light' : 'dark');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-200 hover:bg-[#262626] transition-colors text-left cursor-pointer"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
                <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>

              <div className="my-1.5 border-t border-[#2E2E2E]" />

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (window.confirm('Clear all messages in this conversation?')) {
                    clearChat();
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-950/30 transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Chat</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
