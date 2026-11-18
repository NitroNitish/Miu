export type ThemeMode = 'light' | 'dark' | 'system';

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export type MessageType = 'text' | 'image' | 'video' | 'voice' | 'doodle' | 'view_once' | 'interaction';

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
  status: MessageStatus;
  replyTo?: {
    id: string;
    sender: 'user' | 'partner';
    text: string;
  };
  reactions?: { [emoji: string]: number };
  isViewOnce?: boolean;
  isViewed?: boolean;
  isDeletedForEveryone?: boolean;
  isEdited?: boolean;
  interactionType?: 'nudge' | 'pulse' | 'music' | 'weather';
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
  phone: string;
}

export interface MemoryItem {
  id: string;
  type: 'photo' | 'video' | 'doodle';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  date: string;
  sender: 'user' | 'partner';
  isStarred?: boolean;
  duration?: string;
}

export interface DailyQuestion {
  id: string;
  date: string;
  question: string;
  category: string;
  userAnswer?: string;
  partnerAnswer?: string;
  answeredAt?: string;
  isRevealed: boolean;
}
