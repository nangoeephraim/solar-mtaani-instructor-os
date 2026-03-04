import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthUser, UserRole } from '../types';
import {
    logSecurityEvent,
    registerSession,
    endSession,
    startHeartbeat,
    stopHeartbeat,
    startInactivityTimer,
    stopInactivityTimer,
    checkLoginRateLimit,
    recordFailedLogin,
} from '../services/security';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => Promise<void>;
    setupAdmin: (name: string, email: string, pass: string) => Promise<boolean>;
    registerInstructor: (name: string, email: string, pass: string) => Promise<boolean>;
    checkAdminExists: () => Promise<boolean>;
    isLoading: boolean;
    loginError: string | null;
    sessionExpiresAt: string | null;
    refreshSession: () => Promise<void>;
    clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default session timeout in minutes
const DEFAULT_SESSION_TIMEOUT = 30;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [sessionExpiresAt, setSessionExpiresAt] = useState<string | null>(null);
    const isInitialized = useRef(false);

    // Helper: build AuthUser from Supabase user — reads role from profiles table (server truth)
    const buildAuthUser = useCallback(async (supabaseUser: any): Promise<AuthUser> => {
        const metadata = supabaseUser.user_metadata || {};

        // Fetch the authoritative role from the profiles table, NOT from client metadata
        let role: UserRole = 'viewer';
        let name = metadata.name || supabaseUser.email?.split('@')[0] || 'Unknown User';
        let isActive = true;
        let avatarUrl: string | undefined = undefined;

        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, name, is_active, avatar_url')
                .eq('id', supabaseUser.id)
                .single();

            if (profile) {
                role = (profile.role as UserRole) || 'viewer';
                name = profile.name || name;
                isActive = profile.is_active !== false; // default true if null
                avatarUrl = profile.avatar_url || undefined;
            }
        } catch (err) {
            console.warn('[Auth] Could not fetch profile, using defaults:', err);
        }

        return {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name,
            role,
            createdAt: supabaseUser.created_at || new Date().toISOString(),
            isActive,
            avatarUrl,
        };
    }, []);

    // Start security services after login
    const startSecurityServices = useCallback(async () => {
        // Register server-side session
        const sessionId = await registerSession(DEFAULT_SESSION_TIMEOUT);
        if (sessionId) {
            const expiry = new Date(Date.now() + DEFAULT_SESSION_TIMEOUT * 60 * 1000);
            setSessionExpiresAt(expiry.toISOString());
        }

        // Start heartbeat to keep session alive
        startHeartbeat();

        // Start inactivity timer — auto-logout on prolonged idle
        startInactivityTimer(DEFAULT_SESSION_TIMEOUT * 60 * 1000, async () => {
            console.warn('[Security] Session expired due to inactivity');
            await logSecurityEvent({
                eventType: 'SESSION_EXPIRED',
                severity: 'info',
                details: { reason: 'inactivity_timeout' },
            });
            await performLogout();
        });
    }, []);

    // Clean up security services on logout
    const stopSecurityServices = useCallback(() => {
        stopHeartbeat();
        stopInactivityTimer();
        setSessionExpiresAt(null);
    }, []);

    // Internal logout function (avoids stale closures)
    const performLogout = useCallback(async () => {
        try {
            await logSecurityEvent({ eventType: 'LOGIN_SUCCESS', severity: 'info', details: { action: 'logout' } });
        } catch {
            // Don't block logout if logging fails
        }
        stopSecurityServices();
        await endSession();
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('[Auth] Error signing out:', error);
        }
        setUser(null);
    }, [stopSecurityServices]);

    // Initial session check — relies solely on onAuthStateChange to avoid race conditions.
    // Supabase fires INITIAL_SESSION synchronously when the listener is registered,
    // so there is no need for a separate getSession() call.
    useEffect(() => {
        if (isInitialized.current) return;
        isInitialized.current = true;

        // Safety timeout: if onAuthStateChange never fires (SDK issue), stop loading
        const safetyTimeout = setTimeout(() => {
            setIsLoading(prev => {
                if (prev) console.warn('[Auth] Safety timeout: forcing loading=false after 5s');
                return false;
            });
        }, 5000);

        // Listen for auth state changes (initial session, sign-in, sign-out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            clearTimeout(safetyTimeout);

            if (session?.user) {
                try {
                    // Race buildAuthUser against a 4-second deadline so loading always clears
                    const authUser = await Promise.race([
                        buildAuthUser(session.user),
                        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('profile_timeout')), 4000))
                    ]);

                    // Block inactive users
                    if (!authUser.isActive) {
                        console.warn('[Auth] User account is blocked');
                        setUser(null);
                        stopSecurityServices();
                        setIsLoading(false);
                        await supabase.auth.signOut();
                        return;
                    }

                    setUser(authUser);
                    setIsLoading(false); // Clear loading IMMEDIATELY after setting user

                    // Start security services non-blocking, only on real sign-in events
                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        startSecurityServices().catch(err =>
                            console.warn('[Auth] Security services failed to start:', err)
                        );
                    }

                    // On TOKEN_REFRESHED, re-sync role from profiles (eventually consistent)
                    if (event === 'TOKEN_REFRESHED') {
                        buildAuthUser(session.user).then(freshUser => {
                            setUser(freshUser);
                        }).catch(() => { /* silent — current user is still usable */ });
                    }
                } catch (err: any) {
                    if (err?.message === 'profile_timeout') {
                        // Profile query timed out — use metadata role (signed by Supabase at signup)
                        // This preserves admin/instructor roles instead of wrongly defaulting to viewer
                        console.warn('[Auth] Profile fetch timed out, using metadata role');
                        const metadata = session.user.user_metadata || {};
                        const metadataRole = (metadata.role as UserRole) || 'viewer';
                        setUser({
                            id: session.user.id,
                            email: session.user.email || '',
                            name: metadata.name || session.user.email?.split('@')[0] || 'User',
                            role: metadataRole,
                            createdAt: session.user.created_at || new Date().toISOString(),
                            isActive: true,
                        });
                    } else {
                        console.error('[Auth] Failed to build auth user:', err);
                        setUser(null);
                    }
                    setIsLoading(false);
                }
            } else {
                setUser(null);
                stopSecurityServices();
                setIsLoading(false);
            }
        });

        return () => {
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
            stopSecurityServices();
        };
    }, [buildAuthUser, startSecurityServices, stopSecurityServices]);

    // ─── Realtime Profile Subscription ───
    // Subscribe to changes on the current user's profile row.
    // This makes role promotions, name changes, and block/unblock instant.
    useEffect(() => {
        if (!user?.id) return;

        const channelName = `prism-profile:${user.id}`;
        const channel: RealtimeChannel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    const updated = payload.new as any;
                    if (!updated) return;

                    console.log('[Auth] Profile change detected via realtime:', updated);

                    // If user was blocked, force logout
                    if (updated.is_active === false) {
                        console.warn('[Auth] User has been blocked. Forcing logout.');
                        performLogout();
                        return;
                    }

                    // Update user state with new role/name/avatar
                    setUser(prev => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            role: (updated.role as UserRole) || prev.role,
                            name: updated.name || prev.name,
                            avatarUrl: updated.avatar_url ?? prev.avatarUrl,
                            isActive: updated.is_active !== false,
                        };
                    });
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Auth] Subscribed to profile changes for', user.id);
                }
            });

        return () => {
            supabase.removeChannel(channel).catch(() => { });
        };
    }, [user?.id, performLogout]);

    // Check if an admin account exists (calls the Supabase RPC)
    const checkAdminExists = async (): Promise<boolean> => {
        try {
            const { data, error } = await supabase.rpc('check_admin_exists');
            if (error) {
                console.warn('[Auth] check_admin_exists RPC failed:', error);
                return true; // Fail safe: assume admin exists to prevent rogue setup
            }
            return data === true;
        } catch {
            return true; // Fail safe
        }
    };

    const login = async (email: string, pass: string): Promise<boolean> => {
        setLoginError(null);
        try {
            // Step 1: Check rate limit before attempting login
            const rateLimit = await checkLoginRateLimit(email);
            if (!rateLimit.isAllowed) {
                if (rateLimit.isLocked) {
                    const minutes = Math.ceil(rateLimit.retryAfterSeconds / 60);
                    setLoginError(`Account temporarily locked. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
                } else {
                    setLoginError('Too many attempts. Please wait before trying again.');
                }
                return false;
            }

            // Step 2: Attempt sign-in
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: pass,
            });

            if (error) {
                console.error('[Auth] Login failed:', error);

                // Record the failed attempt server-side
                await recordFailedLogin(email);

                if (error.message.includes('Invalid login credentials')) {
                    setLoginError('Invalid email or password.');
                } else if (error.message.includes('Too many requests') || error.status === 429) {
                    setLoginError('Too many failed attempts. Try again later.');
                } else {
                    setLoginError(`Sign-in failed: ${error.message}`);
                }
                return false;
            }

            // Step 3: Check if user is blocked
            if (data.user) {
                const authUser = await buildAuthUser(data.user);

                if (!authUser.isActive) {
                    setLoginError('Your account has been blocked by the administrator. Contact your admin for access.');
                    await supabase.auth.signOut();
                    return false;
                }

                setUser(authUser);
            }

            // Step 4: Log successful login & start security services
            await logSecurityEvent({
                eventType: 'LOGIN_SUCCESS',
                severity: 'info',
                details: { method: 'email_password' },
            });

            await startSecurityServices();

            return true;
        } catch (error: any) {
            console.error('[Auth] Unexpected login error:', error);
            setLoginError(`Sign-in failed: ${error.message || 'Unknown error'}`);
            return false;
        }
    };

    const logout = async () => {
        await performLogout();
    };

    const refreshSession = async () => {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
                console.error('[Auth] Session refresh failed:', error);
                return;
            }
            if (data.session?.user) {
                const authUser = await buildAuthUser(data.session.user);
                setUser(authUser);
            }
        } catch (error) {
            console.error('[Auth] Unexpected refresh error:', error);
        }
    };

    const setupAdmin = async (name: string, email: string, pass: string): Promise<boolean> => {
        setLoginError(null);
        try {
            // SECURITY: Check if admin already exists before allowing setup
            const adminExists = await checkAdminExists();
            if (adminExists) {
                setLoginError('An administrator account already exists. Please sign in or register as an instructor.');
                return false;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: {
                        name: name,
                        role: 'admin',
                    },
                },
            });

            if (error) {
                console.error('[Auth] Admin setup failed:', error);
                if (error.message.includes('User already registered') || error.message.includes('email is already connected')) {
                    setLoginError('That email is already registered.');
                } else if (error.message.includes('Password should be at least')) {
                    setLoginError('Password should be at least 6 characters.');
                } else {
                    setLoginError(`Setup failed: ${error.message}`);
                }
                return false;
            }

            if (data.session) {
                // Log the admin creation event
                await logSecurityEvent({
                    eventType: 'USER_CREATED',
                    severity: 'info',
                    details: { role: 'admin', method: 'initial_setup' },
                });
                await startSecurityServices();
                return true;
            } else if (data.user) {
                setLoginError('Account created. Please verify your email before logging in.');
                return false;
            }

            return false;
        } catch (error: any) {
            console.error('[Auth] Unexpected setupAdmin error:', error);
            setLoginError(`Setup failed: ${error.message || 'Unknown error'}`);
            return false;
        }
    };

    // Register a new instructor (signs up as viewer, admin promotes later)
    const registerInstructor = async (name: string, email: string, pass: string): Promise<boolean> => {
        setLoginError(null);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: {
                        name: name,
                        role: 'viewer', // Start as viewer, admin promotes later
                    },
                },
            });

            if (error) {
                console.error('[Auth] Registration failed:', error);
                if (error.message.includes('User already registered') || error.message.includes('email is already connected')) {
                    setLoginError('That email is already registered. Please sign in instead.');
                } else if (error.message.includes('Password should be at least')) {
                    setLoginError('Password should be at least 6 characters.');
                } else {
                    setLoginError(`Registration failed: ${error.message}`);
                }
                return false;
            }

            if (data.session) {
                await logSecurityEvent({
                    eventType: 'USER_CREATED',
                    severity: 'info',
                    details: { role: 'viewer', method: 'self_registration' },
                });
                await startSecurityServices();
                return true;
            } else if (data.user) {
                setLoginError('Account created! Please verify your email before logging in.');
                return false;
            }

            return false;
        } catch (error: any) {
            console.error('[Auth] Unexpected registration error:', error);
            setLoginError(`Registration failed: ${error.message || 'Unknown error'}`);
            return false;
        }
    };

    const clearLoginError = () => {
        setLoginError(null);
    };

    const value = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        setupAdmin,
        registerInstructor,
        checkAdminExists,
        isLoading,
        loginError,
        sessionExpiresAt,
        refreshSession,
        clearLoginError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
