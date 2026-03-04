import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { Users, Shield, ShieldCheck, ShieldOff, User, X, Activity, ArrowUpCircle, ArrowDownCircle, Ban, CheckCircle, Loader2, RefreshCw, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useToast } from './Toast';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
}

export default function UserManagement({ onClose }: { onClose: () => void }) {
    const { user: currentUser } = useAuth();
    const [view, setView] = useState<'users' | 'logs'>('users');
    const { showToast } = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // userId being acted on
    const [searchQuery, setSearchQuery] = useState('');

    if (currentUser?.role !== 'admin') return null;

    // Fetch all users via RPC
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const { data, error } = await supabase.rpc('get_all_users');
            if (error) {
                console.error('[UserMgmt] Failed to fetch users:', error);
                showToast('Failed to load users', 'error');
            } else {
                setUsers(data || []);
            }
        } catch (err) {
            console.error('[UserMgmt] Unexpected error:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Change user role
    const handleChangeRole = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        try {
            const { error } = await supabase.rpc('admin_update_user_role', {
                target_user_id: userId,
                new_role: newRole,
            });
            if (error) {
                showToast(`Failed: ${error.message}`, 'error');
            } else {
                showToast(`Role updated to ${newRole}`, 'success');
                await fetchUsers();
            }
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    // Block / Unblock user
    const handleToggleActive = async (userId: string, active: boolean) => {
        setActionLoading(userId);
        try {
            const { error } = await supabase.rpc('admin_set_user_active', {
                target_user_id: userId,
                active: active,
            });
            if (error) {
                showToast(`Failed: ${error.message}`, 'error');
            } else {
                showToast(active ? 'User unblocked' : 'User blocked', 'success');
                await fetchUsers();
            }
        } catch (err: any) {
            showToast(`Error: ${err.message}`, 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">🛡️ Admin</span>;
            case 'instructor':
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">📘 Instructor</span>;
            default:
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">👁️ Viewer</span>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[var(--md-sys-color-surface)] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Security & Users</h2>
                            <p className="text-sm text-[var(--md-sys-color-secondary)]">
                                Manage access, roles, and permissions
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors tap-target"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[var(--md-sys-color-outline)]">
                    <button
                        onClick={() => setView('users')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                            view === 'users' ? "text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        <Users size={16} /> Active Users ({users.length})
                        {view === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
                    </button>
                    <button
                        onClick={() => setView('logs')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                            view === 'logs' ? "text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        <Activity size={16} /> Audit Logs
                        {view === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-[var(--md-sys-color-background)]">
                    {view === 'users' && (
                        <div className="space-y-3">
                            {/* Search + Refresh bar */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search users..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-secondary)] focus:outline-none focus:border-violet-500 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={fetchUsers}
                                    disabled={isLoadingUsers}
                                    className="p-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors disabled:opacity-50"
                                    title="Refresh"
                                >
                                    <RefreshCw size={16} className={clsx(isLoadingUsers && "animate-spin")} />
                                </button>
                            </div>

                            {isLoadingUsers ? (
                                <div className="text-center py-12">
                                    <Loader2 size={32} className="animate-spin mx-auto text-violet-500 mb-3" />
                                    <p className="text-sm text-[var(--md-sys-color-secondary)]">Loading users...</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>{searchQuery ? 'No users match your search.' : 'No users found.'}</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredUsers.map((u) => {
                                        const isCurrentUser = u.id === currentUser?.id;
                                        const isBlocked = !u.is_active;
                                        const isActing = actionLoading === u.id;

                                        return (
                                            <motion.div
                                                key={u.id}
                                                layout
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={clsx(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                    isBlocked
                                                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30"
                                                        : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)]"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    {/* Avatar */}
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
                                                        isBlocked ? "bg-red-400" :
                                                            u.role === 'admin' ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" :
                                                                u.role === 'instructor' ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                                                                    "bg-gradient-to-br from-slate-400 to-slate-500"
                                                    )}>
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 text-sm">
                                                            <span className="truncate">{u.name}</span>
                                                            {isCurrentUser && (
                                                                <span className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 px-1.5 py-0.5 rounded-full flex-shrink-0">You</span>
                                                            )}
                                                            {isBlocked && (
                                                                <span className="text-[9px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-1.5 py-0.5 rounded-full flex-shrink-0">Blocked</span>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs text-[var(--md-sys-color-secondary)] truncate">{u.email}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {getRoleBadge(u.role)}
                                                            <span className="text-[9px] text-[var(--md-sys-color-secondary)]">
                                                                Joined {new Date(u.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions (not for current admin user) */}
                                                {!isCurrentUser && (
                                                    <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                                                        {isActing ? (
                                                            <Loader2 size={18} className="animate-spin text-violet-500" />
                                                        ) : (
                                                            <>
                                                                {/* Promote / Demote */}
                                                                {u.role === 'viewer' && (
                                                                    <button
                                                                        onClick={() => handleChangeRole(u.id, 'instructor')}
                                                                        className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors tap-target"
                                                                        title="Promote to Instructor"
                                                                    >
                                                                        <ArrowUpCircle size={16} />
                                                                    </button>
                                                                )}
                                                                {u.role === 'instructor' && (
                                                                    <button
                                                                        onClick={() => handleChangeRole(u.id, 'viewer')}
                                                                        className="p-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-600 rounded-lg transition-colors tap-target"
                                                                        title="Demote to Viewer"
                                                                    >
                                                                        <ArrowDownCircle size={16} />
                                                                    </button>
                                                                )}

                                                                {/* Block / Unblock */}
                                                                {u.role !== 'admin' && (
                                                                    <button
                                                                        onClick={() => handleToggleActive(u.id, !u.is_active)}
                                                                        className={clsx(
                                                                            "p-2.5 rounded-lg transition-colors tap-target",
                                                                            isBlocked
                                                                                ? "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-600"
                                                                                : "bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600"
                                                                        )}
                                                                        title={isBlocked ? "Unblock User" : "Block User"}
                                                                    >
                                                                        {isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    )}

                    {view === 'logs' && (
                        <div className="space-y-4">
                            <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                <Shield size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Detailed Audit logs are being migrated to Supabase.</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
