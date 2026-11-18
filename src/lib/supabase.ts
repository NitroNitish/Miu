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
 * Uses standard domain format to satisfy GoTrue syntax validation.
 */
export const usernameToSyntheticEmail = (username: string): string => {
  const normalized = normalizeUsername(username);
  return `${normalized}.miu@gmail.com`;
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

/**
 * Safely extracts an invitation token or short code from a full URL, path, or raw input string
 */
export const extractInvitationSecret = (raw: string): string => {
  if (!raw) return '';
  let str = raw.trim();

  // If input contains URL patterns or query parameters
  if (str.includes('/') || str.includes('?') || str.includes('=')) {
    try {
      const parsed = str.startsWith('http') ? new URL(str) : new URL(str, 'https://miu.local');
      const param =
        parsed.searchParams.get('token') ||
        parsed.searchParams.get('code') ||
        parsed.searchParams.get('join');
      if (param) {
        str = param.trim();
      } else {
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          const last = segments[segments.length - 1];
          if (last !== 'join' && last !== 'invite') {
            str = last.trim();
          }
        }
      }
    } catch {
      // ignore parse errors and proceed to fallback
    }
  }

  // Strip query strings or trailing slashes
  str = str.replace(/[?#].*$/, '').replace(/\/+$/, '');
  const lastPart = str.split('/').pop() || str;
  return lastPart.trim();
};

/**
 * Resolves the raw token or short code to the expected lookup string for Supabase RPCs:
 * - 48-char raw token -> computes 64-char SHA-256 hash
 * - 64-char SHA-256 hash -> lowercased hash
 * - Short code (e.g. 6 chars) -> uppercased short code
 */
export const resolveLookupSecret = async (rawSecret: string): Promise<string> => {
  const secret = extractInvitationSecret(rawSecret);
  if (!secret) return '';

  // If already a 64-character SHA-256 hex string, pass as-is
  if (secret.length === 64 && /^[0-9a-fA-F]{64}$/.test(secret)) {
    return secret.toLowerCase();
  }

  // If raw token (> 20 chars), hash it
  if (secret.length > 20) {
    return await hashToken(secret);
  }

  // Otherwise it's a short code
  return secret.toUpperCase();
};
