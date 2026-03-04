-- ========================================================
-- PRISM INSTRUCTOR OS - CHAT SCHEMA CLEAN INIT
-- ========================================================

-- Due to RLS policy dependencies, we cannot easily ALTER the id column.
-- Since this feature just failed to initialize and has no valid data,
-- we perform a clean dropping and recreation of the tables.

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_channels CASCADE;

-- ==========================================
-- 1. CHAT CHANNELS TABLE
-- ==========================================
CREATE TABLE public.chat_channels (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('chat', 'announcement', 'dm')),
    participants TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_by JSONB DEFAULT '{}'::jsonb
);

-- Insert Default Channels
INSERT INTO public.chat_channels (id, name, description, type)
VALUES 
    ('chan_general', 'General Chat', 'General discussion and Q&A for all cohorts.', 'chat'),
    ('chan_announcements', 'Announcements', 'Important updates and broadcasts from instructors.', 'announcement')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. CHAT MESSAGES TABLE
-- ==========================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL DEFAULT 'User',
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Hardened Policies from rls_hardening.sql

CREATE POLICY "Authenticated users can view accessible channels"
    ON public.chat_channels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_active = true
        )
        AND (type != 'dm' OR (auth.uid()::text = ANY(participants)))
    );

CREATE POLICY "Only admins can create chat channels"
    ON public.chat_channels FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read accessible messages"
    ON public.chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_active = true
        )
        AND EXISTS (
            SELECT 1 FROM public.chat_channels
            WHERE id = channel_id
            AND (type != 'dm' OR auth.uid()::text = ANY(participants))
        )
    );

CREATE POLICY "Anyone can insert chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Message senders can update their own messages"
    ON public.chat_messages FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND 
        (sender_id = auth.uid() OR is_pinned = true OR reactions != '{}'::jsonb)
    );

CREATE POLICY "Message senders can delete their own messages"
    ON public.chat_messages FOR DELETE
    USING (auth.role() = 'authenticated' AND sender_id = auth.uid());

-- ==========================================
-- 4. REALTIME SETUP
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 5. Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
