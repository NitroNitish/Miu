-- ==============================================================================
-- MIU: DATABASE CLEANUP & OPTIMIZATION MIGRATION
-- Run this script in your Supabase SQL Editor:
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste -> Run
--
-- This script:
-- 1. Safely drops all unnecessary tables (memories, daily_answers, daily_questions, doodles)
-- 2. Removes unused policies, triggers, and publication bindings
-- 3. Keeps only the essential tables: profiles, connections, invitations, conversations, messages, message_receipts
-- 4. Verifies and optimizes RLS security and Realtime sync
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: Remove unused tables from realtime publication
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.doodles;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.daily_answers;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.memories;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.daily_questions;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

-- ------------------------------------------------------------------------------
-- STEP 2: Drop unused tables with CASCADE
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS public.doodles CASCADE;
DROP TABLE IF EXISTS public.daily_answers CASCADE;
DROP TABLE IF EXISTS public.daily_questions CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;

-- ------------------------------------------------------------------------------
-- STEP 3: Clean up message_type check constraint on messages table
-- ------------------------------------------------------------------------------
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'video', 'voice', 'view_once', 'interaction'));

-- ------------------------------------------------------------------------------
-- STEP 4: Ensure Realtime is enabled only for essential chat tables
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- STEP 5: Ensure performance indices exist for essential tables
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_normalized_username ON public.profiles(normalized_username);
CREATE INDEX IF NOT EXISTS idx_connections_users ON public.connections(user_one_id, user_two_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token_hash ON public.invitations(token_hash);
CREATE INDEX IF NOT EXISTS idx_invitations_short_code ON public.invitations(short_code);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_message_user ON public.message_receipts(message_id, user_id);

-- ------------------------------------------------------------------------------
-- STEP 6: Ensure RLS is active on all essential tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

SELECT 'MIU Database successfully cleaned! Only essential chat and auth tables remain.' AS status;
