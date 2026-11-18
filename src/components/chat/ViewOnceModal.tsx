import React, { useEffect } from 'react';
import { X, EyeOff, ShieldAlert } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ViewOnceModal: React.FC = () => {
  const { activeViewOnceMedia, setActiveViewOnceMedia, markViewOnceAsViewed } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (activeViewOnceMedia) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeViewOnceMedia]);

  if (!activeViewOnceMedia) return null;

  const handleClose = () => {
    markViewOnceAsViewed(activeViewOnceMedia.messageId);
    setActiveViewOnceMedia(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black text-white animate-fade-in p-4 select-none">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between z-10 pt-2 safe-pt">
        <div className="flex items-center gap-2 bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800">
          <EyeOff className="w-4 h-4 text-[#A99BCB]" />
          <span className="text-xs font-medium">View Once Media</span>
        </div>

        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          aria-label="Close view once"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center max-w-2xl max-h-[75vh] w-full p-2 my-auto">
        <img
          src={activeViewOnceMedia.url}
          alt="View once content"
          className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl pointer-events-none"
        />
      </div>

      {/* Bottom Warning Badge */}
      <div className="w-full pb-4 safe-pb flex justify-center">
        <div className="flex items-center gap-2 bg-neutral-900/90 text-neutral-400 text-xs px-4 py-2 rounded-full border border-neutral-800">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>This media will expire as soon as you close this viewer.</span>
        </div>
      </div>
    </div>
  );
};
