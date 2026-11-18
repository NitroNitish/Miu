import React, { useState } from 'react';
import { Search, MoreVertical, X, Filter, Star, Sparkles } from 'lucide-react';
import { Tabs } from '../components/common/Tabs';
import { MediaGrid } from '../components/memories/MediaGrid';
import { MediaViewer } from '../components/memories/MediaViewer';
import { EmptyState } from '../components/common/EmptyState';
import { Toast } from '../components/common/Toast';
import { IconButton } from '../components/common/IconButton';
import { useChat } from '../context/ChatContext';
import { MemoryItem } from '../types';

export const MemoriesPage: React.FC = () => {
  const { memories } = useChat();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MemoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tabs = [
    { id: 'all', label: 'All', count: memories.length },
    { id: 'photos', label: 'Photos', count: memories.filter((m) => m.type === 'photo').length },
    { id: 'videos', label: 'Videos', count: memories.filter((m) => m.type === 'video').length },
    { id: 'doodles', label: 'Doodles', count: memories.filter((m) => m.type === 'doodle').length },
    { id: 'saved', label: 'Saved', count: memories.filter((m) => m.isStarred).length },
  ];

  const filteredMemories = memories.filter((item) => {
    // Tab filter
    if (activeTab === 'photos' && item.type !== 'photo') return false;
    if (activeTab === 'videos' && item.type !== 'video') return false;
    if (activeTab === 'doodles' && item.type !== 'doodle') return false;
    if (activeTab === 'saved' && !item.isStarred) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCaption = item.caption?.toLowerCase().includes(q);
      const matchDate = item.date.toLowerCase().includes(q);
      return matchCaption || matchDate;
    }

    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF9F7] dark:bg-[#111214] pb-24 md:pb-8">
      <Toast
        message={toastMessage || ''}
        isOpen={!!toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF9F7]/90 dark:bg-[#111214]/90 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#303136] px-4 py-3 safe-pt">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <h1 className="text-[27px] font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              miu<span className="text-[#A99BCB] dark:text-[#B6A4DC]">.</span>
            </h1>
            <span className="text-[11px] text-[#777777] dark:text-[#999999] font-medium tracking-wider uppercase">
              Memories
            </span>
          </div>

          <div className="flex items-center gap-1">
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setIsSearching(!isSearching)}
              aria-label="Search memories"
              className="text-neutral-700 dark:text-neutral-300"
            >
              <Search className="w-5 h-5 stroke-[1.8]" />
            </IconButton>
          </div>
        </div>

        {/* Collapsible Search */}
        {isSearching && (
          <div className="mt-3 relative animate-slide-up">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by caption or date..."
              className="w-full bg-[#FFFFFF] dark:bg-[#191A1D] border border-[#EEEEEC] dark:border-[#303136] rounded-xl px-9 py-2 text-xs text-[#171717] dark:text-[#F5F5F5] placeholder-neutral-400 focus:outline-none focus:border-[#A99BCB]"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Filter Category Tabs */}
        <div className="mt-3">
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-3 sm:p-4">
        {filteredMemories.length > 0 ? (
          <MediaGrid
            items={filteredMemories}
            onSelectItem={(item) => setSelectedItem(item)}
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No memories found"
            description={
              searchQuery
                ? `No media matches "${searchQuery}".`
                : 'No media items in this category yet.'
            }
            action={
              searchQuery
                ? {
                    label: 'Clear search',
                    onClick: () => setSearchQuery(''),
                  }
                : undefined
            }
          />
        )}
      </main>

      {/* Full-screen Media Viewer */}
      <MediaViewer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onShowToast={(msg) => setToastMessage(msg)}
      />
    </div>
  );
};
