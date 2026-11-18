import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, PartnerProfile, UserProfile, MemoryItem, DailyQuestion } from '../types';
import { initialMessages, initialPartnerProfile, initialUserProfile, initialMemories, initialDailyQuestions } from '../data/mockData';

interface ChatContextType {
  messages: Message[];
  partner: PartnerProfile;
  user: UserProfile;
  isPartnerTyping: boolean;
  memories: MemoryItem[];
  dailyQuestions: DailyQuestion[];
  unreadCount: number;
  callState: { isInCall: boolean; type: 'audio' | 'video' | null };
  sendMessage: (data: {
    content: string;
    type?: Message['type'];
    mediaUrl?: string;
    isViewOnce?: boolean;
    replyTo?: Message['replyTo'];
    interactionType?: Message['interactionType'];
    interactionData?: Message['interactionData'];
    duration?: number;
  }) => void;
  deleteMessage: (id: string) => void;
  deleteForEveryone: (id: string) => void;
  editMessage: (id: string, newContent: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  markViewOnceAsViewed: (messageId: string) => void;
  markAllAsRead: () => void;
  clearChat: () => void;
  answerDailyQuestion: (id: string, answer: string) => void;
  saveDoodleToMemories: (dataUrl: string, caption?: string) => void;
  sendDoodleToChat: (dataUrl: string) => void;
  sendQuickInteraction: (type: 'nudge' | 'pulse' | 'music' | 'weather', data?: Record<string, string>) => void;
  toggleStarMemory: (id: string) => void;
  startCall: (type: 'audio' | 'video') => void;
  endCall: () => void;
  triggerPartnerResponse: (triggerText?: string) => void;
  activeViewOnceMedia: { messageId: string; url: string } | null;
  setActiveViewOnceMedia: (media: { messageId: string; url: string } | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('miu_messages');
    return saved ? JSON.parse(saved) : initialMessages;
  });

  const [partner] = useState<PartnerProfile>(initialPartnerProfile);
  const [user] = useState<UserProfile>(initialUserProfile);
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('miu_memories');
    return saved ? JSON.parse(saved) : initialMemories;
  });

  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestion[]>(() => {
    const saved = localStorage.getItem('miu_daily_questions');
    return saved ? JSON.parse(saved) : initialDailyQuestions;
  });

  const [callState, setCallState] = useState<{ isInCall: boolean; type: 'audio' | 'video' | null }>({
    isInCall: false,
    type: null,
  });

  const [activeViewOnceMedia, setActiveViewOnceMedia] = useState<{ messageId: string; url: string } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('miu_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('miu_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('miu_daily_questions', JSON.stringify(dailyQuestions));
  }, [dailyQuestions]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const sendMessage = ({
    content,
    type = 'text',
    mediaUrl,
    isViewOnce = false,
    replyTo,
    interactionType,
    interactionData,
    duration,
  }: {
    content: string;
    type?: Message['type'];
    mediaUrl?: string;
    isViewOnce?: boolean;
    replyTo?: Message['replyTo'];
    interactionType?: Message['interactionType'];
    interactionData?: Message['interactionData'];
    duration?: number;
  }) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      type,
      content,
      mediaUrl,
      duration,
      isViewOnce,
      isViewed: false,
      timestamp: getCurrentTime(),
      date: 'Today',
      status: 'sent',
      replyTo,
      interactionType,
      interactionData,
    };

    setMessages((prev) => [...prev, newMsg]);

    // Simulate status update: sent -> delivered -> seen
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'delivered' } : m))
      );
    }, 800);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'seen' } : m))
      );
    }, 1800);

    // If it's a regular user text, simulate a natural reply after 3s
    if (type === 'text' || type === 'doodle' || type === 'interaction') {
      triggerPartnerResponse();
    }
  };

  const triggerPartnerResponse = (customText?: string) => {
    setTimeout(() => {
      setIsPartnerTyping(true);
    }, 2200);

    setTimeout(() => {
      setIsPartnerTyping(false);
      const responses = [
        "I love this. Let me save that thought.",
        "Spot on. You always know what fits best.",
        "Looking forward to this afternoon!",
        "Saved to our private notes. ✨",
        "Could not agree more.",
        "Just smiled reading this :)",
      ];
      const replyText = customText || responses[Math.floor(Math.random() * responses.length)];

      const partnerMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        sender: 'partner',
        type: 'text',
        content: replyText,
        timestamp: getCurrentTime(),
        date: 'Today',
        status: 'seen',
      };

      setMessages((prev) => [...prev, partnerMsg]);
    }, 4500);
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const deleteForEveryone = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              isDeletedForEveryone: true,
              content: 'This message was deleted',
              mediaUrl: undefined,
              reactions: undefined,
            }
          : msg
      )
    );
  };

  const editMessage = (id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              content: newContent,
              isEdited: true,
            }
          : msg
      )
    );
  };

  const addReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;
        const currentReactions = { ...(msg.reactions || {}) };
        if (currentReactions[emoji]) {
          delete currentReactions[emoji];
        } else {
          currentReactions[emoji] = 1;
        }
        return {
          ...msg,
          reactions: currentReactions,
        };
      })
    );
  };

  const markViewOnceAsViewed = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isViewed: true } : msg))
    );
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const answerDailyQuestion = (id: string, answer: string) => {
    setDailyQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            userAnswer: answer,
            isRevealed: true,
            answeredAt: `Today, ${getCurrentTime()}`,
          };
        }
        return q;
      })
    );

    // Also send an automated card notification to chat
    sendMessage({
      content: `Answered today's question: "${answer}"`,
      type: 'text',
    });
  };

  const saveDoodleToMemories = (dataUrl: string, caption = 'Shared canvas sketch') => {
    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}`,
      type: 'doodle',
      url: dataUrl,
      caption,
      date: 'Today',
      sender: 'user',
      isStarred: true,
    };
    setMemories((prev) => [newMemory, ...prev]);
  };

  const sendDoodleToChat = (dataUrl: string) => {
    saveDoodleToMemories(dataUrl, 'Shared sketch');
    sendMessage({
      content: 'Shared a doodle canvas',
      type: 'doodle',
      mediaUrl: dataUrl,
    });
  };

  const sendQuickInteraction = (type: 'nudge' | 'pulse' | 'music' | 'weather', data?: Record<string, string>) => {
    let content = 'Sent an interaction';
    if (type === 'pulse') content = 'Sent a gentle pulse heartbeat ❤️';
    if (type === 'nudge') content = 'Sent a gentle tap: Thinking of you.';
    if (type === 'music') content = `Listening to ${data?.title || 'a quiet track'} together`;
    if (type === 'weather') content = `Current local weather: ${data?.temp || '21°C, Overcast'}`;

    sendMessage({
      content,
      type: 'interaction',
      interactionType: type,
      interactionData: data,
    });
  };

  const toggleStarMemory = (id: string) => {
    setMemories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isStarred: !item.isStarred } : item))
    );
  };

  const startCall = (type: 'audio' | 'video') => {
    setCallState({ isInCall: true, type });
  };

  const endCall = () => {
    setCallState({ isInCall: false, type: null });
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        partner,
        user,
        isPartnerTyping,
        memories,
        dailyQuestions,
        unreadCount,
        callState,
        sendMessage,
        deleteMessage,
        deleteForEveryone,
        editMessage,
        addReaction,
        markViewOnceAsViewed,
        markAllAsRead,
        clearChat,
        answerDailyQuestion,
        saveDoodleToMemories,
        sendDoodleToChat,
        sendQuickInteraction,
        toggleStarMemory,
        startCall,
        endCall,
        triggerPartnerResponse,
        activeViewOnceMedia,
        setActiveViewOnceMedia,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
