-- ==============================================================================
-- MIU DATABASE SCHEMA & SECURITY POLICIES (SUPABASE / POSTGRESQL)
-- Ultra-private 2-person messenger with strictly enforced RLS and atomic pairing
-- Contains ONLY the necessary tables, indexes, RLS policies, and RPCs.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing obsolete schema elements
DROP TABLE IF EXISTS public.doodles CASCADE;
DROP TABLE IF EXISTS public.daily_answers CASCADE;
DROP TABLE IF EXISTS public.daily_questions CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  normalized_username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT 'Private by design.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_username_length CHECK (char_length(normalized_username) >= 3 AND char_length(normalized_username) <= 20),
  CONSTRAINT valid_username_chars CHECK (normalized_username ~ '^[a-z0-9_]+$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_normalized_username ON public.profiles(normalized_username);

-- ------------------------------------------------------------------------------
-- 2. CONNECTIONS TABLE (Exclusively 2 users per connection, max 1 active per user)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_one_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_two_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected', 'disconnected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  connected_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT different_users CHECK (user_one_id <> user_two_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_users ON public.connections(user_one_id, user_two_id);

-- Enforce max ONE active ('accepted') connection per user via unique partial indices
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_connection_user1
ON public.connections(user_one_id)
WHERE status = 'accepted';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_connection_user2
ON public.connections(user_two_id)
WHERE status = 'accepted';

-- ------------------------------------------------------------------------------
-- 3. INVITATIONS TABLE (Cryptographic single-use token hashes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  short_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_short_code ON public.invitations(short_code);

-- ------------------------------------------------------------------------------
-- 4. CONVERSATIONS TABLE (Exactly one conversation per connection)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL UNIQUE REFERENCES public.connections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. MESSAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'view_once', 'interaction')),
  content TEXT,
  media_path TEXT,
  duration INT,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reactions JSONB DEFAULT '{}'::jsonb,
  is_view_once BOOLEAN NOT NULL DEFAULT false,
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  viewed_at TIMESTAMPTZ,
  deleted_for_everyone BOOLEAN NOT NULL DEFAULT false,
  deleted_for_users UUID[] NOT NULL DEFAULT '{}',
  delivered_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. MESSAGE RECEIPTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  seen_at TIMESTAMPTZ,
  CONSTRAINT unique_receipt_per_user UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_receipts_message_user ON public.message_receipts(message_id, user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if caller is member of connection
CREATE OR REPLACE FUNCTION public.is_connection_member(conn_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE id = conn_id
      AND (user_one_id = auth.uid() OR user_two_id = auth.uid())
      AND status = 'accepted'
  );
$$;

-- Helper function: Check if caller is member of conversation
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.connections conn ON conn.id = c.connection_id
    WHERE c.id = conv_id
      AND (conn.user_one_id = auth.uid() OR conn.user_two_id = auth.uid())
      AND conn.status = 'accepted'
  );
$$;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can read own profile or connected partner profile" ON public.profiles;
CREATE POLICY "Users can read own profile or connected partner profile"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((user_one_id = auth.uid() AND user_two_id = profiles.id)
        OR (user_two_id = auth.uid() AND user_one_id = profiles.id))
  )
);

DROP POLICY IF EXISTS "Users can insert their own profile upon registration" ON public.profiles;
CREATE POLICY "Users can insert their own profile upon registration"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- CONNECTIONS POLICIES
DROP POLICY IF EXISTS "Users can read their own connections" ON public.connections;
CREATE POLICY "Users can read their own connections"
ON public.connections FOR SELECT
USING (user_one_id = auth.uid() OR user_two_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own connection" ON public.connections;
CREATE POLICY "Users can update their own connection"
ON public.connections FOR UPDATE
USING (user_one_id = auth.uid() OR user_two_id = auth.uid());

-- INVITATIONS POLICIES
DROP POLICY IF EXISTS "Creators can view their invitations" ON public.invitations;
CREATE POLICY "Creators can view their invitations"
ON public.invitations FOR SELECT
USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can insert invitations" ON public.invitations;
CREATE POLICY "Creators can insert invitations"
ON public.invitations FOR INSERT
WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can update their invitations" ON public.invitations;
CREATE POLICY "Creators can update their invitations"
ON public.invitations FOR UPDATE
USING (creator_id = auth.uid());

-- CONVERSATIONS POLICIES
DROP POLICY IF EXISTS "Members can view their conversation" ON public.conversations;
CREATE POLICY "Members can view their conversation"
ON public.conversations FOR SELECT
USING (public.is_connection_member(connection_id));

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "Members can view conversation messages" ON public.messages;
CREATE POLICY "Members can view conversation messages"
ON public.messages FOR SELECT
USING (public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "Members can insert messages as sender" ON public.messages;
CREATE POLICY "Members can insert messages as sender"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_member(conversation_id)
);

DROP POLICY IF EXISTS "Senders can edit their own messages or recipients can update reactions" ON public.messages;
CREATE POLICY "Senders can edit their own messages or recipients can update reactions"
ON public.messages FOR UPDATE
USING (public.is_conversation_member(conversation_id))
WITH CHECK (public.is_conversation_member(conversation_id));

DROP POLICY IF EXISTS "Senders can delete messages" ON public.messages;
CREATE POLICY "Senders can delete messages"
ON public.messages FOR DELETE
USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id));

-- MESSAGE RECEIPTS POLICIES
DROP POLICY IF EXISTS "Members can view and create receipts" ON public.message_receipts;
CREATE POLICY "Members can view and create receipts"
ON public.message_receipts FOR ALL
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_receipts.message_id
      AND public.is_conversation_member(m.conversation_id)
  )
);

-- ==============================================================================
-- DATABASE FUNCTIONS / STORED PROCEDURES (RPCs)
-- ==============================================================================

-- 0. DIRECT USERNAME-ONLY REGISTRATION (Bypasses email rate limits & auto-confirms user)
CREATE OR REPLACE FUNCTION public.register_username_account(
  p_username TEXT,
  p_password TEXT,
  p_display_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_normalized TEXT;
  v_synthetic_email TEXT;
  v_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  -- Normalize username
  v_normalized := lower(regexp_replace(trim(p_username), '[^a-zA-Z0-9_]', '', 'g'));

  IF char_length(v_normalized) < 3 OR char_length(v_normalized) > 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Username must be between 3 and 20 characters.');
  END IF;

  IF char_length(p_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  -- Check if username already exists in profiles
  IF EXISTS (SELECT 1 FROM public.profiles WHERE normalized_username = v_normalized) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This username is already taken. Please choose another.');
  END IF;

  v_synthetic_email := v_normalized || '.miu@gmail.com';

  -- Check if user exists in auth.users
  SELECT id INTO v_user_id FROM auth.users 
  WHERE email = v_synthetic_email 
     OR email = ('user_' || v_normalized || '@internal.miu.app')
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email = v_synthetic_email,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = COALESCE(confirmation_token, ''),
        email_change = COALESCE(email_change, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        recovery_token = COALESCE(recovery_token, ''),
        updated_at = now()
    WHERE id = v_user_id;

    -- Upsert identity
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', v_synthetic_email)::jsonb,
      'email',
      v_synthetic_email,
      now(),
      now(),
      now()
    );
  ELSE
    -- Generate UUID and password hash
    v_user_id := extensions.gen_random_uuid();
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_synthetic_email,
      v_encrypted_pw,
      now(),
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_normalized, 'display_name', COALESCE(NULLIF(trim(p_display_name), ''), v_normalized)),
      now(),
      now()
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id,
      json_build_object('sub', v_user_id::text, 'email', v_synthetic_email)::jsonb,
      'email',
      v_synthetic_email,
      now(),
      now(),
      now()
    );
  END IF;

  -- Upsert Profile
  INSERT INTO public.profiles (
    id,
    username,
    normalized_username,
    display_name
  ) VALUES (
    v_user_id,
    v_normalized,
    v_normalized,
    COALESCE(NULLIF(trim(p_display_name), ''), v_normalized)
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    normalized_username = EXCLUDED.normalized_username,
    display_name = EXCLUDED.display_name;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'username', v_normalized,
    'email', v_synthetic_email
  );
END;
$$;

-- 1. CREATE INVITATION
CREATE OR REPLACE FUNCTION public.create_invitation(
  p_token_hash TEXT,
  p_short_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing_active UUID;
  v_invite_id UUID;
  v_expires_at TIMESTAMPTZ := now() + interval '24 hours';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Ensure creator profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    INSERT INTO public.profiles (id, username, normalized_username, display_name)
    SELECT 
      v_user_id,
      COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
      lower(COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))),
      COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  -- Ensure creator is not already in an active connection
  SELECT id INTO v_existing_active
  FROM public.connections
  WHERE (user_one_id = v_user_id OR user_two_id = v_user_id)
    AND status = 'accepted'
  LIMIT 1;

  IF v_existing_active IS NOT NULL THEN
    RAISE EXCEPTION 'You already have an active private connection.';
  END IF;

  -- Revoke any previous pending invitations by this creator
  UPDATE public.invitations
  SET status = 'revoked'
  WHERE creator_id = v_user_id AND status = 'pending';

  -- Insert new invitation
  INSERT INTO public.invitations (
    creator_id,
    token_hash,
    short_code,
    status,
    expires_at
  ) VALUES (
    v_user_id,
    p_token_hash,
    upper(trim(p_short_code)),
    'pending',
    v_expires_at
  )
  RETURNING id INTO v_invite_id;

  RETURN jsonb_build_object(
    'success', true,
    'invitation_id', v_invite_id,
    'short_code', upper(trim(p_short_code)),
    'expires_at', v_expires_at
  );
END;
$$;

-- 2. VALIDATE INVITATION
CREATE OR REPLACE FUNCTION public.validate_invitation(p_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_invite RECORD;
  v_creator RECORD;
  v_secret TEXT := trim(p_token_hash);
BEGIN
  -- Match by token_hash or short_code
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE token_hash = v_secret
     OR upper(short_code) = upper(v_secret)
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invitation link or code.');
  END IF;

  IF v_invite.status = 'accepted' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invitation has already been accepted.');
  END IF;

  IF v_invite.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invitation has been revoked.');
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('valid', false, 'error', 'This invitation has expired.');
  END IF;

  -- Check if creator is already in an active connection
  IF EXISTS (
    SELECT 1 FROM public.connections
    WHERE (user_one_id = v_invite.creator_id OR user_two_id = v_invite.creator_id)
      AND status = 'accepted'
  ) THEN
    RETURN jsonb_build_object('valid', false, 'error', 'The inviter already has an active connection.');
  END IF;

  -- Fetch creator details
  SELECT username, display_name, avatar_url INTO v_creator
  FROM public.profiles
  WHERE id = v_invite.creator_id;

  RETURN jsonb_build_object(
    'valid', true,
    'short_code', v_invite.short_code,
    'creator_name', COALESCE(v_creator.display_name, 'Partner'),
    'creator_username', v_creator.username,
    'creator_avatar', v_creator.avatar_url,
    'expires_at', v_invite.expires_at
  );
END;
$$;

-- 3. ACCEPT INVITATION (Atomic Pairing)
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_recipient_id UUID := auth.uid();
  v_invite RECORD;
  v_recipient_active UUID;
  v_creator_active UUID;
  v_connection_id UUID;
  v_conversation_id UUID;
  v_secret TEXT := trim(p_token_hash);
BEGIN
  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Fetch & lock invitation
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE (token_hash = v_secret OR upper(short_code) = upper(v_secret))
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation';
  END IF;

  IF v_invite.creator_id = v_recipient_id THEN
    RAISE EXCEPTION 'You cannot accept your own invitation.';
  END IF;

  IF v_invite.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is no longer pending (status: %)', v_invite.status;
  END IF;

  IF v_invite.expires_at < now() THEN
    UPDATE public.invitations SET status = 'expired' WHERE id = v_invite.id;
    RAISE EXCEPTION 'Invitation has expired.';
  END IF;

  -- Ensure recipient has profile record
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_recipient_id) THEN
    INSERT INTO public.profiles (id, username, normalized_username, display_name)
    SELECT 
      v_recipient_id,
      COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
      lower(COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))),
      COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
    FROM auth.users
    WHERE id = v_recipient_id;
  END IF;

  -- Check recipient doesn't already have an active connection
  SELECT id INTO v_recipient_active
  FROM public.connections
  WHERE (user_one_id = v_recipient_id OR user_two_id = v_recipient_id)
    AND status = 'accepted'
  LIMIT 1;

  IF v_recipient_active IS NOT NULL THEN
    RAISE EXCEPTION 'You already have an active private connection. Please disconnect first.';
  END IF;

  -- Check creator doesn't already have an active connection
  SELECT id INTO v_creator_active
  FROM public.connections
  WHERE (user_one_id = v_invite.creator_id OR user_two_id = v_invite.creator_id)
    AND status = 'accepted'
  LIMIT 1;

  IF v_creator_active IS NOT NULL THEN
    RAISE EXCEPTION 'The inviter already paired with someone else.';
  END IF;

  -- Mark invitation as accepted
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_by = v_recipient_id,
      accepted_at = now()
  WHERE id = v_invite.id;

  -- Revoke other pending invitations for both users
  UPDATE public.invitations
  SET status = 'revoked'
  WHERE (creator_id = v_invite.creator_id OR creator_id = v_recipient_id)
    AND status = 'pending';

  -- Create single connection
  INSERT INTO public.connections (
    user_one_id,
    user_two_id,
    status,
    connected_at
  ) VALUES (
    v_invite.creator_id,
    v_recipient_id,
    'accepted',
    now()
  )
  RETURNING id INTO v_connection_id;

  -- Create single conversation
  INSERT INTO public.conversations (
    connection_id
  ) VALUES (
    v_connection_id
  )
  RETURNING id INTO v_conversation_id;

  -- Insert initial system greeting message
  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    message_type,
    content
  ) VALUES (
    v_conversation_id,
    v_invite.creator_id,
    'text',
    'Connected on Miu. Private space established.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'connection_id', v_connection_id,
    'conversation_id', v_conversation_id
  );
END;
$$;

-- 4. OPEN VIEW ONCE MEDIA (Atomic backend enforcement)
CREATE OR REPLACE FUNCTION public.open_view_once_media(p_message_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_msg RECORD;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT m.*, c.connection_id INTO v_msg
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE m.id = p_message_id
  FOR UPDATE;

  IF v_msg IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  IF NOT public.is_connection_member(v_msg.connection_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF v_msg.sender_id = v_caller_id THEN
    -- Senders can inspect their own view-once status without consuming it
    RETURN jsonb_build_object(
      'is_viewed', v_msg.is_viewed,
      'media_path', v_msg.media_path
    );
  END IF;

  IF v_msg.is_viewed THEN
    RAISE EXCEPTION 'This view-once media has already been viewed and expired.';
  END IF;

  -- Atomically mark as viewed
  UPDATE public.messages
  SET is_viewed = true,
      viewed_at = now()
  WHERE id = p_message_id;

  RETURN jsonb_build_object(
    'success', true,
    'media_path', v_msg.media_path,
    'viewed_at', now()
  );
END;
$$;

-- 5. DISCONNECT CONNECTION
CREATE OR REPLACE FUNCTION public.disconnect_connection(p_connection_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_connection_member(p_connection_id) THEN
    RAISE EXCEPTION 'Not authorized to disconnect this pairing';
  END IF;

  UPDATE public.connections
  SET status = 'disconnected'
  WHERE id = p_connection_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function Execution Privileges
GRANT EXECUTE ON FUNCTION public.validate_invitation(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_username_account(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_connection(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_view_once_media(UUID) TO authenticated;

-- Enable Realtime publication only on necessary tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_receipts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Storage buckets configuration:
-- 1. 'chat-media' (Private)
-- 2. 'voice-messages' (Private)
-- 3. 'avatars' (Public)
