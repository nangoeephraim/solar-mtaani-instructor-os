-- ========================================================
-- PRISM INSTRUCTOR OS - CHAT ATTACHMENTS UPDATE
-- ========================================================

-- Add attachments column to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
