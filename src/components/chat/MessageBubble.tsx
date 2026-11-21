import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Reply, Trash2, Copy, Smile, Eye, EyeOff, Sparkles, Ban, Edit3, Plus } from 'lucide-react';
import { Message } from '../../types';
import { VoiceMessage } from './VoiceMessage';
import { EmojiLibraryModal } from './EmojiLibraryModal';
import { useChat } from '../../context/ChatContext';

interface MessageBubbleProps {
  message: Message;
  previousMessage?: Message;
  nextMessage?: Message;
  index: number;
  totalMessages: number;
  dragOffset?: number;
  isDragging?: boolean;
  onReply: (msg: Message) => void;
  onCopy: (text: string) => void;
  onEdit?: (msg: Message) => void;
  onOpenMedia?: (url: string) => void;
  onOpenViewOnce?: (messageId: string, url: string) => void;
  onNavigateToOriginal?: (messageId: string) => void;
  isHighlighted?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  previousMessage,
  nextMessage,
  index,
  totalMessages,
  dragOffset = 0,
  isDragging = false,
  onReply,
  onCopy,
  onEdit,
  onOpenMedia,
  onOpenViewOnce,
  onNavigateToOriginal,
  isHighlighted = false,
}) => {
  const { deleteMessage, deleteForEveryone, addReaction, partner } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullEmojiLibrary, setShowFullEmojiLibrary] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on Escape key
  useEffect(() => {
    if (!showMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMenu]);

  // Cancel long press if user begins pulling timestamps
  React.useEffect(() => {
    if (dragOffset > 5 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [dragOffset]);

  const isOutgoing = message.sender === 'user';
  const quickReactions = ['❤️', '👍', '🔥', '😂', '😮', '😢'];

  // Message grouping
  const isFirstInGroup = !previousMessage || previousMessage.sender !== message.sender;
  const isLastInGroup = !nextMessage || nextMessage.sender !== message.sender;
  const isMiddleInGroup = !isFirstInGroup && !isLastInGroup;
  const isSingle = isFirstInGroup && isLastInGroup;

  // Vertical spacing: same-sender tightly grouped (3–5px gap), sender change slightly more (10–12px)
  const spacingClass = isFirstInGroup
    ? index === 0
      ? 'mt-1'
      : 'mt-[11px]'
    : 'mt-[4px]';

  // Rounded corners based on grouping
  const getRadiusClasses = () => {
    if (isSingle) return 'rounded-[22px]';
    if (isOutgoing) {
      if (isFirstInGroup) return 'rounded-[22px] rounded-br-[6px]';
      if (isMiddleInGroup) return 'rounded-[22px] rounded-r-[6px]';
      if (isLastInGroup) return 'rounded-[22px] rounded-tr-[6px]';
    } else {
      if (isFirstInGroup) return 'rounded-[22px] rounded-bl-[6px]';
      if (isMiddleInGroup) return 'rounded-[22px] rounded-l-[6px]';
      if (isLastInGroup) return 'rounded-[22px] rounded-tl-[6px]';
    }
    return 'rounded-[22px]';
  };

  // Instagram gradient progression: Magenta at top -> Purple -> Violet -> Indigo at bottom
  const getOutgoingGradient = () => {
    const ratio = totalMessages > 1 ? index / totalMessages : 0.8;
    if (ratio < 0.25) return 'bg-gradient-to-r from-[#D91A8E] to-[#C026D3]';
    if (ratio < 0.50) return 'bg-gradient-to-r from-[#C026D3] to-[#9333EA]';
    if (ratio < 0.75) return 'bg-gradient-to-r from-[#9333EA] to-[#6366F1]';
    return 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5]';
  };

  // Swipe to reply gesture state
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const gestureModeRef = useRef<'none' | 'vertical' | 'swipe_reply' | 'swipe_left'>('none');
  const hasTriggeredHapticRef = useRef(false);
  const isMouseDownRef = useRef(false);

  const triggerHaptic = (pattern: number | number[] = 15) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // ignore
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    gestureModeRef.current = 'none';
    hasTriggeredHapticRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
      triggerHaptic(20);
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartXRef.current;
    const deltaY = currentY - touchStartYRef.current;

    if (gestureModeRef.current === 'none') {
      if (Math.abs(deltaY) > 8 && Math.abs(deltaY) >= Math.abs(deltaX)) {
        gestureModeRef.current = 'vertical';
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        return;
      }
      if (deltaX < -10) {
        gestureModeRef.current = 'swipe_left';
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        return;
      }
      if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.2) {
        gestureModeRef.current = 'swipe_reply';
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        setIsSwiping(true);
      }
    }

    if (gestureModeRef.current === 'swipe_reply') {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      const pull = Math.max(0, deltaX - 10);
      const damped = Math.min(65, Math.pow(pull, 0.78) * 1.7);
      setSwipeOffset(damped);

      // Trigger haptic when crossing activation threshold (45px)
      if (damped >= 45) {
        if (!hasTriggeredHapticRef.current) {
          triggerHaptic(18);
          hasTriggeredHapticRef.current = true;
        }
      } else if (damped < 35) {
        hasTriggeredHapticRef.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (gestureModeRef.current === 'swipe_reply') {
      if (swipeOffset >= 45) {
        onReply(message);
        triggerHaptic([10, 30, 15]);
      }
      setIsSwiping(false);
      setSwipeOffset(0);
    }
    gestureModeRef.current = 'none';
  };

  // Desktop mouse drag to reply support
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a')) return;
    touchStartXRef.current = e.clientX;
    touchStartYRef.current = e.clientY;
    isMouseDownRef.current = true;
    gestureModeRef.current = 'none';
    hasTriggeredHapticRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current) return;
    const deltaX = e.clientX - touchStartXRef.current;
    const deltaY = e.clientY - touchStartYRef.current;

    if (gestureModeRef.current === 'none') {
      if (deltaX > 10 && deltaX > Math.abs(deltaY) * 1.2) {
        gestureModeRef.current = 'swipe_reply';
        setIsSwiping(true);
      }
    }

    if (gestureModeRef.current === 'swipe_reply') {
      const pull = Math.max(0, deltaX - 10);
      const damped = Math.min(65, Math.pow(pull, 0.78) * 1.7);
      setSwipeOffset(damped);

      if (damped >= 45) {
        if (!hasTriggeredHapticRef.current) {
          triggerHaptic(18);
          hasTriggeredHapticRef.current = true;
        }
      } else if (damped < 35) {
        hasTriggeredHapticRef.current = false;
      }
    }
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      if (gestureModeRef.current === 'swipe_reply') {
        if (swipeOffset >= 45) {
          onReply(message);
          triggerHaptic([10, 30, 15]);
        }
        setIsSwiping(false);
        setSwipeOffset(0);
      }
      gestureModeRef.current = 'none';
    }
  };

  const handleBubbleClick = () => {
    if (dragOffset > 5) return;
    if (message.isDeletedForEveryone) return;
    if (message.type === 'view_once' && !message.isViewed && message.mediaUrl && onOpenViewOnce) {
      onOpenViewOnce(message.id, message.mediaUrl);
    } else if (message.type === 'image' && message.mediaUrl && onOpenMedia) {
      onOpenMedia(message.mediaUrl);
    } else if (message.type === 'doodle' && message.mediaUrl && onOpenMedia) {
      onOpenMedia(message.mediaUrl);
    }
  };

  // If deleted for everyone
  if (message.isDeletedForEveryone) {
    return (
      <div
        className={`group relative flex flex-col ${spacingClass} ${isOutgoing ? 'items-end' : 'items-start'} w-full select-none`}
        style={{
          transform: `translateX(-${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        <div className="px-4 py-2.5 rounded-2xl border border-[#2E2E2E] bg-[#141414] text-xs italic text-[#737373] flex items-center gap-2 select-none">
          <Ban className="w-4 h-4 opacity-60" />
          <span>{isOutgoing ? 'You deleted this message' : 'This message was deleted'}</span>
        </div>

        {/* Timestamp revealed in right margin when swiped */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3.5 flex items-center select-none pointer-events-none"
          style={{
            opacity: Math.min(1, Math.max(0, (dragOffset - 8) / 28)),
            transition: isDragging ? 'none' : 'opacity 200ms ease',
          }}
        >
          <span className="text-[11px] sm:text-[12px] font-normal text-[#737373] whitespace-nowrap tabular-nums">
            {message.timestamp}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col ${spacingClass} ${isOutgoing ? 'items-end' : 'items-start'
        } w-full select-none transition-all duration-300 ${
        isHighlighted
          ? 'ring-2 ring-[#B6A4DC] ring-offset-2 ring-offset-black rounded-[26px] scale-[1.02] shadow-[0_0_24px_rgba(182,164,220,0.6)] bg-white/5'
          : ''
      }`}
      style={{
        transform: `translateX(${swipeOffset - dragOffset}px)`,
        transition: isSwiping || isDragging ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.9, 0.3, 1)',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Fluid Swipe-Right-to-Reply Icon on the left */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-10 flex items-center justify-center pl-1 sm:pl-2"
        style={{
          opacity: Math.min(1, Math.max(0, (swipeOffset - 8) / 28)),
          transform: `translateX(${Math.min(swipeOffset * 0.4, 20)}px) scale(${Math.min(
            1.12,
            Math.max(0.4, swipeOffset / 40)
          )})`,
          transition: isSwiping ? 'none' : 'all 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 shadow-md ${
            swipeOffset >= 45
              ? 'bg-[#A99BCB] dark:bg-[#B6A4DC] text-[#111214] scale-110 shadow-[0_0_14px_rgba(182,164,220,0.6)] ring-2 ring-white/30'
              : 'bg-[#1E1E22] border border-[#35363C] text-neutral-300'
          }`}
        >
          <Reply
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              swipeOffset >= 45 ? 'scale-110 -rotate-12' : 'scale-100 rotate-0'
            }`}
          />
        </div>
      </div>

      {/* Row container with flush alignment */}
      <div
        className={`flex max-w-[80%] sm:max-w-[75%] min-w-0 w-fit ${
          isOutgoing ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* Main Message Bubble (Instagram-style compact bubble with max-width: 80%, width: fit-content, min-width: 0) */}
        <div
          className={`relative transition-all shadow-xs max-w-full w-fit min-w-0 flex flex-col overflow-hidden break-words ${getRadiusClasses()} ${
            isOutgoing
              ? `${getOutgoingGradient()} text-white`
              : 'bg-[#262626] text-white'
          } ${
            message.type === 'image' || message.type === 'doodle'
              ? 'p-1.5'
              : 'px-3.5 py-2 sm:px-4 sm:py-2.5'
          }`}
          style={{ maxWidth: '100%', width: 'fit-content', minWidth: 0 }}
        >
          {/* Quoted replied snippet inside the bubble */}
          {message.replyTo && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToOriginal?.(message.replyTo!.id);
              }}
              className={`w-full max-w-full min-w-0 box-border mb-1.5 p-1.5 sm:p-2 rounded-lg border-l-[3px] text-xs cursor-pointer select-none transition-all active:scale-[0.98] overflow-hidden ${
                isOutgoing
                  ? 'bg-black/30 hover:bg-black/40 border-white/90 text-white/90 shadow-xs'
                  : 'bg-white/10 hover:bg-white/15 border-[#B6A4DC] text-neutral-200 shadow-xs'
              }`}
              style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
              title="Tap to jump to original message"
            >
              <div className="flex items-center gap-1.5 mb-0.5 min-w-0 w-full overflow-hidden">
                <Reply className={`w-2.5 h-2.5 shrink-0 ${isOutgoing ? 'text-white/80' : 'text-[#B6A4DC]'}`} />
                <span className={`font-semibold text-[10.5px] truncate tracking-tight min-w-0 ${isOutgoing ? 'text-white' : 'text-[#B6A4DC]'}`}>
                  {message.replyTo.sender === 'user' ? 'You' : partner.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 min-w-0 w-full overflow-hidden">
                <p className="text-[11px] opacity-85 leading-snug flex-1 min-w-0 overflow-hidden line-clamp-2 break-words font-normal">
                  {message.replyTo.text || 'Original message'}
                </p>
                {message.replyTo.mediaUrl && (
                  <div className="w-7 h-7 rounded-md overflow-hidden shrink-0 border border-white/15 bg-black/40">
                    <img
                      src={message.replyTo.mediaUrl}
                      alt="Quoted media preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {/* TEXT MESSAGE */}
          {message.type === 'text' && (
            <div className="text-[15px] leading-[1.35] select-text whitespace-pre-wrap break-words font-normal tracking-[-0.1px] min-w-0 max-w-full">
              <span>{message.content}</span>
              {message.isEdited && (
                <span className="ml-1.5 text-[10px] opacity-60 italic">(edited)</span>
              )}
            </div>
          )}

          {/* IMAGE MESSAGE */}
          {message.type === 'image' && message.mediaUrl && (
            <div
              onClick={handleBubbleClick}
              className="cursor-pointer group/img relative rounded-[20px] overflow-hidden"
            >
              <img
                src={message.mediaUrl}
                alt="Shared media"
                className="w-full max-h-84 object-cover rounded-[20px] transition-transform duration-200 group-hover/img:scale-[1.01]"
                loading="lazy"
              />
              {message.content && message.content !== 'Shared image' && (
                <p className="text-[14px] px-3 py-2 leading-relaxed text-white select-text">
                  {message.content}
                </p>
              )}
            </div>
          )}

          {/* DOODLE MESSAGE */}
          {message.type === 'doodle' && message.mediaUrl && (
            <div
              onClick={handleBubbleClick}
              className="cursor-pointer group/doodle relative rounded-[20px] overflow-hidden bg-neutral-900 border border-neutral-800"
            >
              <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D91A8E]" />
                <span>Doodle</span>
              </div>
              <img
                src={message.mediaUrl}
                alt="Shared doodle"
                className="w-full max-h-72 object-contain rounded-[20px] p-2 bg-[#000000]"
              />
            </div>
          )}

          {/* VOICE MESSAGE */}
          {message.type === 'voice' && (
            <div className="py-0.5">
              <VoiceMessage
                audioUrl={
                  message.mediaUrl ||
                  (message.content.startsWith('data:audio') ? message.content : undefined)
                }
                duration={message.duration || 18}
                isOutgoing={isOutgoing}
                messageId={message.id}
              />
            </div>
          )}

          {/* VIEW ONCE MEDIA */}
          {message.type === 'view_once' && (
            <div
              onClick={handleBubbleClick}
              className={`flex items-center gap-3 py-1 px-1.5 rounded-xl transition-all ${message.isViewed
                  ? 'opacity-60 cursor-default'
                  : 'cursor-pointer hover:opacity-90 active:scale-[0.98]'
                }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${message.isViewed
                    ? 'border-neutral-500 bg-transparent text-neutral-400'
                    : 'border-[#D91A8E] bg-[#D91A8E]/15 text-[#D91A8E]'
                  }`}
              >
                {message.isViewed ? (
                  <EyeOff className="w-4.5 h-4.5" />
                ) : (
                  <Eye className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold">
                    {message.isViewed ? 'Opened' : 'Photo'}
                  </span>
                  {!message.isViewed && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#D91A8E] text-white font-bold">
                      1
                    </span>
                  )}
                </div>
                <span className="text-xs opacity-75">
                  {message.isViewed
                    ? 'View once media has expired'
                    : 'Tap to view once'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Reaction Pill */}
      {message.reactions && Object.keys(message.reactions).length > 0 && (
        <div
          className={`flex items-center gap-1 -mt-2.5 z-10 animate-fade-in ${isOutgoing ? 'mr-1 justify-end' : 'ml-1 justify-start'
            }`}
        >
          {Object.entries(message.reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => addReaction(message.id, emoji)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] bg-[#1A1A1A] border border-[#2E2E2E] shadow-sm hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <span className="leading-none">{emoji}</span>
              {count > 1 && (
                <span className="text-[10px] font-semibold text-neutral-400">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Instagram-style revealable timestamp in right gutter */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3 flex items-center select-none pointer-events-none"
        style={{
          opacity: Math.min(1, Math.max(0, (dragOffset - 8) / 28)),
          transition: isDragging ? 'none' : 'opacity 200ms ease',
        }}
      >
        <span className="text-[10.5px] sm:text-[11px] font-normal text-[#737373] whitespace-nowrap tabular-nums">
          {message.timestamp}
        </span>
      </div>

      {/* Hover Quick Actions on Desktop */}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-0 ${isOutgoing ? '-left-22' : '-right-22'
          } flex items-center gap-0.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-full px-2 py-1 shadow-lg`}
      >
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="React"
        >
          <Smile className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReply(message)}
          className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Reply"
        >
          <Reply className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowMenu(true)}
          className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="More options"
        >
          <span className="text-xs leading-none font-bold">•••</span>
        </button>
      </div>

      {/* Floating Reaction Picker */}
      {showEmojiPicker && (
        <div
          className={`absolute z-30 -top-12 ${isOutgoing ? 'right-0' : 'left-0'
            } flex items-center gap-1.5 p-1.5 bg-[#1A1A1A]/95 backdrop-blur-md border border-[#2E2E2E] rounded-full shadow-2xl animate-slide-up`}
        >
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                addReaction(message.id, emoji);
                setShowEmojiPicker(false);
              }}
              className="text-2xl p-1 hover:scale-130 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowEmojiPicker(false);
              setShowFullEmojiLibrary(true);
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#A99BCB]/25 hover:text-[#A99BCB] dark:hover:text-[#B6A4DC] text-neutral-300 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-xs ml-0.5"
            title="Whole emoji library"
            aria-label="Whole emoji library"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      )}

      {/* Context Action Menu Modal (Portaled directly to document.body to break free of transforms & stacking contexts) */}
      {showMenu &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none"
            role="dialog"
            aria-modal="true"
          >
            {/* Fullscreen Backdrop: Intercepts all clicks & touches so underlying elements never trigger */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
            />

            {/* Menu Popup Surface */}
            <div
              ref={menuRef}
              className="relative z-10 w-68 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden p-2.5 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Quick Emoji Reaction Row */}
              <div className="flex items-center justify-around py-2.5 border-b border-[#2E2E2E] mb-1.5 px-1">
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      addReaction(message.id, emoji);
                      setShowMenu(false);
                    }}
                    className="text-2xl p-1 hover:scale-135 active:scale-90 transition-all duration-150 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowFullEmojiLibrary(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#A99BCB]/25 hover:text-[#A99BCB] dark:hover:text-[#B6A4DC] text-neutral-300 flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer shadow-xs ml-1"
                  title="Whole emoji library"
                  aria-label="Whole emoji library"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              <button
                onClick={() => {
                  onReply(message);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-neutral-200 hover:bg-[#262626] rounded-xl transition-colors text-left cursor-pointer"
              >
                <Reply className="w-4 h-4 text-neutral-400" />
                Reply
              </button>

              {message.type === 'text' && (
                <button
                  onClick={() => {
                    onCopy(message.content);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-neutral-200 hover:bg-[#262626] rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-neutral-400" />
                  Copy text
                </button>
              )}

              {/* Edit message for outgoing text */}
              {isOutgoing && message.type === 'text' && onEdit && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(message);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-neutral-200 hover:bg-[#262626] rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-neutral-400" />
                  Edit message
                </button>
              )}

              <div className="my-1.5 border-t border-[#2E2E2E]" />

              {/* Delete for everyone (outgoing) */}
              {isOutgoing && (
                <button
                  onClick={() => {
                    deleteForEveryone(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-red-400 hover:bg-red-950/30 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete for everyone
                </button>
              )}

              {/* Delete for me */}
              <button
                onClick={() => {
                  deleteMessage(message.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-neutral-400 hover:bg-[#262626] rounded-xl transition-colors text-left cursor-pointer"
              >
                <Trash2 className="w-4 h-4 opacity-60" />
                Delete for me
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Whole Emoji Library Modal */}
      <EmojiLibraryModal
        isOpen={showFullEmojiLibrary}
        onClose={() => setShowFullEmojiLibrary(false)}
        onSelectEmoji={(emoji) => addReaction(message.id, emoji)}
        messagePreview={message.type === 'text' ? message.content : undefined}
      />
    </div>
  );
};
