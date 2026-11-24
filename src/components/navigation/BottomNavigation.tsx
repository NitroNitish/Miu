import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bot, Sparkles, Image, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 dark:bg-[#191A1D]/95 backdrop-blur-md border-t border-[#EEEEEC] dark:border-[#303136] safe-pb">
      <div className="flex items-center justify-around h-15 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors relative ${
                  isActive
                    ? 'text-[#171717] dark:text-[#F5F5F5] font-semibold'
                    : 'text-[#777777] dark:text-[#999999] hover:text-[#171717] dark:hover:text-[#F5F5F5]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-[21px] h-[21px] transition-transform duration-150 ${
                        isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] tracking-tight mt-1">{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#171717] dark:bg-[#F5F5F5]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
