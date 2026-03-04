import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InstructorSettings, DEFAULT_SETTINGS, AppPreferences } from '../types';
import { getSettings, saveSettings, resetData, exportDataAsCSV, exportFullBackup, importFullBackup } from '../services/storageService';
import { useToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import UserAvatar from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, User, Download, RotateCcw, Save,
    AlertTriangle, FileDown, Moon, Sun, Palette, Sparkles,
    Bell, Upload, Database, Eye, Shield, LogOut, Users, ChevronRight,
    Laptop, Check, Info, Keyboard, HardDrive,
    Zap, Activity, Camera, Phone, Building2, FileText, X, Trash2
} from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import clsx from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uploadProfileAvatar, removeProfileAvatar, updateProfile, fetchProfile } from '../services/profileService';

interface SettingsProps { onDataReset: () => void; }

const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } }),
};

/* ─── Reusable Sub-Components ─── */
const SettingsRow: React.FC<{ icon: React.ReactNode; iconBg: string; title: string; subtitle: string; action: React.ReactNode }> = ({ icon, iconBg, title, subtitle, action }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl transition-colors duration-200 hover:bg-[var(--md-sys-color-surface-variant)] group">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105", iconBg)}>{icon}</div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] font-google">{title}</p>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="flex-shrink-0">{action}</div>
    </div>
);

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; iconColor: string; badge?: string }> = ({ icon, title, iconColor, badge }) => (
    <div className="flex items-center gap-3 px-2 pt-2 pb-3">
        <span className={iconColor}>{icon}</span>
        <h3 className="font-google font-bold text-base text-[var(--md-sys-color-on-surface)]">{title}</h3>
        {badge && <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]">{badge}</span>}
    </div>
);

/* ─── Keyboard Shortcuts Reference ─── */
const SHORTCUTS = [
    { keys: ['Ctrl', 'K'], desc: 'Command palette / Search' },
    { keys: ['Esc'], desc: 'Close modals and panels' },
    { keys: ['Enter'], desc: 'Send message in chat' },
    { keys: ['Shift', 'Enter'], desc: 'New line in message' },
];

/* ─── Storage Calculator ─── */
function getStorageUsage() {
    let totalUsed = 0;
    const items: { key: string; size: number }[] = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const val = localStorage.getItem(key) || '';
                const size = new Blob([val]).size;
                totalUsed += size;
                if (key.startsWith('prism')) items.push({ key, size });
            }
        }
    } catch { /* ignore */ }
    const total = 5 * 1024 * 1024;
    return { used: totalUsed, total, percentage: Math.min(100, Math.round((totalUsed / total) * 100)), items };
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

/* ══════════════════════════════════════════════
   MAIN SETTINGS COMPONENT
   ══════════════════════════════════════════════ */
const Settings: React.FC<SettingsProps> = ({ onDataReset }) => {
    const { preferences, settings, setPreference, setSetting } = useTheme();
    const { user, logout } = useAuth();
    const [localName, setLocalName] = useState(user?.name || settings.name);
    const [localOrg, setLocalOrg] = useState(settings.organization);
    const [localPhone, setLocalPhone] = useState('');
    const [localDepartment, setLocalDepartment] = useState('');
    const [localBio, setLocalBio] = useState('');
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadLimitMB, setUploadLimitMB] = useLocalStorage<number>('admin_upload_limit_mb', 2);

    const storageInfo = useMemo(() => getStorageUsage(), []);

    // Load profile data from DB on mount
    useEffect(() => {
        if (!user?.id) return;
        fetchProfile(user.id).then(profile => {
            if (profile) {
                setLocalName(profile.name);
                setLocalPhone(profile.phone || '');
                setLocalDepartment(profile.department || '');
                setLocalBio(profile.bio || '');
                setLocalAvatarUrl(profile.avatarUrl);
            }
        });
    }, [user?.id]);

    useEffect(() => { setLocalOrg(settings.organization); }, [settings.organization]);

    /* ─── Handlers ─── */
    const markChanged = () => setHasChanges(true);

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Validate type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            showToast('Please select a JPEG, PNG, or WebP image.', 'error');
            return;
        }
        // Validate size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image must be under 2MB.', 'error');
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        markChanged();
    };

    const handleRemoveAvatar = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        setLocalAvatarUrl(null);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        markChanged();
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            let newAvatarUrl = localAvatarUrl;

            // Upload new avatar if selected
            if (avatarFile) {
                newAvatarUrl = await uploadProfileAvatar(user.id, avatarFile);
                setLocalAvatarUrl(newAvatarUrl);
                setAvatarFile(null);
                setAvatarPreview(null);
            } else if (localAvatarUrl === null && user.avatarUrl) {
                // Avatar was removed
                await removeProfileAvatar(user.id);
            }

            // Update profile fields
            await updateProfile({
                name: localName,
                phone: localPhone || undefined,
                department: localDepartment || undefined,
                bio: localBio || undefined,
                avatarUrl: newAvatarUrl || undefined,
            });

            // Also update local settings
            setSetting('name', localName);
            setSetting('organization', localOrg);

            setHasChanges(false);
            showToast('Profile saved successfully!', 'success');
        } catch (err: any) {
            showToast(`Failed to save profile: ${err.message}`, 'error');
        }
        setIsSaving(false);
    };

    const handleExportCSV = async () => {
        const csv = await exportDataAsCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `prism_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showToast('Data exported successfully!', 'success');
    };
    const handleExportBackup = async () => {
        const backup = await exportFullBackup();
        const blob = new Blob([backup], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `prism_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showToast('Backup created successfully!', 'success');
    };
    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const success = await importFullBackup(event.target?.result as string);
            if (success) {
                showToast('Backup restored! Reloading...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast('Failed to restore backup', 'error');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const handleReset = () => {
        resetData();
        setHasChanges(false);
        setShowResetConfirm(false);
        onDataReset();
        showToast('All data has been reset to defaults', 'info');
        setTimeout(() => window.location.reload(), 1000);
    };

    const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
        setPreference('theme', theme);
        showToast(`Theme changed to ${theme}`, 'success');
    };

    const handleAccentChange = (color: AppPreferences['accentColor']) => {
        setPreference('accentColor', color);
        showToast(`Accent color changed to ${color}`, 'success');
    };

    const themeOptions: { id: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType; desc: string }[] = [
        { id: 'light', label: 'Light', icon: Sun, desc: 'Always light' },
        { id: 'dark', label: 'Dark', icon: Moon, desc: 'Always dark' },
        { id: 'system', label: 'System', icon: Laptop, desc: 'Match device' },
    ];
    const accentColors: { id: AppPreferences['accentColor']; label: string; hex: string }[] = [
        { id: 'blue', label: 'Google Blue', hex: '#4285f4' },
        { id: 'orange', label: 'Sunset', hex: '#ea8600' },
        { id: 'green', label: 'Forest', hex: '#34a853' },
        { id: 'purple', label: 'Galaxy', hex: '#9334e6' },
    ];

    const displayAvatar = avatarPreview || localAvatarUrl;

    return (
        <div className="max-w-2xl mx-auto pb-24 space-y-4">
            <PageHeader title="Settings" subtitle="Manage your profile, preferences, and app controls" icon={SettingsIcon} />

            {/* ═══ PROFILE ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={0} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-4"><SectionHeader icon={<User size={18} />} title="Profile" iconColor="text-orange-500" /></div>
                <div className="px-5 pb-5 space-y-5">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            {displayAvatar ? (
                                <img
                                    src={displayAvatar}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-2 ring-[var(--md-sys-color-outline-variant)]"
                                />
                            ) : (
                                <UserAvatar name={localName || 'U'} size={80} rounded="xl" className="shadow-lg ring-2 ring-[var(--md-sys-color-outline-variant)]" />
                            )}
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            >
                                <Camera size={22} className="text-white drop-shadow" />
                            </button>
                            {displayAvatar && (
                                <button
                                    onClick={handleRemoveAvatar}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600"
                                    title="Remove photo"
                                >
                                    <X size={12} strokeWidth={3} />
                                </button>
                            )}
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarSelect}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--md-sys-color-on-surface)] text-base truncate font-google">{localName || 'Your Name'}</p>
                            <p className="text-xs text-[var(--md-sys-color-secondary)] mt-0.5">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", user?.role === 'admin' ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : user?.role === 'instructor' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")}>{user?.role}</span>
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">Display Name</label>
                            <input type="text" value={localName} onChange={e => { setLocalName(e.target.value); markChanged(); }} placeholder="Your name" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all font-google" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">Organization</label>
                            <input type="text" value={localOrg} onChange={e => { setLocalOrg(e.target.value); markChanged(); }} placeholder="Organization name" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all font-google" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                                <Phone size={11} className="inline mr-1 -mt-0.5" />Phone
                            </label>
                            <input type="tel" value={localPhone} onChange={e => { setLocalPhone(e.target.value); markChanged(); }} placeholder="+254 700 000000" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all font-google" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                                <Building2 size={11} className="inline mr-1 -mt-0.5" />Department
                            </label>
                            <input type="text" value={localDepartment} onChange={e => { setLocalDepartment(e.target.value); markChanged(); }} placeholder="e.g. Solar Installation" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all font-google" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                            <FileText size={11} className="inline mr-1 -mt-0.5" />Bio
                        </label>
                        <textarea
                            value={localBio}
                            onChange={e => { if (e.target.value.length <= 160) { setLocalBio(e.target.value); markChanged(); } }}
                            placeholder="A brief description about yourself..."
                            rows={2}
                            className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all font-google resize-none"
                        />
                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] text-right mt-0.5 px-1">{localBio.length}/160</p>
                    </div>

                    <AnimatePresence>
                        {hasChanges && (
                            <motion.button
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-2xl font-google font-bold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isSaving ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                ) : (
                                    <><Save size={16} /> Save Profile</>
                                )}
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ═══ ACCOUNT & SECURITY ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={1} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-4"><SectionHeader icon={<Shield size={18} />} title="Account & Security" iconColor="text-violet-500" /></div>

                {/* Current User Quick Card */}
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]">
                        <UserAvatar name={localName || 'U'} avatarUrl={displayAvatar} size={48} rounded="xl" className="shadow-md" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate font-google">{localName || 'Instructor'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", user?.role === 'admin' ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300")}>{user?.role}</span>
                                {user?.lastLoginAt && <span className="text-[10px] text-[var(--md-sys-color-secondary)]">Last: {new Date(user.lastLoginAt).toLocaleDateString()}</span>}
                            </div>
                        </div>
                        <button onClick={logout} className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all text-[var(--md-sys-color-on-surface-variant)]" title="Lock App">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Admin: User Management & Security Logs */}
                {user?.role === 'admin' && (
                    <div className="px-5 pb-5 pt-1 space-y-2">
                        <button onClick={() => setShowUserManagement(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0"><Users size={18} className="text-white" /></div>
                            <div className="flex-1 text-left"><p className="text-sm font-bold text-violet-900 dark:text-violet-200 font-google">Manage Users</p><p className="text-xs text-violet-600 dark:text-violet-400">Invites, roles, and access control</p></div>
                            <ChevronRight size={18} className="text-violet-400 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                            <h4 className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-widest pl-2 mb-3">Global Constraints</h4>
                            <div className="bg-violet-50/50 dark:bg-violet-900/10 rounded-2xl p-4 border border-violet-100/50 dark:border-violet-800/50">
                                <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-1">Max Document Upload Size</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1" max="50" step="1"
                                        value={uploadLimitMB}
                                        onChange={e => setUploadLimitMB(parseInt(e.target.value))}
                                        className="flex-1 accent-violet-600"
                                    />
                                    <span className="font-bold text-violet-700 dark:text-violet-300 w-12 text-right">{uploadLimitMB} MB</span>
                                </div>
                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-2">Higher limits consume more local storage and may cause quota errors if over 5MB in some browsers.</p>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ═══ APPEARANCE ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={2} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-4"><SectionHeader icon={<Palette size={18} />} title="Appearance" iconColor="text-purple-500" /></div>
                <div className="px-5 pb-5 space-y-6">
                    {/* Theme Selector */}
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-3 px-1">Theme Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            {themeOptions.map(t => {
                                const isActive = preferences.theme === t.id;
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => handleThemeChange(t.id)}
                                        className={clsx(
                                            "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                                            isActive
                                                ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] shadow-sm"
                                                : "border-transparent bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                                                <Check size={12} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                        <Icon size={22} className={isActive ? "text-[var(--accent-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]"} />
                                        <div className="text-center">
                                            <span className={clsx("text-xs font-bold block", isActive ? "text-[var(--accent-primary)]" : "text-[var(--md-sys-color-on-surface)]")}>{t.label}</span>
                                            <span className="text-[9px] text-[var(--md-sys-color-secondary)]">{t.desc}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Accent Color Selector */}
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-3 px-1">Accent Color</label>
                        <div className="flex gap-4 justify-center">
                            {accentColors.map(c => {
                                const isActive = preferences.accentColor === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleAccentChange(c.id)}
                                        className="relative flex flex-col items-center gap-2 group cursor-pointer"
                                        title={c.label}
                                    >
                                        <div
                                            className={clsx(
                                                "w-14 h-14 rounded-2xl transition-all duration-200 shadow-sm flex items-center justify-center",
                                                isActive ? "ring-2 ring-offset-2 ring-[var(--md-sys-color-on-surface)] scale-110" : "hover:scale-105"
                                            )}
                                            style={{ backgroundColor: c.hex }}
                                        >
                                            {isActive && <Check size={20} className="text-white drop-shadow-md" strokeWidth={3} />}
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)]">{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══ FEATURES ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={3} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-2"><SectionHeader icon={<Sparkles size={18} />} title="Features & Controls" iconColor="text-indigo-500" /></div>
                <div className="px-3 pb-3 divide-y divide-[var(--md-sys-color-outline-variant)]">
                    <SettingsRow icon={<Sparkles size={18} className="text-white" />} iconBg="bg-gradient-to-br from-indigo-500 to-purple-600" title="Smart AI Insights" subtitle="Predictive analytics and intelligent data trends" action={<ToggleSwitch checked={preferences.enableAI} onChange={v => setPreference('enableAI', v)} />} />
                    <SettingsRow icon={<Bell size={18} className="text-white" />} iconBg="bg-gradient-to-br from-amber-400 to-orange-500" title="Notifications" subtitle="Toast notifications for actions and events" action={<ToggleSwitch checked={preferences.notificationsEnabled} onChange={v => setPreference('notificationsEnabled', v)} />} />
                    <SettingsRow icon={<Eye size={18} className="text-white" />} iconBg="bg-gradient-to-br from-teal-400 to-emerald-600" title="Reduced Motion" subtitle="Minimize animations for accessibility" action={<ToggleSwitch checked={preferences.reducedMotion} onChange={v => setPreference('reducedMotion', v)} />} />
                </div>
            </motion.div>

            {/* ═══ DATA MANAGEMENT ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={4} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-2"><SectionHeader icon={<Database size={18} />} title="Data Management" iconColor="text-blue-500" /></div>

                {/* Storage Usage Bar */}
                <div className="px-5 pb-4">
                    <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <HardDrive size={14} className="text-[var(--md-sys-color-secondary)]" />
                                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] font-google">Local Storage</span>
                            </div>
                            <span className="text-xs font-bold" style={{ color: storageInfo.percentage > 80 ? 'var(--md-sys-color-error)' : 'var(--md-sys-color-primary)' }}>
                                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-3)] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${storageInfo.percentage}%` }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="h-full rounded-full"
                                style={{ background: storageInfo.percentage > 80 ? 'var(--md-sys-color-error)' : storageInfo.percentage > 50 ? 'var(--google-yellow)' : 'var(--md-sys-color-primary)' }}
                            />
                        </div>
                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-1.5">{storageInfo.percentage}% used • {storageInfo.items.length} PRISM data keys</p>
                    </div>
                </div>

                <div className="px-3 pb-3 divide-y divide-[var(--md-sys-color-outline-variant)]">
                    <SettingsRow icon={<FileDown size={18} className="text-white" />} iconBg="bg-gradient-to-br from-blue-400 to-blue-600" title="Export CSV" subtitle="Download student data as spreadsheet" action={<button type="button" onClick={handleExportCSV} className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)]">Export</button>} />
                    {user?.role !== 'viewer' && (
                        <SettingsRow icon={<Download size={18} className="text-white" />} iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600" title="Full Backup" subtitle="Export all data + settings as JSON" action={<button type="button" onClick={handleExportBackup} className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)]">Backup</button>} />
                    )}
                    {user?.role === 'admin' && (
                        <SettingsRow icon={<Upload size={18} className="text-white" />} iconBg="bg-gradient-to-br from-indigo-400 to-indigo-600" title="Restore Backup" subtitle="Import a previously saved backup file" action={<label className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)] cursor-pointer">Restore<input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportBackup} /></label>} />
                    )}
                </div>
            </motion.div>

            {/* ═══ KEYBOARD SHORTCUTS ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={5} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-4"><SectionHeader icon={<Keyboard size={18} />} title="Keyboard Shortcuts" iconColor="text-teal-500" /></div>
                <div className="px-5 pb-5 space-y-2">
                    {SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                            <span className="text-sm text-[var(--md-sys-color-on-surface)] font-medium">{s.desc}</span>
                            <div className="flex items-center gap-1">
                                {s.keys.map((k, j) => (
                                    <React.Fragment key={j}>
                                        <kbd className="px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] text-[11px] font-bold text-[var(--md-sys-color-on-surface)] font-google shadow-sm min-w-[28px] text-center">{k}</kbd>
                                        {j < s.keys.length - 1 && <span className="text-[10px] text-[var(--md-sys-color-secondary)]">+</span>}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {user?.role === 'admin' && (
                <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={6} initial="hidden" animate="visible" variants={cardVariant}>
                    <div className="p-5 pb-2"><SectionHeader icon={<Shield size={18} />} title="Administration" iconColor="text-violet-500" /></div>
                    <div className="px-3 pb-3">
                        <SettingsRow icon={<Users size={18} className="text-white" />} iconBg="bg-gradient-to-br from-violet-400 to-violet-600" title="Security & Users" subtitle="Manage roles, block users, and control access permissions" action={<button type="button" onClick={() => setShowUserManagement(true)} className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-600 transition-colors shadow-sm flex items-center gap-1.5"><Shield size={13} /> Manage</button>} />
                    </div>
                </motion.div>
            )}

            {/* ═══ DANGER ZONE ═══ */}
            {user?.role === 'admin' && (
                <motion.div className="rounded-3xl overflow-hidden border-2 border-rose-200 dark:border-rose-800/50" custom={7} initial="hidden" animate="visible" variants={cardVariant}>
                    <div className="p-5 pb-2"><SectionHeader icon={<AlertTriangle size={18} />} title="Danger Zone" iconColor="text-rose-500" /></div>
                    <div className="px-3 pb-3">
                        <SettingsRow icon={<RotateCcw size={18} className="text-white" />} iconBg="bg-gradient-to-br from-rose-400 to-rose-600" title="Reset All Data" subtitle="Permanently delete everything and return to factory defaults" action={<button type="button" onClick={() => setShowResetConfirm(true)} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm">Reset</button>} />
                    </div>
                </motion.div>
            )}

            {/* ═══ ABOUT ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={7} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="px-5 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-2xl">P</span>
                        </div>
                        <div>
                            <p className="font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]">PRISM Instructor OS</p>
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">v2.1.0 • NITA‑compliant CBT Management</p>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                        {[
                            { label: 'Theme', value: preferences.theme, icon: Palette },
                            { label: 'Accent', value: preferences.accentColor, icon: Zap },
                            { label: 'AI', value: preferences.enableAI ? 'On' : 'Off', icon: Sparkles },
                        ].map((stat, i) => (
                            <div key={i} className="p-3 rounded-2xl bg-[var(--md-sys-color-surface-variant)] text-center">
                                <stat.icon size={14} className="mx-auto mb-1 text-[var(--md-sys-color-secondary)]" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--md-sys-color-secondary)]">{stat.label}</p>
                                <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] font-google capitalize">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-4 px-1">© 2025 PRISM. Built with ❤️ for instructors. All rights reserved.</p>
                </div>
            </motion.div>

            {/* ─── Reset Confirmation Modal ─── */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
                        <motion.div className="relative bg-[var(--md-sys-color-surface)] rounded-3xl shadow-2xl w-full max-w-sm p-6" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                            <div className="flex items-center gap-3 text-rose-600 mb-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center"><AlertTriangle size={20} /></div>
                                <h3 className="font-google font-bold text-lg">Reset All Data?</h3>
                            </div>
                            <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm mb-6 leading-relaxed">This will permanently delete all students, attendance records, and competency data. This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 rounded-2xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] font-bold text-sm hover:brightness-95 transition-all">Cancel</button>
                                <button type="button" onClick={handleReset} className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md">Reset All</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showUserManagement && <UserManagement onClose={() => setShowUserManagement(false)} />}
        </div>
    );
};

export default Settings;
