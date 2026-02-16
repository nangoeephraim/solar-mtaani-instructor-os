import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, InviteCode, UserRole, SecurityLog, SecurityEventType } from '../types';
import { hashPin, validatePin, generateSalt } from '../services/security';

interface AuthContextType {
    user: AuthUser | null;
    users: AuthUser[];
    isAuthenticated: boolean;
    isLocked: boolean;
    inviteCodes: InviteCode[];
    securityLogs: SecurityLog[];
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    lock: () => void;
    unlock: (pin: string) => Promise<boolean>;
    setupAdmin: (name: string, pin: string) => Promise<void>;
    generateInvite: (role: UserRole) => string;
    revokeInvite: (code: string) => void;
    useInvite: (code: string, name: string, pin: string) => Promise<boolean>;
    deleteUser: (userId: string) => void;
    isLoading: boolean;
    loginError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate Limiting Constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 seconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
    const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    // Rate Limiting State
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Load data on mount
    useEffect(() => {
        const storedUsers = localStorage.getItem('prism_users');
        const storedInvites = localStorage.getItem('prism_invites');
        const storedLogs = localStorage.getItem('prism_security_logs');

        if (storedUsers) setUsers(JSON.parse(storedUsers));
        if (storedInvites) setInviteCodes(JSON.parse(storedInvites));
        if (storedLogs) setSecurityLogs(JSON.parse(storedLogs));

        // Check for active session (simplified)
        const session = sessionStorage.getItem('prism_session');
        if (session && storedUsers) {
            const foundUser = JSON.parse(storedUsers).find((u: AuthUser) => u.id === session);
            if (foundUser) setUser(foundUser);
        }

        setIsLoading(false);
    }, []);

    // Save data on change
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem('prism_users', JSON.stringify(users));
            localStorage.setItem('prism_invites', JSON.stringify(inviteCodes));
            localStorage.setItem('prism_security_logs', JSON.stringify(securityLogs));
        }
    }, [users, inviteCodes, securityLogs, isLoading]);

    // Auto-lock timer
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const resetTimer = () => {
            if (isLocked) return;
            clearTimeout(timeout);
            if (user) {
                // Lock after 15 minutes of inactivity
                timeout = setTimeout(() => setIsLocked(true), 15 * 60 * 1000);
            }
        };

        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => document.addEventListener(event, resetTimer));

        resetTimer();

        return () => {
            clearTimeout(timeout);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [user, isLocked]);

    const logEvent = (
        event: SecurityEventType,
        severity: 'info' | 'warning' | 'danger',
        details?: string,
        userId?: string,
        userName?: string
    ) => {
        const newLog: SecurityLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            event,
            severity,
            details,
            userId: userId || user?.id,
            userName: userName || user?.name
        };
        setSecurityLogs(prev => [newLog, ...prev]);
        return newLog;
    };

    const login = async (pin: string): Promise<boolean> => {
        setLoginError(null);

        // Check Lockout
        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            setLoginError(`Too many failed attempts. Try again in ${remaining}s`);
            return false;
        }

        // 1. Find potential user by checking if ANY user's pin matches
        // This is tricky with hashing. We iterate all users.
        // Optimization: In a real app we'd ID first, but here we only have PIN.
        // We will try to validate against ALL users.

        let foundUser: AuthUser | undefined;
        let migrationNeeded = false;

        for (const u of users) {
            const result = await validatePin(pin, u);
            if (result.isValid) {
                foundUser = u;
                migrationNeeded = result.requiresMigration;
                break;
            }
        }

        if (foundUser) {
            // Success
            setUser(foundUser);
            setIsLocked(false);
            setFailedAttempts(0);
            setLockoutUntil(null);
            sessionStorage.setItem('prism_session', foundUser.id);

            // Log Success
            logEvent('LOGIN_SUCCESS', 'info', 'User logged in successfully', foundUser.id, foundUser.name);

            // Handle Lazy Migration
            let updatedUsers = [...users];
            if (migrationNeeded) {
                const newSalt = generateSalt();
                const newHash = await hashPin(pin, newSalt);

                updatedUsers = updatedUsers.map(u =>
                    u.id === foundUser!.id
                        ? { ...u, pin: newHash, salt: newSalt, lastLogin: new Date().toISOString() }
                        : u
                );

                logEvent('MIGRATION_SUCCESS', 'info', 'User security upgraded to SHA-256', foundUser.id, foundUser.name);

                // Update local user state specifically to ensure consistency
                setUser({ ...foundUser, pin: newHash, salt: newSalt, lastLogin: new Date().toISOString() });
            } else {
                updatedUsers = updatedUsers.map(u =>
                    u.id === foundUser!.id
                        ? { ...u, lastLogin: new Date().toISOString() }
                        : u
                );
            }

            setUsers(updatedUsers);
            return true;
        }

        // Failure
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
            setLockoutUntil(Date.now() + LOCKOUT_DURATION);
            setLoginError(`Too many failed attempts. Locked for 30s.`);
            logEvent('LOCKOUT_TRIGGERED', 'danger', `Temporary lockout after ${newAttempts} failed attempts`);
        } else {
            setLoginError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
            logEvent('LOGIN_FAIL', 'warning', `Failed login attempt (${newAttempts}/${MAX_ATTEMPTS})`);
        }

        return false;
    };

    const logout = () => {
        if (user) logEvent('LOGOUT', 'info', 'User logged out');
        setUser(null);
        setIsLocked(false);
        sessionStorage.removeItem('prism_session');
    };

    const lock = () => setIsLocked(true);

    const unlock = async (pin: string) => {
        if (!user) return false;

        if (lockoutUntil && Date.now() < lockoutUntil) {
            const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
            setLoginError(`Locked. Wait ${remaining}s`);
            return false;
        }

        const result = await validatePin(pin, user);

        if (result.isValid) {
            setIsLocked(false);
            setFailedAttempts(0);
            setLoginError(null);
            return true;
        }

        // Handle unlock failure same as login failure for security
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
            setLockoutUntil(Date.now() + LOCKOUT_DURATION);
            setLoginError(`Too many attempts. Locked for 30s.`);
        }

        return false;
    };

    const setupAdmin = async (name: string, pin: string) => {
        const salt = generateSalt();
        const hashedPin = await hashPin(pin, salt);

        const newAdmin: AuthUser = {
            id: `admin_${Date.now()}`,
            name,
            role: 'admin',
            pin: hashedPin,
            salt,
            lastLogin: new Date().toISOString()
        };

        setUsers([newAdmin]);
        setUser(newAdmin);
        setIsLocked(false);
        sessionStorage.setItem('prism_session', newAdmin.id);

        logEvent('ADMIN_SETUP', 'info', 'Initial admin account created', newAdmin.id, newAdmin.name);
    };

    const generateInvite = (role: UserRole) => {
        if (user?.role !== 'admin') throw new Error('Unauthorized');

        const code = `PRISM-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        const newInvite: InviteCode = {
            code,
            role,
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            status: 'active'
        };

        setInviteCodes(prev => [...prev, newInvite]);
        logEvent('INVITE_GENERATED', 'info', `Generated invite for role: ${role}`, user.id, user.name);
        return code;
    };

    const useInvite = async (code: string, name: string, pin: string) => {
        const invite = inviteCodes.find(i => i.code === code && i.status === 'active');
        if (!invite) {
            logEvent('LOGIN_FAIL', 'warning', `Attempted use of invalid invite code: ${code}`);
            return false;
        }

        if (new Date(invite.expiresAt) < new Date()) {
            setInviteCodes(prev => prev.map(i => i.code === code ? { ...i, status: 'expired' } : i));
            logEvent('LOGIN_FAIL', 'warning', `Attempted use of expired invite code: ${code}`);
            return false;
        }

        const salt = generateSalt();
        const hashedPin = await hashPin(pin, salt);

        const newUser: AuthUser = {
            id: `user_${Date.now()}`,
            name,
            role: invite.role,
            pin: hashedPin,
            salt,
            lastLogin: new Date().toISOString()
        };

        setUsers(prev => [...prev, newUser]);
        setUser(newUser);
        setIsLocked(false);
        sessionStorage.setItem('prism_session', newUser.id);

        // Mark invite as used
        setInviteCodes(prev => prev.map(i => i.code === code ? { ...i, status: 'used', usedBy: newUser.id } : i));

        logEvent('INVITE_USED', 'info', `User joined via invite ${code}`, newUser.id, newUser.name);

        return true;
    };

    const deleteUser = (userId: string) => {
        if (user?.role !== 'admin') return;

        const targetUser = users.find(u => u.id === userId);
        setUsers(prev => prev.filter(u => u.id !== userId));

        logEvent('USER_DELETED', 'warning', `Deleted user: ${targetUser?.name || userId}`, user.id, user.name);
    };

    const revokeInvite = (code: string) => {
        if (user?.role !== 'admin') return;
        setInviteCodes(prev => prev.map(i => i.code === code ? { ...i, status: 'revoked' } : i));
        logEvent('INVITE_REVOKED', 'warning', `Revoked invite: ${code}`, user.id, user.name);
    };

    return (
        <AuthContext.Provider value={{
            user,
            users,
            inviteCodes,
            securityLogs,
            isAuthenticated: !!user,
            isLocked,
            login,
            logout,
            lock,
            unlock,
            setupAdmin,
            generateInvite,
            revokeInvite,
            useInvite,
            deleteUser,
            isLoading,
            loginError
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

