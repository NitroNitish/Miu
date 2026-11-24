export type ThemeMode = 'light' | 'dark' | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen';

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'view_once' | 'interaction';

export interface Reaction {
  emoji: string;
  sender: 'user' | 'partner';
  count: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'partner';
  type: MessageType;
  content: string; // text or caption or audio url
  mediaUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video in seconds
  timestamp: string; // e.g. "9:41 AM"
  date: string; // e.g. "2026-11-18"
  createdAt?: string; // ISO 8601 timestamp from database for sorting and cursor pagination
  status: MessageStatus;
  replyTo?: {
    id: string;
    sender: 'user' | 'partner';
    text: string;
    mediaUrl?: string;
    type?: MessageType;
  };
  reactions?: { [emoji: string]: number };
  isViewOnce?: boolean;
  isViewed?: boolean;
  isDeletedForEveryone?: boolean;
  isEdited?: boolean;
  interactionType?: 'nudge' | 'pulse' | 'music' | 'weather' | 'ai';
  interactionData?: Record<string, string>;
}

export interface PartnerProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  status: 'online' | 'offline';
  lastActive: string;
  bio: string;
  relationshipDate: string;
  timezone: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  phone?: string;
}

export interface MediaItem {
  id: string;
  url: string;
  type?: string;
  caption?: string;
  date?: string;
  sender?: 'user' | 'partner';
}

export interface Profile {
  id: string;
  username: string;
  normalized_username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
  last_active_at?: string;
}

export interface Connection {
  id: string;
  user_one_id: string;
  user_two_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'disconnected';
  created_at: string;
  connected_at?: string;
  conversation_id?: string;
  partner?: Profile;
}

export interface Invitation {
  id: string;
  creator_id: string;
  short_code: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  creator?: Profile;
}
