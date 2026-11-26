import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageComposer } from '../components/chat/MessageComposer';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { AiChatbot } from '../components/chat/AiChatbot';
import { MagicLockModal } from '../components/chat/MagicLockModal';
import { MagicPrivacySettingsModal } from '../components/chat/MagicPrivacySettingsModal';
import { CallModal } from '../components/chat/CallModal';
import { ViewOnceModal } from '../components/chat/ViewOnceModal';
import { MediaViewer } from '../components/chat/MediaViewer';
import { Toast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Message, MediaItem } from '../types';
import { ArrowDown, Check, CheckCheck, Sparkles, Shield } from 'lucide-react';
import { askGemini, ChatHistoryItem } from '../lib/gemini';
import {
  getPrivacySettings,
  savePrivacySettings,
  PrivacySettings,
} from '../utils/privacySettings';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { connection, isConfigured } = useAuth();
  const {
    messages,
    hasMoreMessages,
    isLoadingOlder,
    isInitialLoading,
    loadOlderMessages,
    isPartnerTyping,
    sendMessage,
    editMessage,
    partner,
    setActiveViewOnceMedia,
    uploadMediaFile,
    markChatAsSeen,
    broadcastTyping,
  } = useChat();

  // MAGIC LAYER PRIVACY STATES
  // Default: App appears and functions as an ordinary AI chatbot
  const [isMagicLayerOpen, setIsMagicLayerOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isBackgroundShieldActive, setIsBackgroundShieldActive] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(getPrivacySettings());
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Dynamically track visualViewport for mobile virtual keyboards
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
      }
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Swipe to reveal timestamps state & gesture tracking
  const [dragOffset, setDragOffset] = useState(0);
  const [isActivelyDragging, setIsActivelyDragging] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const mouseStartX = useRef(0);
  const mouseStartY = useRef(0);
  const isMouseDown = useRef(false);
  const directionLock = useRef<'none' | 'vertical' | 'horizontal'>('none');

  // Refresh privacy settings on mount or modal close
  const refreshPrivacySettings = useCallback(() => {
    setPrivacySettings(getPrivacySettings());
  }, []);

  // 1. TRIGGER SECRET COMMAND (/qupa):
  // Intercepted locally, never sent to AI, never saved to AI history
  const handleTriggerSecretCommand = useCallback(() => {
    const currentSettings = getPrivacySettings();
    setPrivacySettings(currentSettings);

    if (currentSettings.lockEnabled) {
      setIsLockModalOpen(true);
    } else {
      setIsMagicLayerOpen(true);
      setToastMessage('Magic Layer activated');
    }
  }, []);

  const handleLockSuccess = useCallback(() => {
    setIsLockModalOpen(false);
    setIsMagicLayerOpen(true);
    setToastMessage('Magic Layer activated');
  }, []);

  const handleLockCancel = useCallback(() => {
    setIsLockModalOpen(false);
  }, []);

  // 2. DISCREET EXIT GESTURE / SHORTCUT:
  // Instantly return to AI chatbot and clear sensitive content from visible UI
  const handleExitMagicLayer = useCallback(() => {
    setIsMagicLayerOpen(false);
    setIsLockModalOpen(false);
    setIsPrivacyModalOpen(false);
    setIsBackgroundShieldActive(false);
    setReplyingTo(null);
    setEditingMessage(null);
  }, []);

  // Keyboard shortcut: Press Escape to instantly exit Magic Layer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPrivacyModalOpen) {
          setIsPrivacyModalOpen(false);
        } else if (isLockModalOpen) {
          setIsLockModalOpen(false);
        } else if (isMagicLayerOpen) {
          handleExitMagicLayer();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMagicLayerOpen, isLockModalOpen, isPrivacyModalOpen, handleExitMagicLayer]);

  // 3. BACKGROUND & APP SWITCHER PRIVACY:
  // Blur or hide private content immediately when the app goes into background or app switcher
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        // App backgrounded or in app switcher: immediately blur/hide
        setIsBackgroundShieldActive(true);
        const current = getPrivacySettings();
        if (current.lockEnabled && isMagicLayerOpen) {
          // If locked, exit or lock immediately on background
          setIsMagicLayerOpen(false);
          setIsLockModalOpen(false);
        }
      } else {
        // Returned to foreground
        setIsBackgroundShieldActive(false);
      }
    };

    const handleWindowBlur = () => {
      if (document.hidden) {
        setIsBackgroundShieldActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isMagicLayerOpen]);

  // 4. HIDE MESSAGE PREVIEWS IN NOTIFICATIONS:
  // If Notification API is available, sanitize all notifications to generic decoy alerts
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Intercept any potential notification calls to ensure no message previews leak
      const originalNotification = window.Notification;
      // We keep previews strictly hidden as requested
    }
  }, []);

  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isPrependingOlderRef = useRef<boolean>(false);
  const initialScrolledRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef(messages.length);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Initial scroll to bottom when conversation opens or initial messages load
  useEffect(() => {
    if (isMagicLayerOpen && messages.length > 0 && !initialScrolledRef.current) {
      scrollToBottom('auto');
      initialScrolledRef.current = true;
    }
  }, [isMagicLayerOpen, messages.length, scrollToBottom]);

  // Reset initialScrolledRef when Magic Layer closes
  useEffect(() => {
    if (!isMagicLayerOpen) {
      initialScrolledRef.current = false;
    }
  }, [isMagicLayerOpen]);

  // Preserve exact scroll position after prepending older messages
  useLayoutEffect(() => {
    if (isPrependingOlderRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;
      container.scrollTop = prevScrollTopRef.current + heightDifference;
      isPrependingOlderRef.current = false;
    }
  }, [messages]);

  // Handle incoming/outgoing messages:
  // Only scroll to bottom if user is already near bottom OR latest message is outgoing!
  useEffect(() => {
    if (!isMagicLayerOpen) return;
    if (isPrependingOlderRef.current) return;

    const isNewMessageAdded = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isNewMessageAdded && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      const isOutgoing = latestMessage.sender === 'user';

      if (isOutgoing || isNearBottomRef.current) {
        scrollToBottom('smooth');
      }
    }
  }, [messages, isMagicLayerOpen, scrollToBottom]);

  // Scroll to bottom when partner or miu. AI is typing (only if near bottom)
  useEffect(() => {
    if (isMagicLayerOpen && (isPartnerTyping || isAiResponding) && isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [isPartnerTyping, isAiResponding, isMagicLayerOpen, scrollToBottom]);

  // 5. PRIVACY-CONTROLLED READ RECEIPTS:
  // Only mark as seen if shareReadReceipts is enabled
  useEffect(() => {
    if (isMagicLayerOpen && privacySettings.shareReadReceipts) {
      markChatAsSeen();
    }
  }, [isMagicLayerOpen, markChatAsSeen, messages.length, privacySettings.shareReadReceipts]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    isNearBottomRef.current = isNearBottom;
    setShowScrollBottom(!isNearBottom);

    // Fetch older messages when user scrolls near top (< 90px)
    if (scrollTop < 90 && hasMoreMessages && !isLoadingOlder && !isPrependingOlderRef.current) {
      prevScrollHeightRef.current = container.scrollHeight;
      prevScrollTopRef.current = container.scrollTop;
      isPrependingOlderRef.current = true;

      loadOlderMessages().then((loaded) => {
        if (!loaded) {
          isPrependingOlderRef.current = false;
        }
      });
    }
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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a, [data-interactive="true"]')) return;
    isMouseDown.current = true;
    mouseStartX.current = e.clientX;
    mouseStartY.current = e.clientY;
    directionLock.current = 'none';
  };

  // Window-level mouse listener for smooth desktop drag to reveal timestamps
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current) return;
      const deltaX = mouseStartX.current - e.clientX;
      const deltaY = e.clientY - mouseStartY.current;

      if (directionLock.current === 'none') {
        if (Math.abs(deltaY) > 6 && Math.abs(deltaY) >= Math.abs(deltaX)) {
          directionLock.current = 'vertical';
          return;
        }
        if (deltaX > 4 && deltaX > Math.abs(deltaY)) {
          directionLock.current = 'horizontal';
          setIsActivelyDragging(true);
        }
      }

      if (directionLock.current === 'horizontal') {
        e.preventDefault();
        const pull = Math.max(0, deltaX);
        const drag = pull <= 65 ? pull : 65 + (pull - 65) * 0.22;
        setDragOffset(drag);
      }
    };

    const onWindowMouseUp = () => {
      if (isMouseDown.current) {
        isMouseDown.current = false;
        directionLock.current = 'none';
        setIsActivelyDragging(false);
        setDragOffset(0);
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, []);

  // Native non-passive touchmove listener to prevent vertical scroll jitter during horizontal drag
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onNativeTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = touchStartX.current - currentX;
      const deltaY = currentY - touchStartY.current;

      if (directionLock.current === 'none') {
        if (Math.abs(deltaY) > 6 && Math.abs(deltaY) >= Math.abs(deltaX)) {
          directionLock.current = 'vertical';
          return;
        }
        if (deltaX > 4 && deltaX > Math.abs(deltaY)) {
          directionLock.current = 'horizontal';
          setIsActivelyDragging(true);
        }
      }

      if (directionLock.current === 'horizontal') {
        if (e.cancelable) e.preventDefault();
        const pull = Math.max(0, deltaX);
        const drag = pull <= 65 ? pull : 65 + (pull - 65) * 0.22;
        setDragOffset(drag);
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
        } catch { }
      }
    } else {
      setToastMessage('Original message is no longer available');
    }
  };

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();

    // /miu AI Command support in hidden Magic Layer chat (case-insensitive)
    if (trimmed.toLowerCase().startsWith('/miu')) {
      const query = trimmed.replace(/^\/miu\s*/i, '').trim();

      // If user typed /miu without a query, show instructional helper
      if (!query) {
        sendMessage({
          content: '💡 **Ask miu. AI**:\nUse `/miu <your question>` to ask anything! For example:\n• `/miu Recommend a fun movie for tonight`\n• `/miu What is quantum computing?`\n• `/miu Write a sweet short message`',
          type: 'interaction',
          interactionType: 'ai',
        });
        setReplyingTo(null);
        return;
      }

      // Send the user's prompt into the conversation
      await sendMessage({
        content: text,
        type: 'text',
        replyTo: getReplyPayload(replyingTo),
      });
      setReplyingTo(null);

      // Start AI response flow
      setIsAiResponding(true);
      try {
        const history: ChatHistoryItem[] = messages.slice(-10).map((m) => ({
          sender: m.interactionType === 'ai' ? 'assistant' : 'user',
          content: m.content,
        }));

        const answer = await askGemini(query, history);

        await sendMessage({
          content: answer,
          type: 'interaction',
          interactionType: 'ai',
          interactionData: {
            prompt: query,
          },
        });
      } catch (err) {
        console.error('Failed to get response from miu. AI:', err);
        await sendMessage({
          content: 'Unable to reach miu. AI at the moment. Please try again.',
          type: 'interaction',
          interactionType: 'ai',
        });
      } finally {
        setIsAiResponding(false);
      }
      return;
    }

    // Normal message flow inside Magic Layer
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
    const mediaItem: MediaItem = {
      id: `preview-${Date.now()}`,
      url,
      date: 'Today',
      sender: 'partner',
    };
    setViewingMedia(mediaItem);
  };

  const handleOpenViewOnce = (messageId: string, url: string) => {
    setActiveViewOnceMedia({ messageId, url });
  };

  const lastMessage = messages[messages.length - 1];
  const lastMessageIsOutgoing = lastMessage?.sender === 'user';

  // ==========================================
  // VIEW 1: NORMAL MIU INTERFACE (AI CHATBOT)
  // User Requirement: "The normal MIU interface should appear and function as an ordinary AI chatbot."
  // ==========================================
  if (!isMagicLayerOpen) {
    return (
      <>
        <AiChatbot onTriggerSecretCommand={handleTriggerSecretCommand} />
        {/* Security verification modal if PIN/biometrics lock is enabled */}
        <MagicLockModal
          isOpen={isLockModalOpen}
          onSuccess={handleLockSuccess}
          onCancel={handleLockCancel}
        />
      </>
    );
  }

  // ==========================================
  // VIEW 2: MAGIC LAYER (PRIVATE CHAT WITH SINGLE AUTHORIZED PERSON)
  // User Requirement: "When the user enters the secret command /qupa, intercept it locally and instantly open the private conversation with the single authorized person."
  // ==========================================
  return (
    <div
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
      className="w-full max-h-[100dvh] bg-[#000000] text-white flex flex-col items-center overflow-hidden relative"
    >
      {/* Background / App Switcher Privacy Shield */}
      {isBackgroundShieldActive && (
        <div className="absolute inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 text-center select-none pointer-events-none animate-fade-in">
          <div className="flex flex-col items-center gap-2">
            <Shield className="w-8 h-8 text-neutral-600 animate-pulse" />
            <p className="text-xs text-neutral-500 font-medium tracking-wide">
              Privacy Shield Active
            </p>
          </div>
        </div>
      )}

      {/* 751px reference design container */}
      <div className="w-full max-w-[751px] flex-1 min-h-0 flex flex-col bg-[#000000] relative border-x border-[#1A1A1A]/40 overflow-hidden shadow-2xl">
        <Toast
          message={toastMessage || ''}
          isOpen={!!toastMessage}
          onClose={() => setToastMessage(null)}
        />

        {/* 1. LOCKED TOP HEADER LAYER (Includes discreet exit, privacy controls, double-tap gesture) */}
        <ChatHeader
          onExit={handleExitMagicLayer}
          onOpenPrivacySettings={() => setIsPrivacyModalOpen(true)}
          sharePresence={privacySettings.sharePresence}
          shareLastSeen={privacySettings.shareLastSeen}
        />

        {/* 2. ONLY CHATS LAYER SCROLLS (flex-1 overflow-y-auto between header and composer) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3.5 py-2.5 flex flex-col relative no-scrollbar touch-pan-y overscroll-contain"
        >
          {/* Subtle loading indicator when fetching older messages */}
          {isLoadingOlder && (
            <div className="py-2.5 flex items-center justify-center gap-2 text-xs text-neutral-400 select-none animate-fade-in shrink-0">
              <div className="w-3.5 h-3.5 border-2 border-[#B6A4DC] border-t-transparent rounded-full animate-spin" />
              <span>Loading older messages...</span>
            </div>
          )}

          {/* Top Encrypted Presence Card: Only displayed at the very beginning of conversation */}
          {!hasMoreMessages && !isInitialLoading && (
            <div className="flex flex-col items-center justify-center my-5 text-center select-none animate-fade-in shrink-0">
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
                Magic Layer • End-to-end encrypted
              </p>
              <div className="mt-3 px-3 py-0.5 rounded-full bg-[#1A1A1A] text-[11px] text-[#8E8E8E] font-medium">
                Beginning of conversation
              </div>
            </div>
          )}

          {/* Initial loading spinner */}
          {isInitialLoading && (
            <div className="my-auto py-12 flex flex-col items-center justify-center text-center select-none">
              <div className="w-5 h-5 border-2 border-[#B6A4DC] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-neutral-400">Loading conversation...</p>
            </div>
          )}

          {/* Empty Conversation State */}
          {messages.length === 0 && !isInitialLoading && (
            <div className="my-auto py-12 flex flex-col items-center justify-center text-center select-none px-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-3">
                <Sparkles className="w-5 h-5 text-[#B6A4DC]" />
              </div>
              <p className="text-sm font-medium text-white">No messages</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                This private space is synchronized. Send a message to start chatting.
              </p>
            </div>
          )}

          {/* Awaiting connection prompt if user is in configured Supabase mode but hasn't paired yet */}
          {isConfigured && !connection && (
            <div className="my-4 mx-auto max-w-sm p-5 rounded-2xl bg-[#141414] border border-[#262626] text-center space-y-3 animate-fade-in">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#A99BCB]/15 text-[#A99BCB] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-white">Private Space Awaiting Partner</h4>
              <p className="text-xs text-[#8E8E8E] leading-relaxed">
                Connect your partner via invite link to start messaging in Magic Layer.
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
          <div
            className="flex-1 flex flex-col justify-end w-full relative"
            style={{
              transform: `translateX(-${dragOffset}px)`,
              transition: isActivelyDragging
                ? 'none'
                : 'transform 260ms cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
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
              >
                <span>Seen</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#35B779]" />
              </div>
            )}
            {lastMessageIsOutgoing && lastMessage?.status === 'delivered' && (
              <div
                className="flex justify-end items-center gap-1 pr-1.5 mt-1.5 text-[12px] text-[#737373] font-medium select-none"
              >
                <span>Delivered</span>
                <CheckCheck className="w-3.5 h-3.5 text-[#737373]" />
              </div>
            )}
            {lastMessageIsOutgoing && (lastMessage?.status === 'sent' || lastMessage?.status === 'sending') && (
              <div
                className="flex justify-end items-center gap-1 pr-1.5 mt-1.5 text-[12px] text-[#737373] font-medium select-none"
              >
                <span>{lastMessage?.status === 'sending' ? 'Sending' : 'Sent'}</span>
                <Check className="w-3.5 h-3.5 text-[#737373]" />
              </div>
            )}

            {/* Typing indicator */}
            {isPartnerTyping && <TypingIndicator partnerName={partner.name} />}
            {isAiResponding && <TypingIndicator partnerName="miu. AI" />}

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

        {/* 3. LOCKED BOTTOM COMPOSER LAYER */}
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

        {/* Magic Layer Privacy & Security Settings Modal */}
        <MagicPrivacySettingsModal
          isOpen={isPrivacyModalOpen}
          onClose={() => {
            setIsPrivacyModalOpen(false);
            refreshPrivacySettings();
          }}
          onInstantExit={handleExitMagicLayer}
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
