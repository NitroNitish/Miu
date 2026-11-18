import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

// Fallback placeholder URL to prevent initialization throw if credentials not set yet
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 20,
      },
    },
  }
);

/**
 * Username normalization:
 * Lowercases and strips invalid characters
 */
export const normalizeUsername = (username: string): string => {
  return username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
};

/**
 * Deterministic synthetic email mapping for username-only login in Supabase GoTrue
 * Never shown to users, never receives emails.
 */
export const usernameToSyntheticEmail = (username: string): string => {
  const normalized = normalizeUsername(username);
  return `user_${normalized}@internal.miu.app`;
};

/**
 * Computes SHA-256 hash of an invitation token using Web Crypto API
 */
export const hashToken = async (token: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Generates a cryptographically random invitation token and human-readable short code
 */
export const generateInvitationSecret = async (): Promise<{
  token: string;
  shortCode: string;
  tokenHash: string;
}> => {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const token = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Short code (6 alphanumeric uppercase chars)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let shortCode = '';
  const codeBytes = new Uint8Array(6);
  crypto.getRandomValues(codeBytes);
  for (let i = 0; i < 6; i++) {
    shortCode += chars[codeBytes[i] % chars.length];
  }

  const tokenHash = await hashToken(token);

  return {
    token,
    shortCode,
    tokenHash,
  };
};
