import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, Bot, Image, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar: React.FC = () => {
  const { isDark, setThemeMode } = useTheme();

  const navItems = [
    {
      to: '/chat',
      label: 'Assistant',
      icon: Bot,
    },
    {
      to: '/together',
      label: 'Workspace',
      icon: Sparkles,
    },
    {
      to: '/memories',
      label: 'Gallery',
      icon: Image,
    },
    {
      to: '/profile',
      label: 'Settings',
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
              AI
            </span>
          </div>

          <div
            title="Assistant online"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[10px] font-medium">Ready</span>
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
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Theme Toggle */}
      <div className="pt-4 border-t border-[#EEEEEC] dark:border-[#303136] space-y-3">
        {/* Quick Theme Toggle & Brand Tagline */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-[#777777] dark:text-[#999999]">
          <span className="tracking-tight italic font-serif">Miu AI Assistant</span>
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
