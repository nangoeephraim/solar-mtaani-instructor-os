/**
 * PRISM Security Service
 * 
 * Comprehensive security layer providing:
 * - Audit event logging via Supabase RPCs
 * - Session management with heartbeat
 * - Rate limiting checks
 * - Input sanitization (XSS prevention)
 * - Device fingerprinting
 * - Security dashboard data fetching
 */

import { supabase } from './supabase';
import { AuditLogEntry, SecurityDashboard, SessionInfo } from '../types';

// ==========================================
// CONSTANTS
// ==========================================
const HASH_ALGO = 'SHA-256';
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_KEY = 'prism_session_id';

// Helper: Convert ArrayBuffer to Hex String
const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};


// ==========================================
// CRYPTOGRAPHIC UTILITIES
// ==========================================

/**
 * Generates a random cryptographic salt or token string.
 */
export const generateSalt = (length: number = 16): string => {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    return bufferToHex(randomValues.buffer);
};

/**
 * Hash sensitive data using SHA-256 with salt.
 */
export const hashData = async (data: string, salt?: string): Promise<string> => {
    const combined = salt ? `${salt}:${data}` : data;
    const encoded = new TextEncoder().encode(combined);
    const hashBuffer = await window.crypto.subtle.digest(HASH_ALGO, encoded);
    return bufferToHex(hashBuffer);
};


// ==========================================
// INPUT SANITIZATION (XSS Prevention)
// ==========================================

/**
 * Sanitize user input to prevent XSS attacks.
 * Strips HTML tags and escapes special characters.
 */
export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Validate that a string doesn't contain potentially dangerous patterns.
 */
export const isCleanInput = (input: string): boolean => {
    const dangerousPatterns = [
        /<script\b/i,
        /javascript:/i,
        /on\w+\s*=/i,  // onclick=, onload=, etc.
        /data:text\/html/i,
        /vbscript:/i,
    ];
    return !dangerousPatterns.some(pattern => pattern.test(input));
};


// ==========================================
// DEVICE FINGERPRINTING
// ==========================================

/**
 * Generate a simple device fingerprint for session tracking.
 * Not meant to be bulletproof — just enough to identify device switches.
 */
export const getDeviceFingerprint = async (): Promise<string> => {
    const components = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        screen.colorDepth?.toString() || '',
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.hardwareConcurrency?.toString() || '',
    ];
    const raw = components.join('|');
    return hashData(raw);
};

/**
 * Get a shortened user agent string for logging.
 */
export const getShortUserAgent = (): string => {
    const ua = navigator.userAgent;
    // Extract just the browser name and version
    const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    if (match) return `${match[1]}/${match[2]}`;
    if (ua.includes('Mobile')) return 'Mobile Browser';
    return 'Unknown Browser';
};


// ==========================================
// AUDIT LOGGING (via Supabase RPC)
// ==========================================

export interface SecurityEventPayload {
    eventType: string;
    severity?: 'info' | 'warning' | 'danger';
    resourceType?: string;
    resourceId?: string;
    details?: Record<string, any>;
}

/**
 * Log a security event to the server-side audit trail.
 * Uses SECURITY DEFINER RPC so it always succeeds for authenticated users.
 */
export const logSecurityEvent = async (payload: SecurityEventPayload): Promise<string | null> => {
    try {
        const { data, error } = await supabase.rpc('log_security_event', {
            p_event_type: payload.eventType,
            p_severity: payload.severity || 'info',
            p_resource_type: payload.resourceType || null,
            p_resource_id: payload.resourceId || null,
            p_details: payload.details || {},
            p_ip_address: null, // Not available client-side reliably
            p_user_agent: getShortUserAgent(),
        });

        if (error) {
            console.warn('[Security] Failed to log event:', error.message);
            return null;
        }
        return data as string;
    } catch (err) {
        console.warn('[Security] Audit log error:', err);
        return null;
    }
};

/**
 * Fetch audit logs for the current user (or all if admin).
 */
export const getAuditLogs = async (filters?: {
    eventType?: string;
    severity?: string;
    limit?: number;
    offset?: number;
}): Promise<AuditLogEntry[]> => {
    try {
        let query = supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(filters?.limit || 50);

        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
        }
        if (filters?.eventType) {
            query = query.eq('event_type', filters.eventType);
        }
        if (filters?.severity) {
            query = query.eq('severity', filters.severity);
        }

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            userEmail: row.user_email,
            eventType: row.event_type,
            severity: row.severity,
            resourceType: row.resource_type,
            resourceId: row.resource_id,
            details: row.details,
            ipAddress: row.ip_address,
            createdAt: row.created_at,
        }));
    } catch (err) {
        console.error('[Security] Failed to fetch audit logs:', err);
        return [];
    }
};


// ==========================================
// SESSION MANAGEMENT
// ==========================================

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Register a new session on login.
 * Returns the session ID to use for heartbeats.
 */
export const registerSession = async (timeoutMinutes: number = 30): Promise<string | null> => {
    try {
        const fingerprint = await getDeviceFingerprint();
        const { data, error } = await supabase.rpc('register_session', {
            p_device_fingerprint: fingerprint,
            p_user_agent: getShortUserAgent(),
            p_ip_address: null,
            p_timeout_minutes: timeoutMinutes,
        });

        if (error) {
            console.warn('[Security] Failed to register session:', error.message);
            return null;
        }

        const sessionId = data as string;
        if (sessionId) {
            sessionStorage.setItem(SESSION_KEY, sessionId);
        }
        return sessionId;
    } catch (err) {
        console.warn('[Security] Session registration error:', err);
        return null;
    }
};

/**
 * Send a heartbeat to keep the session alive.
 */
export const sendHeartbeat = async (): Promise<boolean> => {
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) return false;

    try {
        const { data, error } = await supabase.rpc('session_heartbeat', {
            p_session_id: sessionId,
        });
        if (error) {
            console.warn('[Security] Heartbeat failed:', error.message);
            return false;
        }
        return data as boolean;
    } catch {
        return false;
    }
};

/**
 * Start the automatic heartbeat timer.
 * Should be called after successful login.
 */
export const startHeartbeat = (): void => {
    stopHeartbeat(); // Clear any existing interval
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
};

/**
 * Stop the heartbeat timer.
 * Should be called on logout.
 */
export const stopHeartbeat = (): void => {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
};

/**
 * End the current session (on logout).
 */
export const endSession = async (): Promise<void> => {
    stopHeartbeat();
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    if (sessionId) {
        try {
            await supabase
                .from('active_sessions')
                .update({ is_active: false })
                .eq('id', sessionId);
        } catch {
            // Best-effort; don't block logout
        }
        sessionStorage.removeItem(SESSION_KEY);
    }
};

/**
 * Get the current user's active sessions (for the "Active Devices" UI).
 */
export const getActiveSessions = async (): Promise<SessionInfo[]> => {
    try {
        const { data, error } = await supabase
            .from('active_sessions')
            .select('*')
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('last_activity_at', { ascending: false });

        if (error) throw error;

        return (data || []).map((row: any) => ({
            id: row.id,
            deviceFingerprint: row.device_fingerprint,
            userAgent: row.user_agent,
            lastActivityAt: row.last_activity_at,
            expiresAt: row.expires_at,
            isActive: row.is_active,
            createdAt: row.created_at,
        }));
    } catch {
        return [];
    }
};


// ==========================================
// RATE LIMITING
// ==========================================

/**
 * Check if a login attempt is allowed (anti-brute-force).
 * Should be called BEFORE attempting sign-in.
 */
export const checkLoginRateLimit = async (email: string): Promise<{
    isAllowed: boolean;
    isLocked: boolean;
    retryAfterSeconds: number;
}> => {
    try {
        const { data, error } = await supabase.rpc('check_login_rate_limit', {
            p_email: email,
        });

        if (error) {
            console.warn('[Security] Rate limit check failed:', error.message);
            // Fail open — allow the attempt so we don't lock users out due to RPC issues
            return { isAllowed: true, isLocked: false, retryAfterSeconds: 0 };
        }

        const result = Array.isArray(data) ? data[0] : data;
        return {
            isAllowed: result?.is_allowed ?? true,
            isLocked: result?.is_locked ?? false,
            retryAfterSeconds: result?.retry_after_seconds ?? 0,
        };
    } catch {
        return { isAllowed: true, isLocked: false, retryAfterSeconds: 0 };
    }
};

/**
 * Record a failed login attempt server-side.
 */
export const recordFailedLogin = async (email: string): Promise<void> => {
    try {
        await supabase.rpc('record_failed_login', {
            p_email: email,
            p_ip: null,
        });
    } catch {
        // Best-effort; don't block the login flow
    }
};


// ==========================================
// SECURITY DASHBOARD
// ==========================================

/**
 * Fetch the security dashboard summary (admin-only).
 */
export const getSecurityDashboard = async (): Promise<SecurityDashboard | null> => {
    try {
        const { data, error } = await supabase.rpc('get_security_dashboard');
        if (error) throw error;

        const result = Array.isArray(data) ? data[0] : data;
        if (!result) return null;

        return {
            totalEvents: result.total_events || 0,
            dangerEvents: result.danger_events || 0,
            warningEvents: result.warning_events || 0,
            activeSessions: result.active_sessions || 0,
            lockedAccounts: result.locked_accounts || 0,
            recentEvents: (result.recent_events || []).map((e: any) => ({
                eventType: e.event_type,
                severity: e.severity,
                userEmail: e.user_email,
                createdAt: e.created_at,
            })),
        };
    } catch (err) {
        console.error('[Security] Dashboard fetch failed:', err);
        return null;
    }
};


// ==========================================
// INACTIVITY TIMEOUT
// ==========================================

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let onTimeoutCallback: (() => void) | null = null;

/**
 * Start the inactivity timer. Resets on any user interaction.
 * @param timeoutMs - Time in ms before auto-logout (default 30 min)
 * @param onTimeout - Callback fired when timeout expires
 */
export const startInactivityTimer = (
    timeoutMs: number = 30 * 60 * 1000,
    onTimeout: () => void
): void => {
    onTimeoutCallback = onTimeout;

    const resetTimer = () => {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            onTimeoutCallback?.();
        }, timeoutMs);
    };

    // Reset on user interactions
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    events.forEach(event => {
        document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();
};

/**
 * Stop the inactivity timer (on logout or component unmount).
 */
export const stopInactivityTimer = (): void => {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    onTimeoutCallback = null;
    // Note: event listeners remain but are harmless as timer is cleared
};
