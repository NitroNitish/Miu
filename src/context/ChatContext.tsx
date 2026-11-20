import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, PartnerProfile, UserProfile, MemoryItem, DailyQuestion } from '../types';
import { initialMessages, initialPartnerProfile, initialUserProfile, initialMemories, initialDailyQuestions } from '../data/mockData';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  broadcastTyping: (isTyping: boolean) => void;
  uploadMediaFile: (file: File | Blob, bucket?: 'chat-media' | 'voice-messages' | 'memories') => Promise<string | null>;
  markChatAsSeen: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, connection, partner: authPartner, updatePartnerStatus } = useAuth();

  // Dual Retention Rule: If user is second participant (user_two_id), do not persist chat in localStorage
  const isSecondParticipant = connection && authUser && connection.user_two_id === authUser.id;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (isSecondParticipant) return [];
    const saved = localStorage.getItem('miu_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((m) => m.id === 'msg-1' || m.id === 'msg-12')) {
          localStorage.removeItem('miu_messages');
          return [];
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return initialMessages;
  });

  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  
  // Unread count is reactively calculated from unseen incoming partner messages
  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.sender === 'partner' && m.status !== 'seen').length;
  }, [messages]);

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    const saved = localStorage.getItem('miu_memories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((m) => m.id === 'mem-1' || m.id === 'mem-2')) {
          localStorage.removeItem('miu_memories');
          return [];
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return initialMemories;
  });

  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestion[]>(() => {
    const saved = localStorage.getItem('miu_daily_questions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.some((q) => q.id === 'dq-today' || q.id === 'dq-yesterday')) {
          localStorage.removeItem('miu_daily_questions');
          return [];
        }
        return parsed;
      } catch {
        return [];
      }
    }
    return initialDailyQuestions;
  });

  const [callState, setCallState] = useState<{ isInCall: boolean; type: 'audio' | 'video' | null }>({
    isInCall: false,
    type: null,
  });

  const [activeViewOnceMedia, setActiveViewOnceMedia] = useState<{ messageId: string; url: string } | null>(null);

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize localStorage according to Phase 10 Retention Rules
  useEffect(() => {
    if (!isSecondParticipant) {
      localStorage.setItem('miu_messages', JSON.stringify(messages));
    } else {
      localStorage.removeItem('miu_messages');
    }
  }, [messages, isSecondParticipant]);

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

  // Convert Database Message to UI Message model
  const dbMessageToUI = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any): Message => {
      const isSender = authUser ? m.sender_id === authUser.id : m.sender_id === 'user';
      const createdDate = new Date(m.created_at || Date.now());
      const timeStr = createdDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

      return {
        id: m.id,
        sender: isSender ? 'user' : 'partner',
        type: m.message_type || 'text',
        content: m.content || '',
        mediaUrl: m.media_path,
        duration: m.duration,
        timestamp: timeStr,
        date: 'Today',
        status: m.seen_at ? 'seen' : m.delivered_at ? 'delivered' : 'sent',
        replyTo: m.reply_to_id
          ? {
              id: m.reply_to_id,
              sender: isSender ? 'partner' : 'user',
              text: 'Original message',
            }
          : undefined,
        reactions: m.reactions || {},
        isViewOnce: m.is_view_once,
        isViewed: m.is_viewed,
        isDeletedForEveryone: m.deleted_for_everyone,
        isEdited: !!m.edited_at,
      };
    },
    [authUser]
  );

  // Load Realtime Messages and Presence from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !connection?.conversation_id || !authUser) return;

    const conversationId = connection.conversation_id;

    // 1. Fetch initial message history
    const loadConversation = async () => {
      try {
        const { data: dbMessages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (!error && dbMessages) {
          const uiMsgs = dbMessages.map(dbMessageToUI);
          setMessages(uiMsgs);
        }
      } catch (err) {
        console.error('Error loading messages from Supabase:', err);
      }
    };

    loadConversation();

    // 2. Setup Postgres Changes Realtime Subscription
    const messageChannel = supabase
      .channel(`chat_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = dbMessageToUI(payload.new);
            setMessages((prev) => {
              if (prev.some((x) => x.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbMessageToUI(payload.new);
            setMessages((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((x) => x.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const partnerId = connection
      ? connection.user_one_id === authUser.id
        ? connection.user_two_id
        : connection.user_one_id
      : null;

    // Helper to evaluate partner online presence
    const checkPartnerInPresence = () => {
      if (!presenceChannelRef.current || !partnerId) return;
      const state = presenceChannelRef.current.presenceState();
      let isPartnerOnline = false;
      for (const key of Object.keys(state)) {
        if (key === partnerId) {
          isPartnerOnline = true;
          break;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries = (state[key] || []) as any[];
        if (Array.isArray(entries) && entries.some((e: any) => e.user_id === partnerId)) {
          isPartnerOnline = true;
          break;
        }
      }
      if (isPartnerOnline) {
        updatePartnerStatus('online', 'Active now');
      } else {
        updatePartnerStatus('offline', 'Offline');
      }
    };

    // 3. Setup Broadcast & Presence Channel (Typing, Online status, Seen receipts)
    const presenceChannel = supabase.channel(`chat_presence_${conversationId}`, {
      config: { presence: { key: authUser.id } },
    });
    presenceChannelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        checkPartnerInPresence();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: any[] }) => {
        const isPartner =
          key === partnerId ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newPresences?.some((p: any) => p.user_id === partnerId);
        if (isPartner) {
          updatePartnerStatus('online', 'Active now');
        }
      })
      .on('presence', { event: 'leave' }, () => {
        checkPartnerInPresence();
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.userId !== authUser.id) {
          setIsPartnerTyping(Boolean(payload.payload?.isTyping));
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (payload.payload?.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsPartnerTyping(false);
            }, 3000);
          }
        }
      })
      .on('broadcast', { event: 'messages_seen' }, (payload) => {
        if (payload.payload?.seenBy !== authUser.id) {
          setMessages((prev) =>
            prev.map((m) => (m.sender === 'user' ? { ...m, status: 'seen' } : m))
          );
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            user_id: authUser.id,
            username: authUser.username,
          });
        }
      });

    // Untrack presence when tab is hidden or page is closed, re-track when visible
    const handleVisibilityChange = async () => {
      if (!presenceChannelRef.current) return;
      if (document.hidden) {
        try {
          await presenceChannelRef.current.untrack();
        } catch (err) {
          console.error('Error untracking presence:', err);
        }
      } else {
        try {
          await presenceChannelRef.current.track({
            online_at: new Date().toISOString(),
            user_id: authUser.id,
            username: authUser.username,
          });
        } catch (err) {
          console.error('Error tracking presence:', err);
        }
      }
    };

    const handleBeforeUnload = () => {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      supabase.removeChannel(messageChannel);
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [connection, authUser, dbMessageToUI, updatePartnerStatus]);

  // Broadcast typing status
  const broadcastTyping = (isTyping: boolean) => {
    if (!presenceChannelRef.current || !authUser) return;
    presenceChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: authUser.id, isTyping },
    });
  };

  // Upload media to Supabase Storage
  const uploadMediaFile = async (
    file: File | Blob,
    bucket: 'chat-media' | 'voice-messages' | 'memories' = 'chat-media'
  ): Promise<string | null> => {
    if (!isSupabaseConfigured || !authUser) return null;

    try {
      const ext = file.type.split('/')[1]?.split(';')[0] || 'jpg';
      const path = `${authUser.id}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error('File upload error:', err);
      return null;
    }
  };

  // SEND MESSAGE
  const sendMessage = async ({
    content,
    type = 'text',
    mediaUrl,
    isViewOnce = false,
    replyTo,
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
    const tempId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newMsg: Message = {
      id: tempId,
      sender: 'user',
      type,
      content,
      mediaUrl,
      duration,
      isViewOnce,
      isViewed: false,
      timestamp: getCurrentTime(),
      date: 'Today',
      status: 'sending',
      replyTo,
    };

    // 1. Optimistic UI insertion
    setMessages((prev) => [...prev, newMsg]);

    // 2. Persist to Supabase if configured and connected
    if (isSupabaseConfigured && connection?.conversation_id && authUser) {
      try {
        const { data: inserted, error } = await supabase
          .from('messages')
          .insert([
            {
              conversation_id: connection.conversation_id,
              sender_id: authUser.id,
              message_type: type,
              content,
              media_path: mediaUrl,
              duration,
              is_view_once: isViewOnce,
              reply_to_id: replyTo?.id,
            },
          ])
          .select()
          .single();

        if (!error && inserted) {
          // Replace tempId with actual server message
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...dbMessageToUI(inserted), status: 'sent' } : m))
          );
          return;
        }
      } catch (err) {
        console.error('Failed to insert message to Supabase:', err);
      }
    }

    // Local / Offline fallback simulation (transitions to 'sent', never to 'seen' automatically)
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m))
      );
    }, 400);
  };

  // EDIT MESSAGE
  const editMessage = async (id: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, content: newContent, isEdited: true } : msg
      )
    );

    if (isSupabaseConfigured && authUser) {
      await supabase
        .from('messages')
        .update({ content: newContent, edited_at: new Date().toISOString() })
        .eq('id', id)
        .eq('sender_id', authUser.id);
    }
  };

  // DELETE FOR ME
  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  // DELETE FOR EVERYONE
  const deleteForEveryone = async (id: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              isDeletedForEveryone: true,
              content: 'This message was deleted',
              mediaUrl: undefined,
            }
          : msg
      )
    );

    if (isSupabaseConfigured && authUser) {
      await supabase
        .from('messages')
        .update({
          deleted_for_everyone: true,
          deleted_at: new Date().toISOString(),
          content: 'This message was deleted',
          media_path: null,
        })
        .eq('id', id)
        .eq('sender_id', authUser.id);
    }
  };

  // ADD REACTION
  const addReaction = async (messageId: string, emoji: string) => {
    let updatedReactions: { [key: string]: number } = {};

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const current = { ...(msg.reactions || {}) };
          if (current[emoji]) {
            current[emoji] += 1;
          } else {
            current[emoji] = 1;
          }
          updatedReactions = current;
          return { ...msg, reactions: current };
        }
        return msg;
      })
    );

    if (isSupabaseConfigured) {
      await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);
    }
  };

  // VIEW ONCE ATOMIC CONSUMPTION
  const markViewOnceAsViewed = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isViewed: true } : msg))
    );

    if (isSupabaseConfigured) {
      try {
        await supabase.rpc('open_view_once_media', { p_message_id: messageId });
      } catch (err) {
        console.error('Error opening view-once media:', err);
      }
    }
  };

  // MARK CHAT AS SEEN (Only when partner opens and views the chat)
  const markChatAsSeen = useCallback(async () => {
    // 1. Mark incoming partner messages as seen locally
    setMessages((prev) => {
      let changed = false;
      const next = prev.map((msg) => {
        if (msg.sender === 'partner' && msg.status !== 'seen') {
          changed = true;
          return { ...msg, status: 'seen' as const };
        }
        return msg;
      });
      return changed ? next : prev;
    });

    // 2. Broadcast and persist seen state if Supabase is configured
    if (isSupabaseConfigured && connection?.conversation_id && authUser) {
      if (presenceChannelRef.current) {
        presenceChannelRef.current.send({
          type: 'broadcast',
          event: 'messages_seen',
          payload: {
            conversationId: connection.conversation_id,
            seenBy: authUser.id,
            seenAt: new Date().toISOString(),
          },
        });
      }

      try {
        await supabase
          .from('messages')
          .update({ seen_at: new Date().toISOString() })
          .eq('conversation_id', connection.conversation_id)
          .neq('sender_id', authUser.id)
          .is('seen_at', null);
      } catch (err) {
        console.error('Error updating seen_at in Supabase:', err);
      }
    }
  }, [connection?.conversation_id, authUser]);

  const markAllAsRead = () => {
    markChatAsSeen();
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('miu_messages');
  };

  // DAILY QUESTION
  const answerDailyQuestion = async (id: string, answer: string) => {
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

    if (isSupabaseConfigured && authUser) {
      await supabase.from('daily_answers').insert([
        {
          question_id: id,
          user_id: authUser.id,
          answer,
        },
      ]);
    }

    sendMessage({
      content: `Answered today's question: "${answer}"`,
      type: 'text',
    });
  };

  // DOODLES
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

    if (isSupabaseConfigured && connection && authUser) {
      supabase.from('memories').insert([
        {
          connection_id: connection.id,
          uploaded_by: authUser.id,
          media_path: dataUrl,
          media_type: 'doodle',
          caption,
          is_starred: true,
        },
      ]);
    }
  };

  const sendDoodleToChat = (dataUrl: string) => {
    saveDoodleToMemories(dataUrl, 'Shared sketch');
    sendMessage({
      content: 'Shared a doodle canvas',
      type: 'doodle',
      mediaUrl: dataUrl,
    });
  };

  const sendQuickInteraction = (
    type: 'nudge' | 'pulse' | 'music' | 'weather',
    data?: Record<string, string>
  ) => {
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

  const triggerPartnerResponse = (triggerText?: string) => {
    setIsPartnerTyping(true);
    setTimeout(() => {
      setIsPartnerTyping(false);
      const reply = triggerText ? `Got your note: "${triggerText}".` : 'I am here with you.';
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'partner',
        type: 'text',
        content: reply,
        timestamp: getCurrentTime(),
        date: 'Today',
        status: 'seen',
      };
      setMessages((prev) => [...prev, newMsg]);
    }, 1500);
  };

  // Compute active user profile for UI
  const activeUserProfile: UserProfile = {
    name: authUser?.display_name || initialUserProfile.name,
    handle: authUser?.username ? `@${authUser.username}` : initialUserProfile.handle,
    avatar: authUser?.avatar_url || initialUserProfile.avatar,
    bio: authUser?.bio || initialUserProfile.bio,
    phone: '',
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        partner: authPartner || initialPartnerProfile,
        user: activeUserProfile,
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
        broadcastTyping,
        uploadMediaFile,
        markChatAsSeen,
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
