-- ==============================================================================
-- MIU: PRIVATE INVITATION & ATOMIC PAIRING RPCs
-- ==============================================================================
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- Enables single-use cryptographic invitation tokens, short codes, and atomic pairing
-- ==============================================================================

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
  v_connection_id UUID;
  v_conversation_id UUID;
  v_existing_active UUID;
  v_secret TEXT := trim(p_token_hash);
BEGIN
  IF v_recipient_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be logged in to accept an invitation.');
  END IF;

  -- Ensure recipient profile exists
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

  -- Lock invitation row to prevent race conditions
  SELECT * INTO v_invite
  FROM public.invitations
  WHERE token_hash = v_secret
     OR upper(short_code) = upper(v_secret)
  ORDER BY created_at DESC
  FOR UPDATE;

  IF v_invite IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found. Please check your link or code.');
  END IF;

  IF v_invite.creator_id = v_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot accept your own invitation.');
  END IF;

  IF v_invite.status <> 'pending' OR v_invite.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation is no longer valid or has expired.');
  END IF;

  -- Ensure recipient is not already in an active connection
  SELECT id INTO v_existing_active
  FROM public.connections
  WHERE (user_one_id = v_recipient_id OR user_two_id = v_recipient_id)
    AND status = 'accepted'
  LIMIT 1;

  IF v_existing_active IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already have an active connection with another user.');
  END IF;

  -- Ensure creator is still free
  SELECT id INTO v_existing_active
  FROM public.connections
  WHERE (user_one_id = v_invite.creator_id OR user_two_id = v_invite.creator_id)
    AND status = 'accepted'
  LIMIT 1;

  IF v_existing_active IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'The inviter is already connected with someone else.');
  END IF;

  -- Ensure creator profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_invite.creator_id) THEN
    INSERT INTO public.profiles (id, username, normalized_username, display_name)
    SELECT 
      v_invite.creator_id,
      COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
      lower(COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))),
      COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
    FROM auth.users
    WHERE id = v_invite.creator_id;
  END IF;

  -- Mark invitation accepted
  UPDATE public.invitations
  SET status = 'accepted',
      accepted_by = v_recipient_id,
      accepted_at = now()
  WHERE id = v_invite.id;

  -- Create connection
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

-- 4. DISCONNECT CONNECTION
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
GRANT EXECUTE ON FUNCTION public.create_invitation(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_connection(UUID) TO authenticated;
