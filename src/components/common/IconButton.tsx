import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'secondary' | 'primary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, variant = 'ghost', size = 'md', active = false, className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8 p-1.5 text-sm',
      md: 'w-10 h-10 p-2 text-base',
      lg: 'w-12 h-12 p-3 text-lg',
    };

    const variantClasses = {
      ghost:
        'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 active:scale-95',
      secondary:
        'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 border border-neutral-200/50 dark:border-neutral-700/50',
      primary:
        'bg-[#202124] dark:bg-[#B6A4DC] text-white dark:text-[#111214] hover:opacity-90 active:scale-95 shadow-sm',
      danger:
        'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-95',
    };

    const activeClasses = active
      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white'
      : '';

    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${activeClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
