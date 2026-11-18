import React from 'react';
import { Play, Sparkles, Star } from 'lucide-react';
import { MemoryItem } from '../../types';

interface MediaGridProps {
  items: MemoryItem[];
  onSelectItem: (item: MemoryItem) => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({ items, onSelectItem }) => {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 sm:gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelectItem(item)}
          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group bg-neutral-200 dark:bg-neutral-800"
        >
          {/* Thumbnail */}
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.caption || 'Memory item'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Hover subtle darkening */}
          <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Video indicator */}
          {item.type === 'video' && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{item.duration || '0:15'}</span>
            </div>
          )}

          {/* Doodle indicator */}
          {item.type === 'doodle' && (
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white rounded-md p-1">
              <Sparkles className="w-3 h-3 text-[#A99BCB]" />
            </div>
          )}

          {/* Starred indicator */}
          {item.isStarred && (
            <div className="absolute bottom-2 right-2 text-amber-400 drop-shadow-md">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
