import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageComposer } from '../components/chat/MessageComposer';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { CallModal } from '../components/chat/CallModal';
import { ViewOnceModal } from '../components/chat/ViewOnceModal';
import { MediaViewer } from '../components/memories/MediaViewer';
import { Toast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Message, MemoryItem } from '../types';
import { ArrowDown, CheckCheck, Sparkles } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { connection, isConfigured } = useAuth();
  const {
    messages,
    isPartnerTyping,
    sendMessage,
    editMessage,
    partner,
    setActiveViewOnceMedia,
  } = useChat();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingMedia, setViewingMedia] = useState<MemoryItem | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Swipe to reveal timestamps state & gesture tracking
  const [dragOffset, setDragOffset] = useState(0);
  const [isActivelyDragging, setIsActivelyDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const directionLock = useRef<'none' | 'vertical' | 'horizontal'>('none');
  const isMouseDown = useRef(false);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isPartnerTyping]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    directionLock.current = 'none';
  };

  const handleTouchEnd = () => {
    directionLock.current = 'none';
    setIsActivelyDragging(false);
    setDragOffset(0);
  };

  // Support desktop drag preview as well
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a')) return;
    isMouseDown.current = true;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    directionLock.current = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDown.current) return;
    const deltaX = touchStartX.current - e.clientX;
    const deltaY = e.clientY - touchStartY.current;

    if (directionLock.current === 'none') {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        directionLock.current = 'vertical';
        return;
      }
      if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.2) {
        directionLock.current = 'horizontal';
        setIsActivelyDragging(true);
      }
    }

    if (directionLock.current === 'horizontal') {
      const netPull = Math.max(0, deltaX - 10);
      // Elastic spring resistance: requires force to slide
      const damped = Math.min(65, Math.pow(netPull, 0.76) * 1.6);
      setDragOffset(damped);
    }
  };

  const handleMouseUp = () => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      directionLock.current = 'none';
      setIsActivelyDragging(false);
      setDragOffset(0);
    }
  };

  // Native non-passive touchmove listener to cleanly prevent vertical stutter during horizontal pull
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onNativeTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = touchStartX.current - currentX; // positive when swiping left
      const deltaY = currentY - touchStartY.current;

      if (directionLock.current === 'none') {
        // If vertical movement dominates, lock to vertical scrolling immediately
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
          directionLock.current = 'vertical';
          return;
        }
        // Only lock to horizontal swipe if pulling to the left past 10px and horizontal movement dominates
        if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.2) {
          directionLock.current = 'horizontal';
          setIsActivelyDragging(true);
        }
      }

      if (directionLock.current === 'horizontal') {
        if (e.cancelable) e.preventDefault();
        const netPull = Math.max(0, deltaX - 10);
        // Elastic damping curve: requires tangible force to pull
        const damped = Math.min(65, Math.pow(netPull, 0.76) * 1.6);
        setDragOffset(damped);
      }
    };

    container.addEventListener('touchmove', onNativeTouchMove, { passive: false });
    return () => {
      container.removeEventListener('touchmove', onNativeTouchMove);
    };
  }, []);

  const handleSendMessage = (text: string) => {
    sendMessage({
      content: text,
      type: 'text',
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            sender: replyingTo.sender,
            text: replyingTo.content || 'Media message',
          }
        : undefined,
    });
    setReplyingTo(null);
  };

  const handleSendMedia = (
    url: string,
    type: 'image' | 'video' | 'view_once',
    caption?: string
  ) => {
    sendMessage({
      content: caption || (type === 'view_once' ? 'View once photo' : 'Shared media'),
      type,
      mediaUrl: url,
      isViewOnce: type === 'view_once',
    });
    setToastMessage(type === 'view_once' ? 'Sent View Once photo' : 'Media sent');
  };

  const handleSendVoice = (duration: number) => {
    sendMessage({
      content: `Voice note (${duration}s)`,
      type: 'voice',
      duration,
    });
    setToastMessage('Voice message sent');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setToastMessage('Copied to clipboard');
  };

  const handleEditClick = (msg: Message) => {
    setEditingMessage(msg);
    setEditText(msg.content);
  };

  const handleSaveEdit = () => {
    if (editingMessage && editText.trim()) {
      editMessage(editingMessage.id, editText.trim());
      setEditingMessage(null);
      setToastMessage('Message updated');
    }
  };

  const handleOpenMedia = (url: string) => {
    const memoryItem: MemoryItem = {
      id: `preview-${Date.now()}`,
      type: 'photo',
      url,
      date: 'Today',
      sender: 'partner',
    };
    setViewingMedia(memoryItem);
  };

  const handleOpenViewOnce = (messageId: string, url: string) => {
    setActiveViewOnceMedia({ messageId, url });
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageIsOutgoing = lastMessage?.sender === 'user';

  return (
    <div className="w-full h-screen h-[100dvh] bg-[#000000] text-white flex justify-center overflow-hidden">
      {/* 751px reference design container */}
      <div className="w-full max-w-[751px] h-full flex flex-col bg-[#000000] relative border-x border-[#1A1A1A]/40 overflow-hidden shadow-2xl">
        <Toast
          message={toastMessage || ''}
          isOpen={!!toastMessage}
          onClose={() => setToastMessage(null)}
        />

        {/* 1. LOCKED TOP HEADER LAYER (Permanently anchored over top layer, never moves) */}
        <ChatHeader />

        {/* 2. ONLY CHATS LAYER SCROLLS (flex-1 overflow-y-auto between header and composer) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 flex flex-col relative no-scrollbar touch-pan-y"
        >
          {/* Top Encrypted Presence Card */}
          <div className="flex flex-col items-center justify-center my-6 text-center select-none">
            <div className="w-[84px] h-[84px] rounded-full overflow-hidden border-2 border-neutral-800 mb-2.5">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-[18px] font-semibold text-white tracking-tight">
              {partner.name}
            </h3>
            <p className="text-[13px] text-[#737373] mt-0.5">
              Miu private messaging • End-to-end encrypted
            </p>
            <div className="mt-4 px-3.5 py-1 rounded-full bg-[#1A1A1A] text-[12px] text-[#8E8E8E] font-medium">
              Today
            </div>
          </div>

          {/* Awaiting connection prompt if user is in configured Supabase mode but hasn't paired yet */}
          {isConfigured && !connection && (
            <div className="my-4 mx-auto max-w-sm p-5 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-3 animate-fade-in">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#A99BCB]/15 text-[#A99BCB] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Private Space Awaiting Partner</h4>
              <p className="text-xs text-[#8E8E8E] leading-relaxed">
                Generate a single-use invitation link in your profile to connect your partner and start messaging.
              </p>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D91A8E] to-[#6366F1] text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Invite Your Partner</span>
              </button>
            </div>
          )}

          {/* Render All Messages with grouping, swipe timestamp reveal, and Instagram gradient */}
          <div className="flex-1 flex flex-col justify-end w-full">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                previousMessage={messages[idx - 1]}
                nextMessage={messages[idx + 1]}
                index={idx}
                totalMessages={messages.length}
                dragOffset={dragOffset}
                isDragging={isActivelyDragging}
                onReply={(m) => setReplyingTo(m)}
                onCopy={handleCopy}
                onEdit={handleEditClick}
                onOpenMedia={handleOpenMedia}
                onOpenViewOnce={handleOpenViewOnce}
              />
            ))}

            {/* Seen indicator under latest outgoing message */}
            {lastMessageIsOutgoing && (
              <div
                className="flex justify-end items-center gap-1 pr-1.5 mt-1.5 text-[12px] text-[#737373] font-medium select-none"
                style={{
                  transform: `translateX(-${dragOffset}px)`,
                  transition: isActivelyDragging
                    ? 'none'
                    : 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
              >
                <span>Seen</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#35B779]" />
              </div>
            )}

            {/* Typing indicator */}
            {isPartnerTyping && <TypingIndicator partnerName={partner.name} />}

            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* Scroll to bottom floating button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-20 right-6 z-40 w-10 h-10 rounded-full bg-[#262626] border border-[#383838] shadow-lg flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Scroll to latest"
          >
            <ArrowDown className="w-4.5 h-4.5" />
          </button>
        )}

        {/* 3. LOCKED BOTTOM COMPOSER LAYER (Permanently anchored over bottom layer, never moves) */}
        <MessageComposer
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          onSendVoice={handleSendVoice}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />

        {/* Modals */}
        <CallModal />
        <ViewOnceModal />
        <MediaViewer
          item={viewingMedia}
          onClose={() => setViewingMedia(null)}
          onShowToast={(msg) => setToastMessage(msg)}
        />

        {/* Edit Message Modal */}
        <Modal
          isOpen={!!editingMessage}
          onClose={() => setEditingMessage(null)}
          title="Edit Message"
        >
          <div className="space-y-3">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full bg-[#262626] border border-[#383838] rounded-xl p-3 text-base text-white focus:outline-none focus:border-[#C026D3] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-[#D91A8E] to-[#6366F1] text-white text-xs sm:text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
