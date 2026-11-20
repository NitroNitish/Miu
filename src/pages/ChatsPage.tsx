import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SquarePen, MoreVertical, CheckCheck, Sparkles, HelpCircle, Pencil, X, Check } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from '../components/common/Avatar';
import { IconButton } from '../components/common/IconButton';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';

export const ChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { partner, messages, unreadCount, markAllAsRead } = useChat();
  const { isDark, setThemeMode } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Get last message in conversation
  const lastMessage = messages[messages.length - 1];

  const formatLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet. Say hi!';
    if (lastMessage.type === 'voice') return '🎤 Voice message';
    if (lastMessage.type === 'image') return '📷 Photo';
    if (lastMessage.type === 'video') return '🎥 Video';
    if (lastMessage.type === 'doodle') return '✏️ Shared a doodle';
    if (lastMessage.type === 'view_once') return '👁️ View once photo';
    if (lastMessage.type === 'interaction') return '✨ Sent an interaction';
    return lastMessage.content;
  };

  const matchesSearch =
    !searchQuery.trim() ||
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7] dark:bg-[#111214] pb-20 md:pb-6">
      <Toast
        message={toastMessage || ''}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 dark:bg-[#111214]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-4 py-3 safe-pt">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-[27px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
            </h1>
            <span className="text-[11px] text-[#777777] dark:text-[#999999] font-medium tracking-wider uppercase">
              Inbox
            </span>
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setIsSearching(!isSearching)}
              aria-label="Search conversation"
              className="text-neutral-700 dark:text-neutral-300"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </IconButton>

            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => navigate('/chat')}
              aria-label="Open conversation"
              className="text-neutral-700 dark:text-neutral-300"
            >
              <SquarePen className="w-5 h-5 stroke-[1.8]" />
            </IconButton>

            <div className="relative">
              <IconButton
                size="sm"
                variant="ghost"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="More options"
                className="text-neutral-700 dark:text-neutral-300"
              >
                <MoreVertical className="w-5 h-5 stroke-[1.8]" />
              </IconButton>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 w-44 bg-white dark:bg-[#191A1D] border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl py-1.5 z-40 text-xs font-medium animate-slide-up">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        markAllAsRead();
                        setToastMessage('Marked all as read');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      <Check className="w-3.5 h-3.5 text-[#35B779]" />
                      Mark all as read
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setThemeMode(isDark ? 'light' : 'dark');
                        setToastMessage(isDark ? 'Switched to Light Mode' : 'Switched to Dark Mode');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearching && (
          <div className="mt-3 relative animate-slide-up">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in chat..."
              className="w-full bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-xl px-9 py-2 text-xs text-[#171717] dark:text-[#F5F5F5] placeholder-neutral-400 focus:outline-none focus:border-[#A99BCB]"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-3">
        {/* Primary Conversation Row */}
        {matchesSearch ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
              Private Conversation
            </p>

            <div
              onClick={() => navigate('/chat')}
              className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] hover:border-neutral-300 dark:hover:border-neutral-600 transition-all cursor-pointer shadow-xs group"
            >
              {/* Profile Avatar */}
              <Avatar
                src={partner.avatar}
                name={partner.name}
                size="md"
                showOnline={partner.status === 'online'}
              />

              {/* Middle details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5] truncate group-hover:text-[#A99BCB] dark:group-hover:text-[#B6A4DC] transition-colors">
                    {partner.name}
                  </h3>
                  <span className="text-[11px] text-[#777777] dark:text-[#999999] whitespace-nowrap">
                    {lastMessage?.timestamp || '9:41 AM'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-[#777777] dark:text-[#999999] truncate pr-2">
                    {lastMessage?.sender === 'user' && (
                      lastMessage.status === 'seen' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#35B779] inline shrink-0" />
                      ) : lastMessage.status === 'delivered' ? (
                        <CheckCheck className="w-3.5 h-3.5 text-[#777777] dark:text-[#999999] inline shrink-0" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-[#777777] dark:text-[#999999] inline shrink-0" />
                      )
                    )}
                    <span className="truncate">{formatLastMessagePreview()}</span>
                  </div>

                  {unreadCount > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#A99BCB] dark:bg-[#B6A4DC] text-white dark:text-[#111214] text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No matching messages"
            description={`No conversation items match "${searchQuery}".`}
            action={{
              label: 'Clear search',
              onClick: () => setSearchQuery(''),
            }}
          />
        )}

        {/* Quick Shortcuts as shown in the UI mockup design */}
        <div className="pt-4 space-y-2">
          <p className="text-[11px] font-semibold text-[#777777] dark:text-[#999999] uppercase tracking-wider px-1">
            Features & Shared Spaces
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Daily Question row */}
            <div
              onClick={() => navigate('/daily-question')}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-[#A99BCB] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                    Daily Question
                  </h4>
                  <span className="text-[10px] text-neutral-400">8:30 AM</span>
                </div>
                <p className="text-[11px] text-[#777777] dark:text-[#999999] truncate">
                  What is one thing you want to experience...
                </p>
              </div>
            </div>

            {/* Doodle row */}
            <div
              onClick={() => navigate('/doodle')}
              className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
                <Pencil className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5]">
                    Shared Doodle
                  </h4>
                  <span className="text-[10px] text-neutral-400">Sunday</span>
                </div>
                <p className="text-[11px] text-[#777777] dark:text-[#999999] truncate">
                  Draw together in realtime canvas
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
