import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageComposer } from '../components/chat/MessageComposer';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { MagicLayer } from '../components/chat/MagicLayer';
import { CallModal } from '../components/chat/CallModal';
import { ViewOnceModal } from '../components/chat/ViewOnceModal';
import { MediaViewer } from '../components/memories/MediaViewer';
import { Toast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Message, MemoryItem } from '../types';
import { ArrowDown, Check, CheckCheck, Sparkles } from 'lucide-react';

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
    uploadMediaFile,
    markChatAsSeen,
  } = useChat();

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingMedia, setViewingMedia] = useState<MemoryItem | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Mark incoming messages as seen when chat is active/opened
  useEffect(() => {
    markChatAsSeen();
  }, [markChatAsSeen, messages.length]);

  useEffect(() => {
    const handleFocus = () => {
      markChatAsSeen();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        markChatAsSeen();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [markChatAsSeen]);

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

  const getReplyPayload = (target: Message | null) => {
    if (!target) return undefined;
    let replyText = target.content || '';
    if (target.type === 'voice') replyText = `🎤 Voice note (${target.duration || 0}s)`;
    else if (target.type === 'image') replyText = '📷 Photo';
    else if (target.type === 'video') replyText = '🎥 Video';
    else if (target.type === 'doodle') replyText = '✏️ Doodle';
    else if (target.type === 'view_once') replyText = '👁️ View once photo';

    return {
      id: target.id,
      sender: target.sender,
      text: replyText || 'Original message',
      mediaUrl: target.mediaUrl,
      type: target.type,
    };
  };

  const handleNavigateToOriginal = (targetMessageId: string) => {
    const originalMsg = messages.find((m) => m.id === targetMessageId);

    if (!originalMsg) {
      setToastMessage('Original message is no longer available');
      return;
    }

    if (originalMsg.isDeletedForEveryone) {
      setToastMessage('The original message was deleted');
      return;
    }

    const el = document.getElementById(`msg-${targetMessageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(targetMessageId);

      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
      }, 1500);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(12);
        } catch {}
      }
    } else {
      setToastMessage('Original message is no longer available');
    }
  };

  const [magicMode, setMagicMode] = useState(false);
  const [magicLockEnabled, setMagicLockEnabled] = useState(false);
  const [pin, setPin] = useState('');

  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    // Secret command to enter Magic Layer
    if (trimmed === '/qupa') {
      // Optional: Prompt for PIN if lock enabled
      if (magicLockEnabled && pin) {
        const entered = prompt('Enter PIN to access Magic Layer');
        if (entered !== pin) {
          setToastMessage('Incorrect PIN');
          return;
        }
      }
      setMagicMode(true);
      setToastMessage('Entered Magic Layer');
      return; // Do not send to chat
    }
    // Normal message flow
    sendMessage({
      content: text,
      type: 'text',
      replyTo: getReplyPayload(replyingTo),
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
      replyTo: getReplyPayload(replyingTo),
    });
    setReplyingTo(null);
    setToastMessage(type === 'view_once' ? 'Sent View Once photo' : 'Media sent');
  };

  const handleSendVoice = async ({
    blob,
    url,
    duration,
  }: {
    blob: Blob;
    url: string;
    duration: number;
  }) => {
    let finalMediaUrl = url;

    if (isConfigured) {
      try {
        const uploadedUrl = await uploadMediaFile(blob, 'chat-media');
        if (uploadedUrl) {
          finalMediaUrl = uploadedUrl;
        }
      } catch (err) {
        console.warn('Voice storage upload fallback to data URL:', err);
      }
    }

    await sendMessage({
      content: `Voice note (${duration}s)`,
      type: 'voice',
      mediaUrl: finalMediaUrl,
      duration,
      replyTo: getReplyPayload(replyingTo),
    });
    setReplyingTo(null);
    setToastMessage('Voice note sent');
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

if (magicMode) {
  return <MagicLayer onExit={() => setMagicMode(false)} />;
}

return (
  <div className="w-full h-screen h-[100dvh] bg-[#000000] text-white flex flex-col items-center overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
    {/* 751px reference design container */}
    <div className="w-full max-w-[751px] h-full flex flex-col bg-[#000000] relative border-x border-[#1A1A1A]/40 overflow-hidden shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
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
          className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-2.5 flex flex-col relative no-scrollbar touch-pan-y"
        >
          {/* Top Encrypted Presence Card */}
          <div className="flex flex-col items-center justify-center my-5 text-center select-none">
            <div className="w-[74px] h-[74px] rounded-full overflow-hidden border-2 border-neutral-800 mb-2">
              <img
                src={partner.avatar}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-[16.5px] font-semibold text-white tracking-tight">
              {partner.name}
            </h3>
            <p className="text-[12px] text-[#737373] mt-0.5">
              Miu private messaging • End-to-end encrypted
            </p>
            <div className="mt-3 px-3 py-0.5 rounded-full bg-[#1A1A1A] text-[11px] text-[#8E8E8E] font-medium">
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
                isHighlighted={highlightedMessageId === msg.id}
                onReply={(m) => setReplyingTo(m)}
                onCopy={handleCopy}
                onEdit={handleEditClick}
                onOpenMedia={handleOpenMedia}
                onOpenViewOnce={handleOpenViewOnce}
                onNavigateToOriginal={handleNavigateToOriginal}
              />
            ))}

            {/* Status indicator under latest outgoing message: Only shows 'Seen' when partner has actually viewed */}
            {lastMessageIsOutgoing && lastMessage?.status === 'seen' && (
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
            {lastMessageIsOutgoing && lastMessage?.status === 'delivered' && (
              <div
                className="flex justify-end items-center gap-1 pr-1.5 mt-1.5 text-[12px] text-[#737373] font-medium select-none"
                style={{
                  transform: `translateX(-${dragOffset}px)`,
                  transition: isActivelyDragging
                    ? 'none'
                    : 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
              >
                <span>Delivered</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#737373]" />
              </div>
            )}
            {lastMessageIsOutgoing && (lastMessage?.status === 'sent' || lastMessage?.status === 'sending') && (
              <div
                className="flex justify-end items-center gap-1 pr-1.5 mt-1.5 text-[12px] text-[#737373] font-medium select-none"
                style={{
                  transform: `translateX(-${dragOffset}px)`,
                  transition: isActivelyDragging
                    ? 'none'
                    : 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
              >
                <span>{lastMessage?.status === 'sending' ? 'Sending' : 'Sent'}</span>
                <Check className="w-3.5 h-3.5 text-[#737373]" />
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
