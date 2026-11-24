import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Message, PartnerProfile, UserProfile } from '../types';
import { initialPartnerProfile, initialUserProfile } from '../data/mockData';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const PAGE_SIZE = 30;

interface ChatContextType {
  messages: Message[];
  hasMoreMessages: boolean;
  isLoadingOlder: boolean;
  isInitialLoading: boolean;
  loadOlderMessages: () => Promise<boolean>;
  partner: PartnerProfile;
  user: UserProfile;
  isPartnerTyping: boolean;
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
  sendQuickInteraction: (type: 'nudge' | 'pulse' | 'music' | 'weather', data?: Record<string, string>) => void;
  startCall: (type: 'audio' | 'video') => void;
  endCall: () => void;
  triggerPartnerResponse: (triggerText?: string) => void;
  activeViewOnceMedia: { messageId: string; url: string } | null;
  setActiveViewOnceMedia: (media: { messageId: string; url: string } | null) => void;
  broadcastTyping: (isTyping: boolean) => void;
  uploadMediaFile: (file: File | Blob, bucket?: 'chat-media' | 'voice-messages') => Promise<string | null>;
  markChatAsSeen: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, connection, partner: authPartner, updatePartnerStatus } = useAuth();

  // Supabase is the single source of truth.
  // We do not cache or restore messages from localStorage to avoid stale deleted ghost messages.
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);

  // Unread count is reactively calculated from unseen incoming partner messages
  const unreadCount = useMemo(() => {
    return messages.filter((m) => m.sender === 'partner' && m.status !== 'seen').length;
  }, [messages]);

  const [callState, setCallState] = useState<{ isInCall: boolean; type: 'audio' | 'video' | null }>({
    isInCall: false,
    type: null,
  });

  const [activeViewOnceMedia, setActiveViewOnceMedia] = useState<{ messageId: string; url: string } | null>(null);

  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const messageChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for tracking active state during async operations
  const activeConversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<Message[]>(messages);
  messagesRef.current = messages;

  const hasMoreRef = useRef<boolean>(hasMoreMessages);
  hasMoreRef.current = hasMoreMessages;

  const isLoadingOlderRef = useRef<boolean>(isLoadingOlder);
  isLoadingOlderRef.current = isLoadingOlder;

  // Clean up legacy localStorage key once on mount
  useEffect(() => {
    try {
      localStorage.removeItem('miu_messages');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Convert Database Message to UI Message model
  const dbMessageToUI = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any): Message => {
      const isSender = authUser ? m.sender_id === authUser.id : m.sender_id === 'user';
      const isoCreated = m.created_at || new Date().toISOString();
      const createdDate = new Date(isoCreated);
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
        createdAt: isoCreated,
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

  // Load Initial Messages and Setup Realtime for the Active Conversation
  useEffect(() => {
    if (!isSupabaseConfigured || !connection?.conversation_id || !authUser) {
      setMessages([]);
      setIsInitialLoading(false);
      setHasMoreMessages(false);
      return;
    }

    const conversationId = connection.conversation_id;
    activeConversationIdRef.current = conversationId;

    // Immediately reset state for conversation switching so old messages never bleed through
    setMessages([]);
    setIsInitialLoading(true);
    setHasMoreMessages(true);

    // 1. Fetch initial message history (latest 30 messages)
    const loadInitialConversation = async () => {
      try {
        const { data: dbMessages, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        // Guard against race conditions if conversation switched while request was in-flight
        if (activeConversationIdRef.current !== conversationId) return;

        if (error) {
          console.error('Error loading messages from Supabase:', error);
          setMessages([]);
          setIsInitialLoading(false);
          setHasMoreMessages(false);
          return;
        }

        // Supabase is single source of truth: if database has 0 rows, UI has 0 messages
        if (!dbMessages || dbMessages.length === 0) {
          setMessages([]);
          setHasMoreMessages(false);
          setIsInitialLoading(false);
          return;
        }

        // Reverse latest 30 to chronological ascending order (oldest -> newest)
        const chronological = dbMessages.slice().reverse();

        // Build reply map for quick lookup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msgMap = new Map<string, any>();
        chronological.forEach((m) => msgMap.set(m.id, m));

        const uiMsgs = chronological.map((m) => {
          const ui = dbMessageToUI(m);
          if (m.reply_to_id && msgMap.has(m.reply_to_id)) {
            const orig = msgMap.get(m.reply_to_id);
            const origIsSender = authUser ? orig.sender_id === authUser.id : orig.sender_id === 'user';
            let origText = orig.content || '';
            if (orig.message_type === 'voice') origText = `🎤 Voice note (${orig.duration || 0}s)`;
            else if (orig.message_type === 'image') origText = '📷 Photo';
            else if (orig.message_type === 'video') origText = '🎥 Video';
            else if (orig.message_type === 'view_once') origText = '👁️ View once photo';

            ui.replyTo = {
              id: orig.id,
              sender: origIsSender ? 'user' : 'partner',
              text: origText || 'Original message',
              mediaUrl: orig.media_path,
              type: orig.message_type,
            };
          }
          return ui;
        });

        setMessages(uiMsgs);
        setHasMoreMessages(dbMessages.length === PAGE_SIZE);
        setIsInitialLoading(false);
      } catch (err) {
        console.error('Unexpected error loading conversation:', err);
        if (activeConversationIdRef.current === conversationId) {
          setMessages([]);
          setIsInitialLoading(false);
          setHasMoreMessages(false);
        }
      }
    };

    loadInitialConversation();

    // 2. Setup Postgres Changes Realtime Subscription for incremental updates
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
          if (activeConversationIdRef.current !== conversationId) return;

          if (payload.eventType === 'INSERT') {
            const incoming = dbMessageToUI(payload.new);
            setMessages((prev) => {
              // Deduplicate by message ID
              const existingIdx = prev.findIndex((x) => x.id === incoming.id);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = incoming;
                return next;
              }

              // Resolve reply if available in existing messages
              if (payload.new.reply_to_id) {
                const orig = prev.find((m) => m.id === payload.new.reply_to_id);
                if (orig) {
                  incoming.replyTo = {
                    id: orig.id,
                    sender: orig.sender,
                    text: orig.content || (orig.type === 'voice' ? 'Voice note' : 'Photo'),
                    mediaUrl: orig.mediaUrl,
                    type: orig.type,
                  };
                }
              }
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

    messageChannelRef.current = messageChannel;

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

    // 3. Setup Broadcast & Presence Channel
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
  }, [connection?.conversation_id, authUser, dbMessageToUI, updatePartnerStatus]);

  // Cursor-based Pagination: Fetch 30 older messages when scrolling to top
  const loadOlderMessages = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured || !connection?.conversation_id || !authUser) return false;
    if (isLoadingOlderRef.current || !hasMoreRef.current) return false;

    const conversationId = connection.conversation_id;
    const currentMsgs = messagesRef.current;

    // Find the earliest createdAt in the currently loaded list
    const oldestMsg = currentMsgs.find((m) => !!m.createdAt);
    if (!oldestMsg?.createdAt) {
      setHasMoreMessages(false);
      return false;
    }

    isLoadingOlderRef.current = true;
    setIsLoadingOlder(true);

    try {
      const { data: olderDbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('created_at', oldestMsg.createdAt)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      // Check if conversation switched while fetching
      if (activeConversationIdRef.current !== conversationId) {
        return false;
      }

      if (error) {
        console.error('Error fetching older messages from Supabase:', error);
        return false;
      }

      if (!olderDbMessages || olderDbMessages.length === 0) {
        setHasMoreMessages(false);
        return false;
      }

      if (olderDbMessages.length < PAGE_SIZE) {
        setHasMoreMessages(false);
      }

      // Reverse older messages so they are chronological
      const chronologicalOlder = olderDbMessages.slice().reverse();
      const olderUiMsgs = chronologicalOlder.map((m) => dbMessageToUI(m));

      // Resolve replies
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allMsgsMap = new Map<string, any>();
      [...olderDbMessages, ...messagesRef.current].forEach((m) => allMsgsMap.set(m.id, m));
      olderUiMsgs.forEach((ui) => {
        if (ui.replyTo?.id && allMsgsMap.has(ui.replyTo.id)) {
          const orig = allMsgsMap.get(ui.replyTo.id);
          ui.replyTo.text = orig.content || (orig.message_type === 'voice' ? 'Voice note' : 'Photo');
          ui.replyTo.mediaUrl = orig.media_path || orig.mediaUrl;
        }
      });

      // Deduplicate and prepend to current message list
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueOlder = olderUiMsgs.filter((m) => !existingIds.has(m.id));
        if (uniqueOlder.length === 0) return prev;
        return [...uniqueOlder, ...prev];
      });

      return true;
    } catch (err) {
      console.error('Failed to load older messages:', err);
      return false;
    } finally {
      isLoadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [connection?.conversation_id, authUser, dbMessageToUI]);

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
    bucket: 'chat-media' | 'voice-messages' = 'chat-media'
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
    const nowIso = new Date().toISOString();
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
      createdAt: nowIso,
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
          // Replace tempId with server authoritative message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...dbMessageToUI(inserted), status: 'sent', replyTo } : m
            )
          );
          return;
        }
      } catch (err) {
        console.error('Failed to insert message to Supabase:', err);
      }
    }

    // Local fallback transition
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sent' } : m))
      );
    }, 300);
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

  // DELETE FOR ME (Synchronize immediately in UI)
  const deleteMessage = async (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  // DELETE FOR EVERYONE (Synchronize immediately in UI & Supabase)
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
    try {
      localStorage.removeItem('miu_messages');
    } catch {
      // Ignore
    }
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
        createdAt: new Date().toISOString(),
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
        hasMoreMessages,
        isLoadingOlder,
        isInitialLoading,
        loadOlderMessages,
        partner: authPartner || initialPartnerProfile,
        user: activeUserProfile,
        isPartnerTyping,
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
        sendQuickInteraction,
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
