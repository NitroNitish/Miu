import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  normalizeUsername,
  usernameToSyntheticEmail,
  hashToken,
  generateInvitationSecret,
} from '../lib/supabase';
import { Profile, Connection, PartnerProfile } from '../types';
import { initialPartnerProfile, initialUserProfile } from '../data/mockData';

interface AuthContextType {
  user: Profile | null;
  connection: Connection | null;
  partner: PartnerProfile;
  isLoading: boolean;
  isConfigured: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    password: string,
    displayName: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  createInvitation: () => Promise<{
    success: boolean;
    token?: string;
    shortCode?: string;
    link?: string;
    error?: string;
  }>;
  validateInvitation: (
    token: string
  ) => Promise<{ valid: boolean; creatorName?: string; creatorUsername?: string; error?: string }>;
  acceptInvitation: (
    token: string
  ) => Promise<{ success: boolean; connectionId?: string; error?: string }>;
  disconnectConnection: () => Promise<{ success: boolean; error?: string }>;
  refreshConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('miu_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [connection, setConnection] = useState<Connection | null>(() => {
    const saved = localStorage.getItem('miu_connection');
    return saved ? JSON.parse(saved) : null;
  });

  const [partner, setPartner] = useState<PartnerProfile>(initialPartnerProfile);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to construct PartnerProfile from DB Profile
  const buildPartnerProfile = useCallback((dbPartner: Partial<Profile>): PartnerProfile => {
    return {
      id: dbPartner.id || 'partner-1',
      name: dbPartner.display_name || dbPartner.username || 'Partner',
      handle: dbPartner.username ? `@${dbPartner.username}` : '@partner',
      avatar:
        dbPartner.avatar_url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      status: 'online',
      lastActive: 'Active now',
      bio: dbPartner.bio || 'Private by design.',
      relationshipDate: 'Connected on Miu',
      timezone: 'GMT+2 (Vienna)',
    };
  }, []);

  // Fetch connection & partner for the given user ID
  const fetchConnection = useCallback(
    async (userId: string) => {
      if (!isSupabaseConfigured) {
        // Mock fallback connection
        const mockConn: Connection = {
          id: 'mock-conn-1',
          user_one_id: userId,
          user_two_id: 'partner-1',
          status: 'accepted',
          created_at: new Date().toISOString(),
          conversation_id: 'mock-conv-1',
        };
        setConnection(mockConn);
        setPartner(initialPartnerProfile);
        localStorage.setItem('miu_connection', JSON.stringify(mockConn));
        return;
      }

      try {
        const { data: connData, error: connError } = await supabase
          .from('connections')
          .select('*')
          .or(`user_one_id.eq.${userId},user_two_id.eq.${userId}`)
          .eq('status', 'accepted')
          .maybeSingle();

        if (connError || !connData) {
          setConnection(null);
          localStorage.removeItem('miu_connection');
          return;
        }

        const partnerId =
          connData.user_one_id === userId ? connData.user_two_id : connData.user_one_id;

        // Fetch partner profile & conversation id
        const [{ data: partnerData }, { data: convData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', partnerId).maybeSingle(),
          supabase.from('conversations').select('id').eq('connection_id', connData.id).maybeSingle(),
        ]);

        const fullConnection: Connection = {
          ...connData,
          conversation_id: convData?.id,
          partner: partnerData || undefined,
        };

        setConnection(fullConnection);
        localStorage.setItem('miu_connection', JSON.stringify(fullConnection));

        if (partnerData) {
          setPartner(buildPartnerProfile(partnerData));
        }
      } catch (err) {
        console.error('Error fetching connection:', err);
      }
    },
    [buildPartnerProfile]
  );

  // Initialize auth session on load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      if (!isSupabaseConfigured) {
        // In local demo mode, check if a demo user was stored or seed Alexander
        if (!user) {
          const defaultDemoUser: Profile = {
            id: 'user-demo-1',
            username: initialUserProfile.handle.replace('@', ''),
            normalized_username: initialUserProfile.handle.replace('@', '').toLowerCase(),
            display_name: initialUserProfile.name,
            avatar_url: initialUserProfile.avatar,
            bio: initialUserProfile.bio,
          };
          setUser(defaultDemoUser);
          localStorage.setItem('miu_auth_user', JSON.stringify(defaultDemoUser));
          fetchConnection(defaultDemoUser.id);
        } else {
          fetchConnection(user.id);
        }
        setIsLoading(false);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setUser(profile);
            localStorage.setItem('miu_auth_user', JSON.stringify(profile));
            await fetchConnection(profile.id);
          }
        }
      } catch (err) {
        console.error('Session init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth changes
    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profile) {
            setUser(profile);
            localStorage.setItem('miu_auth_user', JSON.stringify(profile));
            fetchConnection(profile.id);
          }
        } else {
          setUser(null);
          setConnection(null);
          localStorage.removeItem('miu_auth_user');
          localStorage.removeItem('miu_connection');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [fetchConnection]);

  // LOGIN (Username + Password)
  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    if (!isSupabaseConfigured) {
      // Local demo mode
      const demoUser: Profile = {
        id: `user-${normalizeUsername(cleanUsername)}`,
        username: cleanUsername,
        normalized_username: normalizeUsername(cleanUsername),
        display_name: cleanUsername,
        avatar_url: initialUserProfile.avatar,
        bio: 'Private by design.',
      };
      setUser(demoUser);
      localStorage.setItem('miu_auth_user', JSON.stringify(demoUser));
      fetchConnection(demoUser.id);
      return { success: true };
    }

    try {
      const syntheticEmail = usernameToSyntheticEmail(cleanUsername);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });

      if (error || !data.user) {
        return { success: false, error: error?.message || 'Incorrect username or password.' };
      }

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileErr || !profile) {
        return { success: false, error: 'Could not load profile for this account.' };
      }

      setUser(profile);
      localStorage.setItem('miu_auth_user', JSON.stringify(profile));
      await fetchConnection(profile.id);

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: msg };
    }
  };

  // REGISTER (Username, Password, Display Name)
  const register = async (
    username: string,
    password: string,
    displayName: string,
    avatarUrl?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim();
    const normalized = normalizeUsername(cleanUsername);

    if (normalized.length < 3 || normalized.length > 20) {
      return { success: false, error: 'Username must be between 3 and 20 characters.' };
    }
    if (!/^[a-z0-9_]+$/.test(normalized)) {
      return { success: false, error: 'Usernames can only contain letters, numbers, and underscores.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (!isSupabaseConfigured) {
      // Local demo registration
      const demoUser: Profile = {
        id: `user-${normalized}`,
        username: cleanUsername,
        normalized_username: normalized,
        display_name: displayName.trim() || cleanUsername,
        avatar_url: avatarUrl || initialUserProfile.avatar,
        bio: 'Private by design.',
      };
      setUser(demoUser);
      localStorage.setItem('miu_auth_user', JSON.stringify(demoUser));
      fetchConnection(demoUser.id);
      return { success: true };
    }

    try {
      // 1. Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('normalized_username', normalized)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'This username is already taken. Please choose another.' };
      }

      // 2. Sign up with deterministic synthetic email identity
      const syntheticEmail = usernameToSyntheticEmail(cleanUsername);
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: syntheticEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            display_name: displayName.trim() || cleanUsername,
          },
        },
      });

      if (authErr || !authData.user) {
        return { success: false, error: authErr?.message || 'Registration failed.' };
      }

      // 3. Insert profile record
      const newProfile: Profile = {
        id: authData.user.id,
        username: cleanUsername,
        normalized_username: normalized,
        display_name: displayName.trim() || cleanUsername,
        avatar_url: avatarUrl || undefined,
        bio: 'Private by design.',
      };

      const { error: insertErr } = await supabase.from('profiles').insert([newProfile]);
      if (insertErr) {
        console.error('Profile insertion error:', insertErr);
      }

      setUser(newProfile);
      localStorage.setItem('miu_auth_user', JSON.stringify(newProfile));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: msg };
    }
  };

  // LOGOUT
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setConnection(null);
    localStorage.removeItem('miu_auth_user');
    localStorage.removeItem('miu_connection');
    // Clear temporary local chat cache
    localStorage.removeItem('miu_messages');
  };

  // CREATE INVITATION
  const createInvitation = async () => {
    if (!user) {
      return { success: false, error: 'You must be logged in to create an invitation.' };
    }

    if (!isSupabaseConfigured) {
      // Mock invitation generator
      const mockToken = `demo_token_${Date.now()}`;
      const mockCode = 'MIU999';
      return {
        success: true,
        token: mockToken,
        shortCode: mockCode,
        link: `${window.location.origin}/join/${mockToken}`,
      };
    }

    try {
      const { token, shortCode, tokenHash } = await generateInvitationSecret();

      const { data, error } = await supabase.rpc('create_invitation', {
        p_token_hash: tokenHash,
        p_short_code: shortCode,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        token,
        shortCode,
        link: `${window.location.origin}/join/${token}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not generate invitation';
      return { success: false, error: msg };
    }
  };

  // VALIDATE INVITATION
  const validateInvitation = async (token: string) => {
    if (!token) return { valid: false, error: 'No invitation token provided.' };

    if (!isSupabaseConfigured) {
      return {
        valid: true,
        creatorName: 'Alexander',
        creatorUsername: 'alexander',
      };
    }

    try {
      const tokenHash = await hashToken(token);
      const { data, error } = await supabase.rpc('validate_invitation', {
        p_token_hash: tokenHash,
      });

      if (error || !data || !data.valid) {
        return { valid: false, error: data?.error || error?.message || 'Invalid or expired invitation.' };
      }

      return {
        valid: true,
        creatorName: data.creator_name,
        creatorUsername: data.creator_username,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      return { valid: false, error: msg };
    }
  };

  // ACCEPT INVITATION (Atomic Pairing)
  const acceptInvitation = async (token: string) => {
    if (!user) {
      return { success: false, error: 'You must create an account first to accept an invitation.' };
    }

    if (!isSupabaseConfigured) {
      const mockConn: Connection = {
        id: 'conn-demo-new',
        user_one_id: 'partner-1',
        user_two_id: user.id,
        status: 'accepted',
        created_at: new Date().toISOString(),
        conversation_id: 'conv-demo-new',
      };
      setConnection(mockConn);
      localStorage.setItem('miu_connection', JSON.stringify(mockConn));
      return { success: true, connectionId: mockConn.id };
    }

    try {
      const tokenHash = await hashToken(token);
      const { data, error } = await supabase.rpc('accept_invitation', {
        p_token_hash: tokenHash,
      });

      if (error || !data || !data.success) {
        return { success: false, error: data?.error || error?.message || 'Failed to accept invitation.' };
      }

      await fetchConnection(user.id);
      return { success: true, connectionId: data.connection_id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Acceptance failed';
      return { success: false, error: msg };
    }
  };

  // DISCONNECT CONNECTION
  const disconnectConnection = async () => {
    if (!connection) {
      return { success: false, error: 'No active connection to disconnect.' };
    }

    if (!isSupabaseConfigured) {
      setConnection(null);
      localStorage.removeItem('miu_connection');
      return { success: true };
    }

    try {
      const { error } = await supabase.rpc('disconnect_connection', {
        p_connection_id: connection.id,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setConnection(null);
      localStorage.removeItem('miu_connection');
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Disconnection failed';
      return { success: false, error: msg };
    }
  };

  const refreshConnection = async () => {
    if (user) {
      await fetchConnection(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        connection,
        partner,
        isLoading,
        isConfigured: isSupabaseConfigured,
        login,
        register,
        logout,
        createInvitation,
        validateInvitation,
        acceptInvitation,
        disconnectConnection,
        refreshConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
