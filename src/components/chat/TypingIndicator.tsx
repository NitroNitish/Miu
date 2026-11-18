import React from 'react';

interface TypingIndicatorProps {
  partnerName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ partnerName = 'Elena' }) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-[#777777] dark:text-[#999999] animate-fade-in">
      <div className="flex items-center gap-1 bg-[#F0EFED] dark:bg-[#26272B] px-3 py-2 rounded-2xl rounded-tl-sm shadow-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 typing-dot-1" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 typing-dot-2" />
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 typing-dot-3" />
      </div>
      <span className="text-[11px] italic">{partnerName} is typing...</span>
    </div>
  );
};
