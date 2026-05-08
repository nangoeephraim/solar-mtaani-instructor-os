-- ========================================================
-- PRISM INSTRUCTOR OS - VIDEO MEETINGS SCHEMA
-- Purpose: Persist meeting sessions for cross-device
--          discovery and join-link validation.
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MEETINGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_code TEXT UNIQUE NOT NULL,
    host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    host_name TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'PRISM Meeting',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view meetings (needed for join-link validation)
CREATE POLICY "Authenticated users can view meetings"
    ON public.meetings FOR SELECT
    USING (auth.role() = 'authenticated');

-- Any authenticated user can create a meeting (they become the host)
CREATE POLICY "Authenticated users can create meetings"
    ON public.meetings FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Only the host can update their own meeting (e.g., mark as ended)
CREATE POLICY "Hosts can update their own meetings"
    ON public.meetings FOR UPDATE
    USING (auth.role() = 'authenticated' AND host_id = auth.uid());

-- Only the host or an admin can delete a meeting record
CREATE POLICY "Hosts and admins can delete meetings"
    ON public.meetings FOR DELETE
    USING (
        auth.role() = 'authenticated'
        AND (
            host_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    );

-- ==========================================
-- 3. INDEX for fast code lookups
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_meetings_code ON public.meetings (meeting_code);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings (status) WHERE status = 'active';

-- ==========================================
-- 4. REALTIME PUBLICATION
-- ==========================================
-- Allow clients to subscribe to meeting status changes (e.g., host ends meeting)
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
