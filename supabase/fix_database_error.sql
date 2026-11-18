-- ==============================================================================
-- MIU: DATABASE REPAIR & AUTHENTICATION FIX SCRIPT
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste -> Run
--
-- This script fixes:
-- 1. "Database error querying schema" (caused by NULL values in token columns)
-- 2. "Email rate limit exceeded" / "Email not confirmed"
-- 3. Missing auth.identities records required by GoTrue signInWithPassword
-- ==============================================================================

-- STEP 1: Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- STEP 2: Blanket-fix all existing auth.users rows:
-- Replace NULL token columns with empty strings '' (GoTrue crashes if these are NULL)
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  email = CASE 
    WHEN email LIKE '%@internal.miu.app' 
    THEN regexp_replace(email, '^user_([a-z0-9_]+)@internal\.miu\.app$', '\1.miu@gmail.com')
    ELSE email 
  END,
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
  updated_at = now()
WHERE 
  confirmation_token IS NULL 
  OR recovery_token IS NULL 
  OR email_change_token_new IS NULL 
  OR email_change IS NULL
  OR email_confirmed_at IS NULL
  OR email LIKE '%@internal.miu.app';

-- STEP 3: Ensure every user in auth.users has a matching row in auth.identities
-- (Supabase GoTrue requires an identity row to authenticate passwords)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  u.id::text,
  u.id,
  json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
  'email',
  u.email,
  now(),
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
);

-- STEP 4: Trigger to automatically confirm any user and sanitize tokens on insert/update
CREATE OR REPLACE FUNCTION public.handle_auto_confirm_user()
RETURNS trigger AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, now());
  NEW.confirmation_token := COALESCE(NEW.confirmation_token, '');
  NEW.recovery_token := COALESCE(NEW.recovery_token, '');
  NEW.email_change_token_new := COALESCE(NEW.email_change_token_new, '');
  NEW.email_change := COALESCE(NEW.email_change, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_user
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auto_confirm_user();

-- STEP 5: Bulletproof registration RPC for username-only accounts
CREATE OR REPLACE FUNCTION public.register_username_account(
  p_username TEXT,
  p_password TEXT,
  p_display_name TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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

  -- Check if user exists in auth.users (under current or legacy synthetic email)
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

    INSERT INTO public.profiles (id, username, normalized_username, display_name, bio)
    VALUES (v_user_id, p_username, v_normalized, COALESCE(NULLIF(trim(p_display_name), ''), p_username), 'Private by design.')
    ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        display_name = EXCLUDED.display_name;

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'username', p_username, 'email', v_synthetic_email);
  END IF;

  v_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf', 10));

  -- Insert directly into auth.users (auto-confirmed, zero emails sent, clean tokens)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    v_synthetic_email,
    v_encrypted_pw,
    now(),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('username', p_username, 'display_name', p_display_name),
    false
  );

  -- Insert into auth.identities (Required by GoTrue for signInWithPassword)
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

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    username,
    normalized_username,
    display_name,
    bio
  ) VALUES (
    v_user_id,
    p_username,
    v_normalized,
    COALESCE(NULLIF(trim(p_display_name), ''), p_username),
    'Private by design.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'username', p_username,
    'email', v_synthetic_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_username_account TO anon, authenticated;
