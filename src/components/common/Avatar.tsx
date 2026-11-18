import React from 'react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showOnline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name = 'User',
  size = 'md',
  showOnline = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-[44px] h-[44px] text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const indicatorSizes = {
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-4 h-4 ring-2',
    xl: 'w-5 h-5 ring-4',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex shrink-0 rounded-full select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback to initials on error
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 ${indicatorSizes[size]} bg-[#35B779] rounded-full ring-[#FAF9F7] dark:ring-[#191A1D]`}
          title="Online"
        />
      )}
    </div>
  );
};
