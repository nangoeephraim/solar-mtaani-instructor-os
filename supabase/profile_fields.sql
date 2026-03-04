-- ==========================================
-- Profile Fields Extension
-- Run this on the Supabase SQL Editor
-- ==========================================

-- Add optional profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Allow users to update their own new fields (existing policy covers UPDATE on own row)
-- No new policy needed — "Users can update own profile" already covers all columns.

-- RPC: Update own profile (safe — enforces auth.uid())
CREATE OR REPLACE FUNCTION public.update_own_profile(
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET
        name         = COALESCE(p_name, name),
        phone        = COALESCE(p_phone, phone),
        department   = COALESCE(p_department, department),
        bio          = COALESCE(p_bio, bio),
        avatar_url   = COALESCE(p_avatar_url, avatar_url),
        updated_at   = NOW()
    WHERE id = auth.uid();
END;
$$;

-- RPC: Clear avatar_url (needed when user removes photo)
CREATE OR REPLACE FUNCTION public.clear_own_avatar()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET avatar_url = NULL, updated_at = NOW()
    WHERE id = auth.uid();
END;
$$;
