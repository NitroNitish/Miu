import React, { useEffect } from 'react';
import { X, Download, Star, Calendar, User, Share2 } from 'lucide-react';
import { MemoryItem } from '../../types';
import { useChat } from '../../context/ChatContext';

interface MediaViewerProps {
  item: MemoryItem | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ item, onClose, onShowToast }) => {
  const { toggleStarMemory, sendMessage } = useChat();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const handleDownload = () => {
    // Simulate downloading media to device
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `miu-memory-${item.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('Saved to device storage');
  };

  const handleShareToChat = () => {
    sendMessage({
      content: item.caption || 'Shared from Memories',
      type: item.type === 'doodle' ? 'doodle' : 'image',
      mediaUrl: item.url,
    });
    onShowToast('Shared to conversation');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-white animate-fade-in p-4 backdrop-blur-md select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between z-10 pt-2 safe-pt">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 bg-white/10 px-3 py-1 rounded-full">
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>{item.sender === 'user' ? 'You' : 'Elena'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-300 bg-white/10 px-3 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>{item.date}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Star button */}
          <button
            onClick={() => {
              toggleStarMemory(item.id);
              onShowToast(item.isStarred ? 'Removed from starred' : 'Starred to favorites');
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Star memory"
          >
            <Star
              className={`w-4 h-4 ${
                item.isStarred ? 'fill-amber-400 text-amber-400' : 'text-white'
              }`}
            />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image or Video Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full p-2 overflow-hidden my-auto">
        <img
          src={item.url}
          alt={item.caption || 'Memory view'}
          className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl"
        />

        {item.caption && (
          <p className="mt-4 text-xs sm:text-sm text-neutral-300 text-center max-w-md px-4 font-light">
            {item.caption}
          </p>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-center gap-4 pb-4 safe-pb z-10">
        <button
          onClick={handleShareToChat}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Send to Chat</span>
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-xs font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Save Image</span>
        </button>
      </div>
    </div>
  );
};
