-- ==========================================================
-- PRISM Security Hardening Script
-- Run this ONCE on the Supabase SQL Editor
-- ==========================================================

-- 1. Hardened handle_new_user trigger
--    Defaults to 'viewer'. Only grants 'admin' if NO admin exists yet.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
  admin_exists BOOLEAN;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'viewer');

  -- If someone requests admin, check if one already exists
  IF requested_role = 'admin' THEN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE role = 'admin') INTO admin_exists;
    IF admin_exists THEN
      requested_role := 'viewer';  -- Downgrade silently to viewer
    END IF;
  ELSE
    -- Force all non-admin signups to 'viewer' regardless of what client sends
    requested_role := 'viewer';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    requested_role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 2. check_admin_exists() RPC
--    Returns TRUE if an admin profile exists. Used by LoginPage.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(SELECT 1 FROM public.profiles WHERE role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 3. get_all_users() RPC  (admin only)
--    Returns all user profiles for the management panel.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  is_active BOOLEAN,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Only allow admin to call this
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  RETURN QUERY
    SELECT p.id, p.email, p.name, p.role, p.is_active, p.last_login_at, p.created_at
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 4. admin_update_user_role() RPC
--    Lets admin promote (viewer->instructor) or demote users.
--    Cannot change the admin's own role.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only admin can call this
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Cannot change own role
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Only allow valid non-admin roles
  IF new_role NOT IN ('instructor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Must be instructor or viewer';
  END IF;

  -- Cannot demote another admin (there should only be one, but safety check)
  IF EXISTS(SELECT 1 FROM public.profiles WHERE id = target_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Cannot change the role of another admin';
  END IF;

  UPDATE public.profiles SET role = new_role, updated_at = NOW() WHERE id = target_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 5. admin_set_user_active() RPC
--    Lets admin block/unblock users.
--    Cannot block the admin themselves.
-- ==========================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_active(
  target_user_id UUID,
  active BOOLEAN
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only admin can call this
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  -- Cannot block yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot block your own account';
  END IF;

  UPDATE public.profiles SET is_active = active, updated_at = NOW() WHERE id = target_user_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
