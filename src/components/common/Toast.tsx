import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isOpen,
  onClose,
  duration = 2400,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-slide-up">
      <div className="bg-[#202124] text-white dark:bg-[#F5F5F5] dark:text-[#171717] px-4 py-2 rounded-full text-xs font-medium shadow-lg flex items-center gap-2">
        <span>{message}</span>
      </div>
    </div>
  );
};
