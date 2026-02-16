import React, { useState, useEffect, useRef } from 'react';
import { InstructorSettings, DEFAULT_SETTINGS, AppPreferences } from '../types';
import { getSettings, saveSettings, resetData, exportDataAsCSV, exportFullBackup, importFullBackup } from '../services/storageService';
import { useToast } from './Toast';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from './UserManagement';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings as SettingsIcon, User, Download, RotateCcw, Save,
    AlertTriangle, FileDown, Moon, Sun, Monitor, Palette, Sparkles,
    Bell, Upload, Database, Eye, Shield, LogOut, Users, ChevronRight,
    Laptop, Check, Info
} from 'lucide-react';
import clsx from 'clsx';

interface SettingsProps {
    onDataReset: () => void;
}

// Shared animation variants
const cardVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
    }),
};

// M3-style Toggle Switch
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; color?: string }> = ({
    checked, onChange, color = 'var(--accent-primary)'
}) => (
    <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-8 w-[52px] items-center rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ backgroundColor: checked ? color : 'var(--md-sys-color-outline)' }}
    >
        <motion.span
            className="inline-block h-6 w-6 rounded-full bg-white shadow-md"
            animate={{ x: checked ? 24 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
        {checked && (
            <Check size={12} className="absolute left-2 text-white" strokeWidth={3} />
        )}
    </button>
);

// Settings Row Component
const SettingsRow: React.FC<{
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle: string;
    action: React.ReactNode;
}> = ({ icon, iconBg, title, subtitle, action }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl transition-colors duration-200 hover:bg-[var(--md-sys-color-surface-variant)] group">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105", iconBg)}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] font-google">{title}</p>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="flex-shrink-0">{action}</div>
    </div>
);

// Section Header
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; iconColor: string }> = ({ icon, title, iconColor }) => (
    <div className="flex items-center gap-3 px-2 pt-2 pb-3">
        <span className={iconColor}>{icon}</span>
        <h3 className="font-google font-bold text-base text-[var(--md-sys-color-on-surface)]">{title}</h3>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ onDataReset }) => {
    const { preferences, settings, setPreference, setSetting, saveAllSettings } = useTheme();
    const { user, logout } = useAuth();
    const [localName, setLocalName] = useState(settings.name);
    const [localOrg, setLocalOrg] = useState(settings.organization);
    const [hasChanges, setHasChanges] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalName(settings.name);
        setLocalOrg(settings.organization);
    }, [settings.name, settings.organization]);

    const handleProfileChange = (field: 'name' | 'organization', value: string) => {
        if (field === 'name') setLocalName(value);
        else setLocalOrg(value);
        setHasChanges(true);
    };

    const handleSaveProfile = () => {
        setSetting('name', localName);
        setSetting('organization', localOrg);
        setHasChanges(false);
        showToast('Profile saved successfully!', 'success');
    };

    const handleExportCSV = () => {
        const csv = exportDataAsCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `prism_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Data exported successfully!', 'success');
    };

    const handleExportBackup = () => {
        const backup = exportFullBackup();
        const blob = new Blob([backup], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `prism_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Backup created successfully!', 'success');
    };

    const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const result = importFullBackup(content);
            if (result.success) {
                showToast('Backup restored! Reloading...', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(result.error || 'Failed to restore backup', 'error');
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

    const themeOptions = [
        { id: 'light' as const, label: 'Light', icon: Sun, desc: 'Always light' },
        { id: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Always dark' },
        { id: 'system' as const, label: 'System', icon: Laptop, desc: 'Match device' },
    ];

    const accentColors = [
        { id: 'blue' as const, label: 'Blue', hex: '#4285f4' },
        { id: 'orange' as const, label: 'Orange', hex: '#ea8600' },
        { id: 'green' as const, label: 'Green', hex: '#34a853' },
        { id: 'purple' as const, label: 'Purple', hex: '#9334e6' },
    ];

    return (
        <div className="max-w-2xl mx-auto pb-24 space-y-4">
            {/* ── Page Header ── */}
            <motion.div
                className="px-2 pt-2 pb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center">
                        <SettingsIcon size={20} className="text-[var(--md-sys-color-on-surface-variant)]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">Settings</h1>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">App preferences and data management</p>
                    </div>
                </div>
            </motion.div>

            {/* ── Account Card ── */}
            <motion.div
                className="glass-panel rounded-3xl overflow-hidden"
                custom={0}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
            >
                <div className="p-5 pb-4">
                    <SectionHeader icon={<Shield size={18} />} title="Account" iconColor="text-violet-500" />
                </div>

                {/* Current session */}
                <div className="px-5 pb-2">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-white font-black text-lg">{user?.name?.charAt(0).toUpperCase() || 'P'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate">{user?.name || 'Instructor'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    user?.role === 'admin' ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                                )}>
                                    {user?.role}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all text-[var(--md-sys-color-on-surface-variant)]"
                            title="Lock App"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Admin: user management */}
                {user?.role === 'admin' && (
                    <div className="px-5 pb-5 pt-1">
                        <button
                            onClick={() => setShowUserManagement(true)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0">
                                <Users size={18} className="text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold text-violet-900 dark:text-violet-200">Manage Users</p>
                                <p className="text-xs text-violet-600 dark:text-violet-400">Invites, roles, and access control</p>
                            </div>
                            <ChevronRight size={18} className="text-violet-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </motion.div>

            {/* ── Profile Card ── */}
            <motion.div
                className="glass-panel rounded-3xl overflow-hidden"
                custom={1}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
            >
                <div className="p-5 pb-4">
                    <SectionHeader icon={<User size={18} />} title="Profile" iconColor="text-orange-500" />
                </div>
                <div className="px-5 pb-5 space-y-4">
                    {/* Name input */}
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={localName}
                            onChange={(e) => handleProfileChange('name', e.target.value)}
                            placeholder="Your name"
                            className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all"
                        />
                    </div>
                    {/* Organization input */}
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                            Organization
                        </label>
                        <input
                            type="text"
                            value={localOrg}
                            onChange={(e) => handleProfileChange('organization', e.target.value)}
                            placeholder="Organization name"
                            className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border-2 border-transparent rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--accent-primary)] focus:bg-[var(--md-sys-color-surface)] transition-all"
                        />
                    </div>
                    {/* Save button */}
                    <AnimatePresence>
                        {hasChanges && (
                            <motion.button
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onClick={handleSaveProfile}
                                className="w-full py-3 bg-[var(--accent-primary)] text-white rounded-2xl font-google font-bold text-sm shadow-md hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={16} />
                                Save Changes
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ── Appearance Card ── */}
            <motion.div
                className="glass-panel rounded-3xl overflow-hidden"
                custom={2}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
            >
                <div className="p-5 pb-4">
                    <SectionHeader icon={<Palette size={18} />} title="Appearance" iconColor="text-purple-500" />
                </div>

                <div className="px-5 pb-5 space-y-6">
                    {/* Theme selector — pill style */}
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-3 px-1">Theme</label>
                        <div className="grid grid-cols-3 gap-2">
                            {themeOptions.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setPreference('theme', t.id)}
                                    className={clsx(
                                        "relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200",
                                        preferences.theme === t.id
                                            ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] shadow-sm"
                                            : "border-transparent bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                                    )}
                                >
                                    {preferences.theme === t.id && (
                                        <motion.div
                                            layoutId="themeCheck"
                                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center"
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        >
                                            <Check size={12} className="text-white" strokeWidth={3} />
                                        </motion.div>
                                    )}
                                    <t.icon size={22} className={preferences.theme === t.id ? "text-[var(--accent-primary)]" : "text-[var(--md-sys-color-on-surface-variant)]"} />
                                    <span className={clsx("text-xs font-bold", preferences.theme === t.id ? "text-[var(--accent-primary)]" : "text-[var(--md-sys-color-on-surface)]")}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accent color — large swatches */}
                    <div>
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-3 px-1">Accent Color</label>
                        <div className="flex gap-3">
                            {accentColors.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setPreference('accentColor', c.id)}
                                    className="relative flex flex-col items-center gap-2 group"
                                    title={c.label}
                                >
                                    <div className={clsx(
                                        "w-12 h-12 rounded-2xl transition-all duration-200 shadow-sm",
                                        preferences.accentColor === c.id ? "ring-2 ring-offset-2 ring-[var(--md-sys-color-on-surface)] scale-110" : "hover:scale-105"
                                    )} style={{ backgroundColor: c.hex }}>
                                        {preferences.accentColor === c.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-full h-full rounded-2xl flex items-center justify-center"
                                            >
                                                <Check size={18} className="text-white drop-shadow-md" strokeWidth={3} />
                                            </motion.div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)]">{c.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Features Card ── */}
            <motion.div
                className="glass-panel rounded-3xl overflow-hidden"
                custom={3}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
            >
                <div className="p-5 pb-2">
                    <SectionHeader icon={<Sparkles size={18} />} title="Features" iconColor="text-indigo-500" />
                </div>

                <div className="px-3 pb-3 divide-y divide-[var(--md-sys-color-outline)]">
                    <SettingsRow
                        icon={<Sparkles size={18} className="text-white" />}
                        iconBg="bg-gradient-to-br from-indigo-500 to-purple-600"
                        title="Smart AI Insights"
                        subtitle="Predictive analytics and data trends"
                        action={<ToggleSwitch checked={preferences.enableAI} onChange={(v) => setPreference('enableAI', v)} color="#6366f1" />}
                    />
                    <SettingsRow
                        icon={<Bell size={18} className="text-white" />}
                        iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
                        title="Notifications"
                        subtitle="Toast messages for actions"
                        action={<ToggleSwitch checked={preferences.notificationsEnabled} onChange={(v) => setPreference('notificationsEnabled', v)} color="#f59e0b" />}
                    />
                    <SettingsRow
                        icon={<Eye size={18} className="text-white" />}
                        iconBg="bg-gradient-to-br from-teal-400 to-emerald-600"
                        title="Reduced Motion"
                        subtitle="Disable animations for accessibility"
                        action={<ToggleSwitch checked={preferences.reducedMotion} onChange={(v) => setPreference('reducedMotion', v)} color="#14b8a6" />}
                    />
                </div>
            </motion.div>

            {/* ── Data Management Card ── */}
            <motion.div
                className="glass-panel rounded-3xl overflow-hidden"
                custom={4}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
            >
                <div className="p-5 pb-2">
                    <SectionHeader icon={<Database size={18} />} title="Data" iconColor="text-blue-500" />
                </div>

                <div className="px-3 pb-3 divide-y divide-[var(--md-sys-color-outline)]">
                    <SettingsRow
                        icon={<FileDown size={18} className="text-white" />}
                        iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
                        title="Export CSV"
                        subtitle="Download student data as spreadsheet"
                        action={
                            <button onClick={handleExportCSV} className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)]">
                                Export
                            </button>
                        }
                    />

                    {user?.role !== 'viewer' && (
                        <SettingsRow
                            icon={<Download size={18} className="text-white" />}
                            iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600"
                            title="Full Backup"
                            subtitle="Export all data + settings as JSON"
                            action={
                                <button onClick={handleExportBackup} className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)]">
                                    Backup
                                </button>
                            }
                        />
                    )}

                    {user?.role === 'admin' && (
                        <SettingsRow
                            icon={<Upload size={18} className="text-white" />}
                            iconBg="bg-gradient-to-br from-indigo-400 to-indigo-600"
                            title="Restore Backup"
                            subtitle="Import a previously saved backup file"
                            action={
                                <label className="px-4 py-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-xs font-bold hover:bg-[var(--md-sys-color-surface-1)] transition-colors border border-[var(--md-sys-color-outline)] cursor-pointer">
                                    Restore
                                    <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportBackup} />
                                </label>
                            }
                        />
                    )}
                </div>
            </motion.div>

            {/* ── Danger Zone ── */}
            {user?.role === 'admin' && (
                <motion.div
                    className="rounded-3xl overflow-hidden border-2 border-rose-200 dark:border-rose-800/50"
                    custom={5}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariant}
                >
                    <div className="p-5 pb-2">
                        <SectionHeader icon={<AlertTriangle size={18} />} title="Danger Zone" iconColor="text-rose-500" />
                    </div>
                    <div className="px-3 pb-3">
                        <SettingsRow
                            icon={<RotateCcw size={18} className="text-white" />}
                            iconBg="bg-gradient-to-br from-rose-400 to-rose-600"
                            title="Reset All Data"
                            subtitle="Delete everything and return to defaults"
                            action={
                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm"
                                >
                                    Reset
                                </button>
                            }
                        />
                    </div>
                </motion.div>
            )}

            {/* ── About ── */}
            <motion.div
                className="glass-panel rounded-3xl overflow-hidden"
                custom={6}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
            >
                <div className="px-5 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-indigo-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-xl">P</span>
                        </div>
                        <div>
                            <p className="font-google font-bold text-[var(--md-sys-color-on-surface)]">PRISM Instructor OS</p>
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">v2.1.0 • NITA‑compliant CBT management</p>
                        </div>
                    </div>
                    <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-4 px-1">© 2025 PRISM. All rights reserved.</p>
                </div>
            </motion.div>

            {/* ── Reset Confirmation Modal ── */}
            <AnimatePresence>
                {showResetConfirm && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
                        <motion.div
                            className="relative bg-[var(--md-sys-color-surface)] rounded-3xl shadow-2xl w-full max-w-sm p-6"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            <div className="flex items-center gap-3 text-rose-600 mb-4">
                                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="font-google font-bold text-lg">Reset All Data?</h3>
                            </div>
                            <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm mb-6 leading-relaxed">
                                This will permanently delete all students, attendance records, and competency data. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 py-3 rounded-2xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] font-bold text-sm hover:brightness-95 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors shadow-md"
                                >
                                    Reset All
                                </button>
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
