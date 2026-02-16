import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Trash2, Key, Shield, Clock, Plus, Copy, Check, X, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useToast } from './Toast';

export default function UserManagement({ onClose }: { onClose: () => void }) {
    const { users, user: currentUser, generateInvite, deleteUser, inviteCodes, revokeInvite, securityLogs } = useAuth();
    const [view, setView] = useState<'users' | 'invites' | 'logs'>('users');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const { showToast } = useToast();

    if (currentUser?.role !== 'admin') return null;

    const handleGenerateInvite = (role: 'admin' | 'instructor' | 'viewer') => {
        const code = generateInvite(role);
        setGeneratedCode(code);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Code copied to clipboard', 'success');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[var(--md-sys-color-surface)] w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Security & Users</h2>
                            <p className="text-sm text-[var(--md-sys-color-secondary)]">Manage access to PRISM</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-black/5 rounded-full"
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
                        <Users size={16} /> Active Users
                        {view === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
                    </button>
                    <button
                        onClick={() => setView('invites')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                            view === 'invites' ? "text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        <UserPlus size={16} /> Generate Invites
                        {view === 'invites' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
                    </button>
                    <button
                        onClick={() => setView('logs')}
                        className={clsx(
                            "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative",
                            view === 'logs' ? "text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        <Shield size={16} /> Audit Logs
                        {view === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600" />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-[var(--md-sys-color-background)]">
                    {view === 'users' && (
                        <div className="space-y-4">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                                                {u.name}
                                                {u.id === currentUser.id && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">You</span>}
                                            </h3>
                                            <div className="flex items-center gap-4 text-xs text-[var(--md-sys-color-secondary)]">
                                                <span className="capitalize flex items-center gap-1">
                                                    <Shield size={10} /> {u.role}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={10} /> Last active: {new Date(u.lastLogin).toLocaleDateString()}
                                                </span>
                                                {u.salt && (
                                                    <span className="flex items-center gap-1 text-green-600 font-medium" title="Secured with SHA-256">
                                                        <ShieldCheck size={10} /> Secure
                                                    </span>
                                                )}
                                                {!u.salt && (
                                                    <span className="flex items-center gap-1 text-amber-600 font-medium" title="Legacy Security - Will upgrade on next login">
                                                        <Shield size={10} /> Legacy
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {u.id !== currentUser.id && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Revoke access for this user?')) deleteUser(u.id);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Revoke Access"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'invites' && (
                        <div className="space-y-6">
                            {!generatedCode ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleGenerateInvite('admin')}
                                        className="p-6 bg-[var(--md-sys-color-surface)] border-2 border-transparent hover:border-violet-500 rounded-xl text-left shadow-sm transition-all group"
                                    >
                                        <div className="p-3 bg-violet-100 w-fit rounded-lg text-violet-600 mb-4 group-hover:scale-110 transition-transform">
                                            <Shield size={24} />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">Invite Administrator</h3>
                                        <p className="text-sm text-[var(--md-sys-color-secondary)]">Full access to all settings and user management.</p>
                                    </button>

                                    <button
                                        onClick={() => handleGenerateInvite('instructor')}
                                        className="p-6 bg-[var(--md-sys-color-surface)] border-2 border-transparent hover:border-blue-500 rounded-xl text-left shadow-sm transition-all group"
                                    >
                                        <div className="p-3 bg-blue-100 w-fit rounded-lg text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">Invite Instructor</h3>
                                        <p className="text-sm text-[var(--md-sys-color-secondary)]">Can manage students and schedules, but cannot delete data.</p>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Key size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Invite Code Generated</h3>
                                    <p className="text-[var(--md-sys-color-secondary)] mb-6">Share this code with the new user. It expires in 24 hours.</p>

                                    <div className="flex items-center justify-center gap-4 mb-8">
                                        <code className="text-3xl font-mono font-bold bg-[var(--md-sys-color-surface)] px-6 py-3 rounded-xl border border-[var(--md-sys-color-outline)] tracking-widest select-all">
                                            {generatedCode}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(generatedCode)}
                                            className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/30"
                                            aria-label="Copy to clipboard"
                                            title="Copy to clipboard"
                                        >
                                            <Copy size={24} />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setGeneratedCode(null)}
                                        className="text-sm text-[var(--md-sys-color-secondary)] hover:text-violet-600 underline"
                                    >
                                        Generate another code
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-[var(--md-sys-color-outline)]">
                                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] mb-4">Active Invites</h3>
                                <div className="space-y-2">
                                    {inviteCodes.filter(i => i.status === 'active' && new Date(i.expiresAt) > new Date()).length === 0 ? (
                                        <p className="text-sm text-[var(--md-sys-color-secondary)] italic">No active invites</p>
                                    ) : (
                                        inviteCodes.filter(i => i.status === 'active' && new Date(i.expiresAt) > new Date()).map(invite => (
                                            <div key={invite.code} className="flex items-center justify-between p-3 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)]">
                                                <div>
                                                    <div className="font-mono font-bold text-sm tracking-widest bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md w-fit mb-1">
                                                        {invite.code}
                                                    </div>
                                                    <p className="text-xs text-[var(--md-sys-color-secondary)]">
                                                        Role: <span className="capitalize font-medium">{invite.role}</span> • Expires: {new Date(invite.expiresAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => revokeInvite(invite.code)}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs font-bold"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'logs' && (
                        <div className="space-y-4">
                            {securityLogs.length === 0 ? (
                                <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                    <Shield size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>No audit logs available yet.</p>
                                </div>
                            ) : (
                                securityLogs.map(log => (
                                    <div key={log.id} className="p-3 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)] flex items-start gap-3">
                                        <div className={clsx(
                                            "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                                            log.severity === 'info' && "bg-blue-500",
                                            log.severity === 'warning' && "bg-amber-500",
                                            log.severity === 'danger' && "bg-red-500"
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                                                    {log.event.replace('_', ' ')}
                                                </p>
                                                <span className="text-xs text-[var(--md-sys-color-secondary)] whitespace-nowrap">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[var(--md-sys-color-secondary)] truncate">
                                                {log.details}
                                            </p>
                                            {log.userName && (
                                                <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1 flex items-center gap-1">
                                                    <User size={10} /> {log.userName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
