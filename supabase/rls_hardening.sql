-- ==========================================
-- PRISM RLS HARDENING MIGRATION
-- ==========================================
-- This migration upgrades SELECT policies from open (USING true) 
-- to require authenticated sessions with active profiles.
-- Run this AFTER the base schema.sql is applied.
-- ==========================================

-- Helper: Reusable check for authenticated + active user
-- (Used in policy definitions below)

-- ==========================================
-- 1. PROFILES — Require authentication
-- ==========================================
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admins can deactivate other users (but not themselves)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );


-- ==========================================
-- 2. STUDENTS — Require authentication + active profile
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
CREATE POLICY "Authenticated active users can view students"
    ON public.students FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Keep existing INSERT/UPDATE/DELETE policies (already role-gated)


-- ==========================================
-- 3. SCHEDULE SLOTS — Require authentication
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view schedule" ON public.schedule_slots;
CREATE POLICY "Authenticated active users can view schedule"
    ON public.schedule_slots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Keep existing management policy (already role-gated)


-- ==========================================
-- 4. RESOURCES — Require authentication
-- ==========================================
DROP POLICY IF EXISTS "Anyone can view resources" ON public.resources;
CREATE POLICY "Authenticated active users can view resources"
    ON public.resources FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_active = true
        )
    );


-- ==========================================
-- 5. CHAT CHANNELS — Add active user check
-- ==========================================
DROP POLICY IF EXISTS "View Channels" ON public.chat_channels;
CREATE POLICY "Authenticated users can view accessible channels"
    ON public.chat_channels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_active = true
        )
        AND (type != 'dm' OR (auth.uid() = ANY(participants)))
    );


-- ==========================================
-- 6. CHAT MESSAGES — Add active user check
-- ==========================================
DROP POLICY IF EXISTS "Read Messages" ON public.chat_messages;
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
            AND (type != 'dm' OR auth.uid() = ANY(participants))
        )
    );


-- ==========================================
-- 7. APP SETTINGS — Require authentication
-- ==========================================
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.app_settings;
CREATE POLICY "Authenticated users can view settings"
    ON public.app_settings FOR SELECT
    USING (auth.role() = 'authenticated');
