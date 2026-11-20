import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Sparkles, Image, User, Sun, Moon, Shield } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';

export const Sidebar: React.FC = () => {
  const { unreadCount, partner } = useChat();
  const { isDark, setThemeMode } = useTheme();

  const navItems = [
    {
      to: '/chats',
      label: 'Chats',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      to: '/together',
      label: 'Together',
      icon: Sparkles,
    },
    {
      to: '/memories',
      label: 'Memories',
      icon: Image,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 h-screen bg-[#FFFFFF] dark:bg-[#191A1D] border-r border-[#EEEEEC] dark:border-[#303136] p-4 select-none shrink-0 sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3 py-3 mb-6">
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-[27px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
            </h1>
            <span className="text-[11px] text-[#777777] dark:text-[#999999] font-medium tracking-wider uppercase">
              Private
            </span>
          </div>

          <div
            title="End-to-end encrypted connection"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500"
          >
            <Shield className="w-3 h-3 text-[#35B779]" />
            <span className="text-[10px] font-medium">p2p</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-[#171717] dark:text-[#F5F5F5]'
                      : 'text-[#777777] dark:text-[#999999] hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-[#171717] dark:hover:text-[#F5F5F5]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-transform ${
                          isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {typeof item.badge === 'number' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#A99BCB] dark:bg-[#B6A4DC] text-white dark:text-[#111214] text-[11px] font-bold leading-tight">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Partner Pill & Theme Toggle */}
      <div className="pt-4 border-t border-[#EEEEEC] dark:border-[#303136] space-y-3">
        {/* Partner status card */}
        <NavLink
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors"
        >
          <Avatar
            src={partner.avatar}
            name={partner.name}
            size="sm"
            showOnline={partner.status === 'online'}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#171717] dark:text-[#F5F5F5] truncate">
              {partner.name}
            </p>
            {partner.status === 'online' ? (
              <p className="text-[11px] text-[#35B779] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#35B779] inline-block" />
                Active now
              </p>
            ) : (
              <p className="text-[11px] text-[#777777] dark:text-[#999999] flex items-center gap-1">
                {partner.lastActive || 'Offline'}
              </p>
            )}
          </div>
        </NavLink>

        {/* Quick Theme Toggle & Brand Tagline */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#777777] dark:text-[#999999]">
          <span className="tracking-tight italic font-serif">Private by design.</span>
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
