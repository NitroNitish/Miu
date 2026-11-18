import React, { useState, useRef } from 'react';
import { Reply, Trash2, Copy, Smile, Eye, EyeOff, Sparkles, Ban, Edit3 } from 'lucide-react';
import { Message } from '../../types';
import { VoiceMessage } from './VoiceMessage';
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
}) => {
  const { deleteMessage, deleteForEveryone, addReaction, partner } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Vertical spacing between groups vs consecutive
  const spacingClass = isFirstInGroup ? 'mt-4' : 'mt-[3px]';

  // Rounded corners based on grouping
  const getRadiusClasses = () => {
    if (isSingle) return 'rounded-[24px]';
    if (isOutgoing) {
      if (isFirstInGroup) return 'rounded-[24px] rounded-br-[7px]';
      if (isMiddleInGroup) return 'rounded-[24px] rounded-r-[7px]';
      if (isLastInGroup) return 'rounded-[24px] rounded-tr-[7px]';
    } else {
      if (isFirstInGroup) return 'rounded-[24px] rounded-bl-[7px]';
      if (isMiddleInGroup) return 'rounded-[24px] rounded-l-[7px]';
      if (isLastInGroup) return 'rounded-[24px] rounded-tl-[7px]';
    }
    return 'rounded-[24px]';
  };

  // Instagram gradient progression: Magenta at top -> Purple -> Violet -> Indigo at bottom
  const getOutgoingGradient = () => {
    const ratio = totalMessages > 1 ? index / totalMessages : 0.8;
    if (ratio < 0.25) return 'bg-gradient-to-r from-[#D91A8E] to-[#C026D3]';
    if (ratio < 0.50) return 'bg-gradient-to-r from-[#C026D3] to-[#9333EA]';
    if (ratio < 0.75) return 'bg-gradient-to-r from-[#9333EA] to-[#6366F1]';
    return 'bg-gradient-to-r from-[#6366F1] to-[#4F46E5]';
  };

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
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
      className={`group relative flex flex-col ${spacingClass} ${
        isOutgoing ? 'items-end' : 'items-start'
      } w-full select-none`}
      style={{
        transform: `translateX(-${dragOffset}px)`,
        transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.2, 0.9, 0.3, 1)',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Reply target banner if replying to a message */}
      {message.replyTo && (
        <div
          className={`text-[12px] px-3.5 py-1.5 mb-1 rounded-t-xl max-w-[300px] sm:max-w-xs truncate border-l-2 flex items-center gap-1.5 opacity-80 ${
            isOutgoing
              ? 'bg-[#1A1A1A] border-[#D91A8E] text-neutral-300 mr-1'
              : 'bg-[#1A1A1A] border-neutral-500 text-neutral-300 ml-10'
          }`}
        >
          <Reply className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
          <span className="font-semibold text-white">
            {message.replyTo.sender === 'user' ? 'You' : partner.name}:
          </span>
          <span className="truncate">{message.replyTo.text}</span>
        </div>
      )}

      {/* Row container with flush alignment */}
      <div className="flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]">
        {/* Incoming sender avatar (32px beside last message of group) */}
        {!isOutgoing && (
          <div className="w-[32px] shrink-0 flex items-center justify-center">
            {isLastInGroup ? (
              <div className="w-[32px] h-[32px] rounded-full overflow-hidden border border-neutral-800 shrink-0">
                <img
                  src={partner.avatar}
                  alt={partner.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-[32px]" />
            )}
          </div>
        )}

        {/* Main Message Bubble (slightly bigger: 16px text, generous padding) */}
        <div
          className={`relative transition-all shadow-xs ${getRadiusClasses()} ${
            isOutgoing
              ? `${getOutgoingGradient()} text-white`
              : 'bg-[#262626] text-white'
          } ${
            message.type === 'image' || message.type === 'doodle'
              ? 'p-1.5'
              : 'px-4.5 py-3'
          }`}
        >
          {/* TEXT MESSAGE */}
          {message.type === 'text' && (
            <div className="text-[16px] leading-[1.38] select-text whitespace-pre-wrap break-words font-normal tracking-[-0.1px]">
              <span>{message.content}</span>
              {message.isEdited && (
                <span className="ml-1.5 text-[11px] opacity-60 italic">(edited)</span>
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
              <VoiceMessage duration={message.duration || 18} isOutgoing={isOutgoing} />
            </div>
          )}

          {/* VIEW ONCE MEDIA */}
          {message.type === 'view_once' && (
            <div
              onClick={handleBubbleClick}
              className={`flex items-center gap-3 py-1 px-1.5 rounded-xl transition-all ${
                message.isViewed
                  ? 'opacity-60 cursor-default'
                  : 'cursor-pointer hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  message.isViewed
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
          className={`flex items-center gap-1 -mt-2.5 z-10 animate-fade-in ${
            isOutgoing ? 'mr-1 justify-end' : 'ml-10 justify-start'
          }`}
        >
          {Object.entries(message.reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => addReaction(message.id, emoji)}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] bg-[#1A1A1A] border border-[#2E2E2E] shadow-sm hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <span className="leading-none">{emoji}</span>
              {count > 1 && (
                <span className="text-[11px] font-semibold text-neutral-400">
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
        <span className="text-[11px] sm:text-[12px] font-normal text-[#737373] whitespace-nowrap tabular-nums">
          {message.timestamp}
        </span>
      </div>

      {/* Hover Quick Actions on Desktop */}
      <div
        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-0 ${
          isOutgoing ? '-left-22' : '-right-22'
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
          className={`absolute z-30 -top-12 ${
            isOutgoing ? 'right-0' : 'left-10'
          } flex items-center gap-2 p-2 bg-[#1A1A1A]/95 backdrop-blur-md border border-[#2E2E2E] rounded-full shadow-2xl animate-slide-up`}
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
        </div>
      )}

      {/* Context Action Menu Modal */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setShowMenu(false)}
          />
          <div className="relative z-10 w-68 bg-[#1A1A1A] border border-[#2E2E2E] rounded-2xl shadow-2xl overflow-hidden p-2.5 animate-slide-up">
            {/* Quick Emoji Reaction Row */}
            <div className="flex items-center justify-around py-2.5 border-b border-[#2E2E2E] mb-1.5">
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
        </div>
      )}
    </div>
  );
};
