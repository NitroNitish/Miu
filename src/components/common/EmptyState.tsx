import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3 text-neutral-400">
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
      )}
      <h4 className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5] mb-1">
        {title}
      </h4>
      {description && (
        <p className="text-xs text-[#777777] dark:text-[#999999] max-w-xs mb-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[#202124] dark:bg-[#B6A4DC] text-white dark:text-[#111214] text-xs font-medium rounded-xl hover:opacity-90 active:scale-95 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
