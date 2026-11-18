import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div
        className="relative z-10 w-full max-w-lg mx-auto bg-[#FFFFFF] dark:bg-[#191A1D] border-t border-[#EEEEEC] dark:border-[#303136] rounded-t-3xl shadow-2xl p-4 safe-pb animate-slide-up"
      >
        {/* Grab Handle */}
        <div className="flex justify-center pt-1 pb-3">
          <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full cursor-grab" />
        </div>

        {title && (
          <div className="text-center pb-3 border-b border-[#EEEEEC] dark:border-[#303136] mb-3">
            <h3 className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5]">
              {title}
            </h3>
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );
};
