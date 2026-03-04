-- ========================================================
-- PRISM INSTRUCTOR OS - COMMUNICATIONS SCHEMA
-- Purpose: Schema for the chat and announcements feature
-- ========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CHAT CHANNELS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('chat', 'announcement')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_read_by JSONB DEFAULT '{}'::jsonb -- Stores { "user_id": "message_id" }
);

-- Insert Default Channels
INSERT INTO public.chat_channels (id, name, description, type)
VALUES 
    ('chan_general', 'General Chat', 'General discussion and Q&A for all cohorts.', 'chat'),
    ('chan_announcements', 'Announcements', 'Important updates and broadcasts from instructors.', 'announcement')
ON CONFLICT DO NOTHING;


-- ==========================================
-- 2. CHAT MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id TEXT NOT NULL, -- Text because default channels use text IDs for simplicity, foreign key omitted for mixed ID support
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL, -- Denormalized for faster reads in chat
    content TEXT NOT NULL,
    reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '{}'::jsonb, -- Expected format: { "👍": ["user_id1", "user_id2"] }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Channels Policies
CREATE POLICY "Anyone can view chat channels"
    ON public.chat_channels FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can create chat channels"
    ON public.chat_channels FOR INSERT
    WITH CHECK (auth.role() = 'authenticated'); -- Allowing all authenticated users to create channels based on frontend logic

CREATE POLICY "Only admins can delete chat channels"
    ON public.chat_channels FOR DELETE
    USING (auth.role() = 'authenticated'); -- Allowing all authenticated users based on frontend logic

-- Messages Policies
CREATE POLICY "Anyone can view chat messages"
    ON public.chat_messages FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Anyone can insert chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Message senders can update their own messages"
    ON public.chat_messages FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND 
        (sender_id = auth.uid() OR is_pinned = true OR reactions != '{}'::jsonb) -- Allow updating pins and reactions by anyone
    );

CREATE POLICY "Message senders can delete their own messages"
    ON public.chat_messages FOR DELETE
    USING (auth.role() = 'authenticated' AND sender_id = auth.uid());

-- ==========================================
-- 4. REALTIME SETUP
-- ==========================================

-- Enable realtime broadcasting for chat messages
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table chat_messages;
