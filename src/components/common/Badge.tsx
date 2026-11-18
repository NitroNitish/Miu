import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'accent' | 'neutral' | 'online' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'accent',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    accent: 'bg-[#A99BCB] dark:bg-[#B6A4DC] text-white dark:text-[#111214]',
    neutral: 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    online: 'bg-[#35B779]/15 text-[#35B779] border border-[#35B779]/30',
    subtle: 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
  };

  return (
    <span
      className={`inline-flex items-center justify-center tracking-tight leading-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
