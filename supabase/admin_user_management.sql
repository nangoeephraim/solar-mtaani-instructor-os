-- =============================================================
-- ADMIN USER MANAGEMENT — Supabase RPC Functions
-- Security-critical: All functions verify the calling user is an admin
-- Run this in the Supabase SQL Editor
-- =============================================================

-- Drop existing functions first (handles signature changes)
DROP FUNCTION IF EXISTS get_all_users();
DROP FUNCTION IF EXISTS admin_update_user_role(uuid, text);
DROP FUNCTION IF EXISTS admin_set_user_active(uuid, boolean);

-- 1. GET ALL USERS
-- Returns all profiles for the admin user management panel.
-- Only admins can call this.
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id uuid,
    email text,
    name text,
    role text,
    is_active boolean,
    last_login_at timestamptz,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    RETURN QUERY
    SELECT
        p.id,
        p.email,
        p.name,
        p.role,
        p.is_active,
        p.last_login_at,
        p.created_at
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;


-- 2. ADMIN UPDATE USER ROLE
-- Changes a user's role (admin, instructor, viewer).
-- Prevents admins from demoting themselves.
-- Only admins can call this.
CREATE OR REPLACE FUNCTION admin_update_user_role(
    target_user_id uuid,
    new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate the new role
    IF new_role NOT IN ('admin', 'instructor', 'viewer') THEN
        RAISE EXCEPTION 'Invalid role: must be admin, instructor, or viewer';
    END IF;

    -- Prevent self-demotion
    IF target_user_id = auth.uid() AND new_role != 'admin' THEN
        RAISE EXCEPTION 'Cannot demote yourself';
    END IF;

    -- Perform the update
    UPDATE profiles
    SET role = new_role,
        updated_at = now()
    WHERE profiles.id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$;


-- 3. ADMIN SET USER ACTIVE (Block / Unblock)
-- Sets a user's is_active flag. When false, the user is blocked.
-- Prevents admins from blocking themselves.
-- Only admins can call this.
CREATE OR REPLACE FUNCTION admin_set_user_active(
    target_user_id uuid,
    active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verify the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Prevent self-blocking
    IF target_user_id = auth.uid() AND active = false THEN
        RAISE EXCEPTION 'Cannot block yourself';
    END IF;

    -- Perform the update
    UPDATE profiles
    SET is_active = active,
        updated_at = now()
    WHERE profiles.id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;
END;
$$;


-- 4. Ensure the profiles table has the required columns
-- (These likely already exist, but this is safe to run)
DO $$
BEGIN
    -- Add last_login_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
    END IF;

    -- Add is_active if it doesn't exist (defaulting to true)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
    END IF;
END $$;


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_users TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION admin_set_user_active TO authenticated;
