-- ==========================================
-- PRISM SECURITY SCHEMA
-- Server-side security infrastructure
-- ==========================================

-- ==========================================
-- 1. AUDIT LOGS — Immutable event trail
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'danger')),
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by user and time range
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read ALL audit logs
CREATE POLICY "Admins can read all audit logs"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Non-admins can only read their own audit logs
CREATE POLICY "Users can read own audit logs"
    ON public.audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- INSERT only via the RPC below (SECURITY DEFINER), not directly
-- No UPDATE or DELETE policies — audit logs are IMMUTABLE


-- ==========================================
-- 2. ACTIVE SESSIONS — Track concurrent devices
-- ==========================================
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT,
    user_agent TEXT,
    ip_address TEXT,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires ON public.active_sessions(expires_at);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
    ON public.active_sessions FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own sessions (e.g., heartbeat, logout)
CREATE POLICY "Users can update own sessions"
    ON public.active_sessions FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions"
    ON public.active_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Admins can force-terminate sessions
CREATE POLICY "Admins can update any session"
    ON public.active_sessions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );


-- ==========================================
-- 3. USER SECURITY SETTINGS — Per-user config
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_security_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    failed_login_count INTEGER DEFAULT 0,
    last_failed_login_at TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT false,
    locked_until TIMESTAMPTZ,
    session_timeout_minutes INTEGER DEFAULT 30,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret TEXT,  -- encrypted TOTP secret (for future MFA)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- Users can read their own security settings
CREATE POLICY "Users can read own security settings"
    ON public.user_security_settings FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own timeout preferences
CREATE POLICY "Users can update own security settings"
    ON public.user_security_settings FOR UPDATE
    USING (user_id = auth.uid());

-- Admins can read all settings
CREATE POLICY "Admins can read all security settings"
    ON public.user_security_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- Admins can unlock accounts
CREATE POLICY "Admins can update any security settings"
    ON public.user_security_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );


-- ==========================================
-- 4. RPCs — Server-side security functions
-- ==========================================

-- 4a. Log a security event (SECURITY DEFINER — bypasses RLS for INSERT)
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT DEFAULT 'info',
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_user_email TEXT;
BEGIN
    -- Get the current user's email
    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

    INSERT INTO public.audit_logs (
        user_id, user_email, event_type, severity,
        resource_type, resource_id, details,
        ip_address, user_agent
    ) VALUES (
        auth.uid(), v_user_email, p_event_type, p_severity,
        p_resource_type, p_resource_id, p_details,
        p_ip_address, p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;


-- 4b. Register / refresh a session
CREATE OR REPLACE FUNCTION public.register_session(
    p_device_fingerprint TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_timeout_minutes INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session_id UUID;
BEGIN
    -- Deactivate any old expired sessions for this user
    UPDATE public.active_sessions
    SET is_active = false
    WHERE user_id = auth.uid() AND expires_at < NOW();

    -- Upsert the session for this device
    INSERT INTO public.active_sessions (
        user_id, device_fingerprint, user_agent, ip_address,
        last_activity_at, expires_at, is_active
    ) VALUES (
        auth.uid(), p_device_fingerprint, p_user_agent, p_ip_address,
        NOW(), NOW() + (p_timeout_minutes || ' minutes')::INTERVAL, true
    )
    ON CONFLICT (id) DO UPDATE SET
        last_activity_at = NOW(),
        expires_at = NOW() + (p_timeout_minutes || ' minutes')::INTERVAL,
        is_active = true
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$;


-- 4c. Heartbeat — extend session expiry
CREATE OR REPLACE FUNCTION public.session_heartbeat(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_timeout INTEGER;
BEGIN
    -- Get user's configured timeout
    SELECT COALESCE(session_timeout_minutes, 30)
    INTO v_timeout
    FROM public.user_security_settings
    WHERE user_id = auth.uid();

    -- If no settings row, default to 30
    IF v_timeout IS NULL THEN
        v_timeout := 30;
    END IF;

    UPDATE public.active_sessions
    SET
        last_activity_at = NOW(),
        expires_at = NOW() + (v_timeout || ' minutes')::INTERVAL
    WHERE id = p_session_id AND user_id = auth.uid() AND is_active = true;

    RETURN FOUND;
END;
$$;


-- 4d. Check rate limit — anti-brute-force for login
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email TEXT)
RETURNS TABLE (
    is_allowed BOOLEAN,
    is_locked BOOLEAN,
    retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_settings RECORD;
    v_user_id UUID;
    v_recent_failures INTEGER;
BEGIN
    -- Find the user
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        -- User doesn't exist; allow the attempt (will fail at auth layer)
        RETURN QUERY SELECT true, false, 0;
        RETURN;
    END IF;

    -- Get security settings
    SELECT * INTO v_settings FROM public.user_security_settings WHERE user_id = v_user_id;

    -- If account is locked
    IF v_settings IS NOT NULL AND v_settings.is_locked AND v_settings.locked_until > NOW() THEN
        RETURN QUERY SELECT
            false,
            true,
            EXTRACT(EPOCH FROM (v_settings.locked_until - NOW()))::INTEGER;
        RETURN;
    END IF;

    -- Auto-unlock if lock expired
    IF v_settings IS NOT NULL AND v_settings.is_locked AND v_settings.locked_until <= NOW() THEN
        UPDATE public.user_security_settings
        SET is_locked = false, failed_login_count = 0, locked_until = NULL
        WHERE user_id = v_user_id;
    END IF;

    -- Count recent failures (last 15 minutes)
    SELECT COUNT(*) INTO v_recent_failures
    FROM public.audit_logs
    WHERE user_id = v_user_id
      AND event_type = 'LOGIN_FAILED'
      AND created_at > NOW() - INTERVAL '15 minutes';

    -- Lock after 5 failures in 15 minutes
    IF v_recent_failures >= 5 THEN
        INSERT INTO public.user_security_settings (user_id, is_locked, locked_until, failed_login_count)
        VALUES (v_user_id, true, NOW() + INTERVAL '15 minutes', v_recent_failures)
        ON CONFLICT (user_id) DO UPDATE SET
            is_locked = true,
            locked_until = NOW() + INTERVAL '15 minutes',
            failed_login_count = v_recent_failures;

        RETURN QUERY SELECT false, true, 900;  -- 15 min = 900 seconds
        RETURN;
    END IF;

    RETURN QUERY SELECT true, false, 0;
END;
$$;


-- 4e. Record failed login
CREATE OR REPLACE FUNCTION public.record_failed_login(p_email TEXT, p_ip TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    -- Log the failure even if user doesn't exist (for monitoring)
    INSERT INTO public.audit_logs (
        user_id, user_email, event_type, severity, ip_address, details
    ) VALUES (
        v_user_id, p_email, 'LOGIN_FAILED', 'warning', p_ip,
        jsonb_build_object('reason', CASE WHEN v_user_id IS NULL THEN 'unknown_email' ELSE 'wrong_password' END)
    );

    -- Increment failure counter
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.user_security_settings (user_id, failed_login_count, last_failed_login_at)
        VALUES (v_user_id, 1, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            failed_login_count = user_security_settings.failed_login_count + 1,
            last_failed_login_at = NOW();
    END IF;
END;
$$;


-- 4f. Clean up old audit logs (retain 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Only admins should call this (enforced at app layer)
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
      AND severity = 'info';  -- Keep warning/danger logs longer

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$;


-- 4g. Get audit log summary for dashboard
CREATE OR REPLACE FUNCTION public.get_security_dashboard()
RETURNS TABLE (
    total_events BIGINT,
    danger_events BIGINT,
    warning_events BIGINT,
    active_sessions BIGINT,
    locked_accounts BIGINT,
    recent_events JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.audit_logs WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM public.audit_logs WHERE severity = 'danger' AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM public.audit_logs WHERE severity = 'warning' AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM public.active_sessions WHERE is_active = true AND expires_at > NOW()),
        (SELECT COUNT(*) FROM public.user_security_settings WHERE is_locked = true),
        (
            SELECT COALESCE(jsonb_agg(row_to_json(r)), '[]'::jsonb)
            FROM (
                SELECT event_type, severity, user_email, created_at
                FROM public.audit_logs
                ORDER BY created_at DESC
                LIMIT 20
            ) r
        );
END;
$$;


-- ==========================================
-- 5. AUTO-CREATE SECURITY SETTINGS ON SIGNUP
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_security_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created_security
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_security();


-- ==========================================
-- 6. ENABLE REALTIME for security tables
-- ==========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
