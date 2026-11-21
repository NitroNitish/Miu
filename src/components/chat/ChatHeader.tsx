import React, { useState } from 'react';
import { ArrowLeft, Menu, Trash2, User, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';

interface ChatHeaderProps {
  onSearchClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = () => {
  const navigate = useNavigate();
  const { partner, clearChat } = useChat();
  const { isDark, setThemeMode } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="shrink-0 w-full bg-[#000000] border-b border-[#1A1A1A] safe-pt px-3.5 py-2.5 flex items-center justify-between select-none z-50">
      {/* Left: Back button & Partner Info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Back arrow */}
        <button
          onClick={() => navigate('/chats')}
          aria-label="Back to conversations"
          className="text-white hover:opacity-80 active:scale-95 transition-all cursor-pointer -ml-1 p-1"
        >
          <ArrowLeft className="w-5.5 h-5.5 stroke-[2]" />
        </button>

        {/* Circular profile picture (40px) */}
        <div
          onClick={() => navigate('/profile')}
          className="relative cursor-pointer group shrink-0"
        >
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden border border-neutral-800">
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
          </div>
          {partner.status === 'online' && (
            <span
              className="absolute bottom-0 right-0 w-3 h-3 bg-[#35B779] rounded-full ring-2 ring-black"
              title="Online"
            />
          )}
        </div>

        {/* Contact username & status */}
        <div
          onClick={() => navigate('/profile')}
          className="min-w-0 cursor-pointer flex flex-col justify-center"
        >
          <h2 className="text-[15.5px] font-semibold text-white truncate leading-tight tracking-tight">
            {partner.name}
          </h2>
          <p className="text-[12px] text-[#737373] leading-tight truncate mt-0.5 font-normal">
            {partner.status === 'online' ? 'Active now' : partner.lastActive || 'Offline'}
          </p>
        </div>
      </div>

      {/* Right: Hamburger button for all functions */}
      <div className="relative flex items-center text-white">
        <button
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Menu"
          className="p-1.5 rounded-full hover:bg-[#1A1A1A] active:scale-95 transition-all cursor-pointer text-white"
          title="Menu functions"
        >
          <Menu className="w-[21px] h-[21px] stroke-[2]" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-11 w-52 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl shadow-2xl py-2 z-50 animate-slide-up text-sm font-medium">
              <button
                onClick={() => {
                  setShowMenu(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-200 hover:bg-[#262626] transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-neutral-400" />
                <span>View Profile</span>
              </button>

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
