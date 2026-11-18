import React, { useRef } from 'react';
import { Image, Video, Camera, Eye, Sparkles, Gamepad2 } from 'lucide-react';
import { BottomSheet } from '../common/BottomSheet';
import { useNavigate } from 'react-router-dom';

interface AttachmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMedia: (url: string, type: 'image' | 'video' | 'view_once', caption?: string) => void;
}

export const AttachmentSheet: React.FC<AttachmentSheetProps> = ({
  isOpen,
  onClose,
  onSendMedia,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const curatedPhotos = [
    {
      title: 'Minimal Architecture',
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85',
    },
    {
      title: 'Morning Coffee',
      url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=85',
    },
    {
      title: 'Coastline',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    },
    {
      title: 'Alpine Cabin',
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isViewOnce = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const isVideo = file.type.startsWith('video');
        onSendMedia(
          reader.result,
          isViewOnce ? 'view_once' : isVideo ? 'video' : 'image',
          file.name
        );
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCurated = (url: string, isViewOnce = false) => {
    onSendMedia(url, isViewOnce ? 'view_once' : 'image', isViewOnce ? '1 View Once' : 'Shared photo');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share to conversation">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e, false)}
        accept="image/*,video/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFileUpload(e, false)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Grid of Attachment Options */}
      <div className="grid grid-cols-5 gap-2 py-3">
        {/* Photos */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:scale-105 transition-transform">
            <Image className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Photos
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Camera
          </span>
        </button>

        {/* View Once */}
        <button
          onClick={() => {
            handleSelectCurated(curatedPhotos[1].url, true);
          }}
          className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#A99BCB]/15 dark:bg-[#B6A4DC]/15 border border-[#A99BCB]/40 dark:border-[#B6A4DC]/40 flex items-center justify-center text-[#A99BCB] dark:text-[#B6A4DC] group-hover:scale-105 transition-transform relative">
            <Eye className="w-5 h-5 stroke-[1.8]" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#A99BCB] dark:bg-[#B6A4DC] text-white dark:text-[#111214] text-[8px] font-bold flex items-center justify-center">
              1
            </span>
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            View Once
          </span>
        </button>

        {/* Shared Doodle */}
        <button
          onClick={() => {
            onClose();
            navigate('/doodle');
          }}
          className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-center text-neutral-800 dark:text-neutral-200 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            Doodle
          </span>
        </button>

        {/* Play X & O */}
        <button
          onClick={() => {
            onClose();
            navigate('/together/tic-tac-toe');
          }}
          className="flex flex-col items-center gap-1.5 p-1.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#A99BCB]/15 dark:bg-[#B6A4DC]/15 border border-[#A99BCB]/40 dark:border-[#B6A4DC]/40 flex items-center justify-center text-[#826FB5] dark:text-[#B6A4DC] group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-5 h-5 stroke-[1.8]" />
          </div>
          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
            X & 0
          </span>
        </button>
      </div>

      {/* Quick Curated Aesthetic Samples */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
        <p className="text-[11px] font-medium text-neutral-500 mb-2 px-1">
          Quick select from gallery:
        </p>
        <div className="grid grid-cols-4 gap-2">
          {curatedPhotos.map((photo, i) => (
            <button
              key={i}
              onClick={() => handleSelectCurated(photo.url, false)}
              className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer border border-neutral-200 dark:border-neutral-700"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] text-white font-medium bg-black/60 px-1.5 py-0.5 rounded">
                  Send
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};
