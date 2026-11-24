import { PartnerProfile, UserProfile, Message } from '../types';

export const initialPartnerProfile: PartnerProfile = {
  id: '',
  name: 'Partner',
  handle: '@partner',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  status: 'offline',
  lastActive: 'Not connected yet',
  bio: 'Private by design.',
  relationshipDate: 'Awaiting connection',
  timezone: '',
};

export const initialUserProfile: UserProfile = {
  name: 'You',
  handle: '@you',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
  bio: 'Private by design.',
};

export const initialMessages: Message[] = [];
