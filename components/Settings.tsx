import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { InstructorSettings, DEFAULT_SETTINGS, AppPreferences } from '../types';
import { getSettings, saveSettings, resetData, exportDataAsCSV, exportFullBackup, importFullBackup, reSeedWorkspaceData } from '../services/storageService';
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
    Zap, Activity, Camera, Phone, Building2, FileText, X, Trash2, BellRing,
    GraduationCap, School, BookOpen, Briefcase, Sliders, Plus, Award
} from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import clsx from 'clsx';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { uploadProfileAvatar, removeProfileAvatar, updateProfile, fetchProfile } from '../services/profileService';
import { notificationService } from '../services/notificationService';

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
    const [pendingNicheConfig, setPendingNicheConfig] = useState<string | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadLimitMB, setUploadLimitMB] = useLocalStorage<number>('admin_upload_limit_mb', 2);

    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [testNotificationDelay, setTestNotificationDelay] = useState<number>(3); // seconds
    const [isSchedulingTest, setIsSchedulingTest] = useState(false);

    // Sally Health Dashboard state
    const [sallyHealth, setSallyHealth] = useState<{
        activeProvider: string | null;
        cacheTtlSeconds: number;
        providers: Array<{ provider: string; lastSuccessAt?: string; lastFailureAt?: string; lastLatencyMs?: number; failures: number; lastError?: string }>;
        timestamp: string;
    } | null>(null);
    const [sallyHealthLoading, setSallyHealthLoading] = useState(false);
    const [sallyTestResult, setSallyTestResult] = useState<string | null>(null);

    const fetchSallyHealth = useCallback(async () => {
        setSallyHealthLoading(true);
        setSallyTestResult(null);
        try {
            const { getAuthHeaders: getHeaders } = await import('../services/authHeaders');
            const headers = await getHeaders();
            const res = await fetch('/api/ai/health', { headers });
            if (res.ok) {
                const data = await res.json();
                setSallyHealth(data);
            } else {
                setSallyTestResult(`Health check failed: ${res.status}`);
            }
        } catch (err: any) {
            setSallyTestResult(`Error: ${err.message}`);
        } finally {
            setSallyHealthLoading(false);
        }
    }, []);

    const testSally = useCallback(async () => {
        setSallyTestResult(null);
        setSallyHealthLoading(true);
        try {
            const { getAuthHeaders: getHeaders } = await import('../services/authHeaders');
            const headers = await getHeaders();
            const start = Date.now();
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
            });
            const elapsed = Date.now() - start;
            const provider = res.headers.get('X-Provider-Used') || 'unknown';
            const mode = res.headers.get('X-Sally-Mode') || 'unknown';
            if (res.ok) {
                setSallyTestResult(`✅ Provider: ${provider} | Mode: ${mode} | ${elapsed}ms`);
            } else {
                setSallyTestResult(`❌ Failed (${res.status}) — ${elapsed}ms`);
            }
            // Refresh health data after test
            await fetchSallyHealth();
        } catch (err: any) {
            setSallyTestResult(`❌ ${err.message}`);
        } finally {
            setSallyHealthLoading(false);
        }
    }, [fetchSallyHealth]);

    const [newSubjectInput, setNewSubjectInput] = useState('');

    const INSTITUTION_CONFIGS: Record<string, {
        assessmentSystem: 'CBET' | 'KNEC';
        selectedCurriculum: 'CBC' | 'KNEC' | 'TVET_CDACC' | 'NITA' | 'UNIVERSITY';
        customSubjects: string[];
        terminology: { cohortLabel: string; classLabel: string; periodLabel: string; };
        enabledFields: {
            nemisNumber: boolean;
            upi: boolean;
            nitaNumber: boolean;
            epraLicenseStatus: boolean;
            kcseGrade: boolean;
            kcpeMarks: boolean;
            nationalId: boolean;
            guardianDetails: boolean;
            admissionNumber: boolean;
        };
    }> = {
        primary: {
            assessmentSystem: 'CBET',
            selectedCurriculum: 'CBC',
            customSubjects: ['Mathematics', 'Science & Tech', 'Creative Arts', 'Agriculture & Nutrition'],
            terminology: { cohortLabel: 'Stream', classLabel: 'Grade', periodLabel: 'Term' },
            enabledFields: {
                nemisNumber: true,
                upi: true,
                nitaNumber: false,
                epraLicenseStatus: false,
                kcseGrade: false,
                kcpeMarks: false,
                nationalId: false,
                guardianDetails: true,
                admissionNumber: true,
            }
        },
        jss: {
            assessmentSystem: 'CBET',
            selectedCurriculum: 'CBC',
            customSubjects: ['Mathematics', 'Science & Tech', 'Creative Arts', 'Agriculture & Nutrition'],
            terminology: { cohortLabel: 'Stream', classLabel: 'Grade', periodLabel: 'Term' },
            enabledFields: {
                nemisNumber: true,
                upi: true,
                nitaNumber: false,
                epraLicenseStatus: false,
                kcseGrade: false,
                kcpeMarks: true,
                nationalId: false,
                guardianDetails: true,
                admissionNumber: true,
            }
        },
        highschool: {
            assessmentSystem: 'KNEC',
            selectedCurriculum: 'KNEC',
            customSubjects: ['Mathematics', 'English', 'Kiswahili', 'Chemistry', 'Physics', 'Biology', 'Business Studies'],
            terminology: { cohortLabel: 'Stream', classLabel: 'Form', periodLabel: 'Term' },
            enabledFields: {
                nemisNumber: true,
                upi: true,
                nitaNumber: false,
                epraLicenseStatus: false,
                kcseGrade: true,
                kcpeMarks: true,
                nationalId: false,
                guardianDetails: true,
                admissionNumber: true,
            }
        },
        tvet: {
            assessmentSystem: 'CBET',
            selectedCurriculum: 'TVET_CDACC',
            customSubjects: ['Solar PV Installation', 'ICT Support Basics', 'Electrical Wiring'],
            terminology: { cohortLabel: 'Lot', classLabel: 'Course', periodLabel: 'Module' },
            enabledFields: {
                nemisNumber: false,
                upi: false,
                nitaNumber: true,
                epraLicenseStatus: true,
                kcseGrade: true,
                kcpeMarks: false,
                nationalId: true,
                guardianDetails: true,
                admissionNumber: true,
            }
        },
        nita: {
            assessmentSystem: 'KNEC',
            selectedCurriculum: 'NITA',
            customSubjects: ['Solar PV Installer', 'Electrical Wireman'],
            terminology: { cohortLabel: 'Cohort', classLabel: 'Trade', periodLabel: 'Grade' },
            enabledFields: {
                nemisNumber: false,
                upi: false,
                nitaNumber: true,
                epraLicenseStatus: true,
                kcseGrade: true,
                kcpeMarks: false,
                nationalId: true,
                guardianDetails: true,
                admissionNumber: true,
            }
        },
        university: {
            assessmentSystem: 'KNEC',
            selectedCurriculum: 'UNIVERSITY',
            customSubjects: ['Computer Science', 'Business Administration', 'Mechanical Engineering', 'Medicine & Surgery'],
            terminology: { cohortLabel: 'Cohort', classLabel: 'Course', periodLabel: 'Semester' },
            enabledFields: {
                nemisNumber: false,
                upi: false,
                nitaNumber: false,
                epraLicenseStatus: false,
                kcseGrade: true,
                kcpeMarks: false,
                nationalId: true,
                guardianDetails: true,
                admissionNumber: true,
            }
        },
        custom: {
            assessmentSystem: 'CBET',
            selectedCurriculum: 'TVET_CDACC',
            customSubjects: ['Solar PV Installation', 'ICT Support Basics'],
            terminology: { cohortLabel: 'Cohort', classLabel: 'Class', periodLabel: 'Term' },
            enabledFields: {
                nemisNumber: true,
                upi: true,
                nitaNumber: true,
                epraLicenseStatus: true,
                kcseGrade: true,
                kcpeMarks: true,
                nationalId: true,
                guardianDetails: true,
                admissionNumber: true,
            }
        }
    };

    const handleConfigureInstitution = (type: string) => {
        setPendingNicheConfig(type);
    };

    const handleApplyNicheAndSeed = async (type: string, shouldSeed: boolean) => {
        const config = INSTITUTION_CONFIGS[type];
        if (!config) return;

        if (shouldSeed) {
            setIsSeeding(true);
            try {
                const success = await reSeedWorkspaceData(type);
                if (success) {
                    setPreference('institutionType', type as any);
                    setPreference('assessmentSystem', config.assessmentSystem);
                    setPreference('selectedCurriculum', config.selectedCurriculum);
                    setPreference('customSubjects', config.customSubjects);
                    setPreference('terminology', config.terminology);
                    setPreference('enabledFields', config.enabledFields);
                    setPreference('defaultSubject', config.customSubjects[0] || 'All');

                    showToast(`Workspace database successfully populated with ${type.toUpperCase()} mock data!`, 'success');
                    onDataReset();
                } else {
                    showToast('Failed to populate workspace with mock data. Standard applied only.', 'warning');
                    setPreference('institutionType', type as any);
                    setPreference('assessmentSystem', config.assessmentSystem);
                    setPreference('selectedCurriculum', config.selectedCurriculum);
                    setPreference('customSubjects', config.customSubjects);
                    setPreference('terminology', config.terminology);
                    setPreference('enabledFields', config.enabledFields);
                    setPreference('defaultSubject', config.customSubjects[0] || 'All');
                }
            } catch (err: any) {
                showToast(`Seeding failed: ${err.message}`, 'error');
            } finally {
                setIsSeeding(false);
                setPendingNicheConfig(null);
            }
        } else {
            setPreference('institutionType', type as any);
            setPreference('assessmentSystem', config.assessmentSystem);
            setPreference('selectedCurriculum', config.selectedCurriculum);
            setPreference('customSubjects', config.customSubjects);
            setPreference('terminology', config.terminology);
            setPreference('enabledFields', config.enabledFields);
            setPreference('defaultSubject', config.customSubjects[0] || 'All');

            showToast(`Workspace configured for ${type.toUpperCase()} standards!`, 'success');
            setPendingNicheConfig(null);
        }
    };

    const handleAddSubject = () => {
        const trimmed = newSubjectInput.trim();
        if (!trimmed) return;
        
        const currentSubjects = preferences.customSubjects || ['Solar', 'ICT'];
        if (currentSubjects.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) {
            showToast('Subject already exists', 'warning');
            return;
        }

        const updated = [...currentSubjects, trimmed];
        setPreference('customSubjects', updated);
        setNewSubjectInput('');
        showToast(`Subject "${trimmed}" added!`, 'success');
    };

    const handleRemoveSubject = (subToRemove: string) => {
        const currentSubjects = preferences.customSubjects || ['Solar', 'ICT'];
        if (currentSubjects.length <= 1) {
            showToast('Must have at least one subject', 'warning');
            return;
        }

        const updated = currentSubjects.filter(s => s !== subToRemove);
        setPreference('customSubjects', updated);
        
        // Adjust default focus if deleted
        if (preferences.defaultSubject === subToRemove) {
            setPreference('defaultSubject', updated[0]);
        }
        showToast(`Subject "${subToRemove}" removed!`, 'info');
    };

    const handleUpdateTerminology = (key: string, value: string) => {
        const currentTerminology = preferences.terminology || { cohortLabel: 'Lot', classLabel: 'Course', periodLabel: 'Module' };
        setPreference('terminology', {
            ...currentTerminology,
            [key]: value
        });
    };

    const handleToggleField = (fieldKey: string, isEnabled: boolean) => {
        const currentFields = preferences.enabledFields || {
            nemisNumber: false,
            upi: false,
            nitaNumber: true,
            epraLicenseStatus: true,
            kcseGrade: true,
            kcpeMarks: false,
            nationalId: true,
            guardianDetails: true,
            admissionNumber: true
        };
        setPreference('enabledFields', {
            ...currentFields,
            [fieldKey]: isEnabled
        });
    };

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const handleEnableNotifications = async () => {
        const granted = await notificationService.requestPermission();
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
        if (granted) {
            showToast('Notification permission granted!', 'success');
        } else {
            showToast('Notification permission denied. Please enable them in browser settings.', 'error');
        }
    };

    const handleSendTestNotification = () => {
        setIsSchedulingTest(true);
        const success = notificationService.scheduleTestNotification(
            'PRISM OS Class Alert 🔔',
            `This is a test PWA notification from PRISM OS! Scheduled for ${testNotificationDelay}s.`,
            testNotificationDelay * 1000
        );

        if (success) {
            showToast(`Test notification scheduled in ${testNotificationDelay}s. Lock your screen or minimize the app now!`, 'success');
        } else {
            // Fallback for non-SW or foreground notification
            setTimeout(() => {
                notificationService.showLocalNotification('PRISM OS Class Alert 🔔', {
                    body: `This is a foreground test notification since Service Worker is not active yet!`,
                });
                setIsSchedulingTest(false);
            }, testNotificationDelay * 1000);
            showToast(`Fallback test notification scheduled in ${testNotificationDelay}s.`, 'info');
        }
        
        setTimeout(() => {
            setIsSchedulingTest(false);
        }, testNotificationDelay * 1000 + 500);
    };

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
                            <input type="text" value={localName} onChange={e => { setLocalName(e.target.value); markChanged(); }} placeholder="Your name" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">Organization</label>
                            <input type="text" value={localOrg} onChange={e => { setLocalOrg(e.target.value); markChanged(); }} placeholder="Organization name" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                                <Phone size={11} className="inline mr-1 -mt-0.5" />Phone
                            </label>
                            <input type="tel" value={localPhone} onChange={e => { setLocalPhone(e.target.value); markChanged(); }} placeholder="+254 700 000000" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" />
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block mb-1.5 px-1">
                                <Building2 size={11} className="inline mr-1 -mt-0.5" />Department
                            </label>
                            <input type="text" value={localDepartment} onChange={e => { setLocalDepartment(e.target.value); markChanged(); }} placeholder="e.g. Solar Installation" className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google" />
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
                            className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google resize-none"
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

            {/* ═══ GENERALIZED INSTITUTION CONFIGURATOR ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden animate-fade-in" custom={2.5} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-2"><SectionHeader icon={<Building2 size={18} />} title="Institution Configurator" iconColor="text-emerald-500" badge="Kenyan Standards" /></div>
                <div className="px-5 pb-5 pt-1 space-y-6">
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                        Configure this workspace for your learning institution. Switching your niche adapts terminology, assessment models (CBET vs KNEC), subjects, and student profile fields.
                    </p>

                    {/* Curriculum Standard Selector */}
                    <div className="space-y-3 pb-4 border-b border-[var(--md-sys-color-outline-variant)]">
                        <label className="text-[11px] font-black text-[var(--md-sys-color-primary)] uppercase tracking-widest block px-1">Curriculum Standard</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                                { id: 'CBC', label: 'CBC Standard', desc: 'Competency Based' },
                                { id: 'KNEC', label: 'KNEC Standard', desc: 'Academic Exams' },
                                { id: 'TVET_CDACC', label: 'TVET CDACC', desc: 'Modular CBET' },
                                { id: 'NITA', label: 'NITA Standard', desc: 'Trade Testing' }
                            ].map(curr => {
                                const isSelected = preferences.selectedCurriculum === curr.id;
                                return (
                                    <button
                                        key={curr.id}
                                        type="button"
                                        onClick={() => {
                                            setPreference('selectedCurriculum', curr.id as any);
                                            // Auto-adjust assessment system
                                            if (curr.id === 'CBC' || curr.id === 'TVET_CDACC') {
                                                setPreference('assessmentSystem', 'CBET');
                                            } else {
                                                setPreference('assessmentSystem', 'KNEC');
                                            }
                                            showToast(`Curriculum standard set to ${curr.label}`, 'success');
                                        }}
                                        className={clsx(
                                            "flex flex-col items-center justify-center text-center p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none",
                                            isSelected
                                                ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-bold ring-1 ring-[var(--accent-primary)]"
                                                : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                                        )}
                                    >
                                        <span className="text-xs font-bold font-google">{curr.label}</span>
                                        <span className="text-[9px] mt-0.5 opacity-80">{curr.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Niche Selector Cards */}
                    <div className="space-y-3">
                        <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest block px-1">Choose Institution Niche</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { id: 'primary', label: 'Primary School (CBC)', desc: 'PP1 to Grade 6, CBC Competencies, NEMIS & UPI, Class/Stream terminology', icon: <School size={20} className="text-blue-500" /> },
                                { id: 'jss', label: 'Junior Secondary (JSS)', desc: 'Grade 7 to 9, CBC Competencies, KCPE Marks, Class/Stream terminology', icon: <BookOpen size={20} className="text-teal-500" /> },
                                { id: 'highschool', label: 'High School', desc: 'Form 1 to 4, KNEC Exam Grades, KCPE/KCSE Fields, Form/Stream terminology', icon: <GraduationCap size={20} className="text-purple-500" /> },
                                { id: 'tvet', label: 'TVET College', desc: 'KNQF Levels, CBET Competencies, NITA/EPRA/National ID, Course/Lot terminology', icon: <Briefcase size={20} className="text-orange-500" /> },
                                { id: 'nita', label: 'Industrial Training (NITA)', desc: 'Industrial Trades, Practical/Theory %, NITA/EPRA/National ID, Trade/Cohort terminology', icon: <Building2 size={20} className="text-indigo-500" /> },
                                { id: 'university', label: 'University / Higher Ed', desc: 'Degree Courses, Semesters, Admission Numbers, KCSE Grade, Course/Cohort terminology', icon: <Award size={20} className="text-red-500" /> },
                                { id: 'custom', label: 'Custom / Generic', desc: 'Fully customizable trade school, custom subjects, and field toggles', icon: <Sliders size={20} className="text-pink-500" /> },
                            ].map(niche => {
                                const isSelected = preferences.institutionType === niche.id;
                                return (
                                    <button
                                        key={niche.id}
                                        type="button"
                                        onClick={() => handleConfigureInstitution(niche.id)}
                                        className={clsx(
                                            "flex flex-col text-left p-4 rounded-2xl border transition-all duration-300 relative group cursor-pointer h-full select-none justify-between",
                                            isSelected
                                                ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.15)] ring-1 ring-[var(--accent-primary)]"
                                                : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)] hover:border-[var(--md-sys-color-outline)]"
                                        )}
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="p-2 rounded-xl bg-[var(--md-sys-color-surface-1)] border border-[var(--md-sys-color-outline-variant)] group-hover:scale-110 transition-transform duration-200">
                                                    {niche.icon}
                                                </div>
                                                {isSelected && (
                                                    <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center animate-scale-in">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={clsx("text-xs font-bold font-google", isSelected ? "text-[var(--md-sys-color-primary)] font-black" : "text-[var(--md-sys-color-on-surface)]")}>
                                                    {niche.label}
                                                </h4>
                                                <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mt-1 leading-relaxed">
                                                    {niche.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                        {/* Terminology Overrides */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                                <Sliders size={14} /> Terminology Overrides
                            </h4>
                            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                                Customize the names used for cohorts, groups, and academic sessions.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">Cohort (e.g. Lot, Stream)</label>
                                    <input
                                        type="text"
                                        value={preferences.terminology?.cohortLabel || ''}
                                        onChange={e => handleUpdateTerminology('cohortLabel', e.target.value)}
                                        placeholder="e.g. Lot"
                                        className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">Class (e.g. Grade, Form)</label>
                                    <input
                                        type="text"
                                        value={preferences.terminology?.classLabel || ''}
                                        onChange={e => handleUpdateTerminology('classLabel', e.target.value)}
                                        placeholder="e.g. Course"
                                        className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-1">Period (e.g. Term, Semester)</label>
                                    <input
                                        type="text"
                                        value={preferences.terminology?.periodLabel || ''}
                                        onChange={e => handleUpdateTerminology('periodLabel', e.target.value)}
                                        placeholder="e.g. Module"
                                        className="w-full px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Subjects Manager */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={14} /> Dynamic Subjects / Units
                            </h4>
                            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                                Manage the courses or subjects available in your school system.
                            </p>
                            
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-[var(--md-sys-color-outline-variant)] rounded-xl bg-[var(--md-sys-color-surface-variant)]">
                                {(preferences.customSubjects || ['Solar', 'ICT']).map((sub) => (
                                    <span
                                        key={sub}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline-variant)] hover:scale-105 transition-transform duration-150"
                                    >
                                        {sub}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSubject(sub)}
                                            className="text-[var(--md-sys-color-primary)] hover:text-red-500 transition-colors cursor-pointer"
                                        >
                                            <X size={10} strokeWidth={3} />
                                        </button>
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubjectInput}
                                    onChange={e => setNewSubjectInput(e.target.value)}
                                    placeholder="Add new subject name..."
                                    onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                                    className="flex-1 px-3 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSubject}
                                    className="px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm"
                                >
                                    <Plus size={14} /> Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Student Form Profile Fields toggling */}
                    <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-3">
                        <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                            <Sliders size={14} /> Student Profile Field Controls
                        </h4>
                        <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                            Configure which input fields are visible on the student registry registration and edit forms.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 px-1">
                            {[
                                { key: 'admissionNumber', label: 'Admission Number' },
                                { key: 'nemisNumber', label: 'NEMIS ID' },
                                { key: 'upi', label: 'UPI (Unique Personal Identifier)' },
                                { key: 'nationalId', label: 'National ID / Alien ID' },
                                { key: 'nitaNumber', label: 'NITA Registration No' },
                                { key: 'epraLicenseStatus', label: 'EPRA License Status' },
                                { key: 'kcseGrade', label: 'KCSE Mean Grade' },
                                { key: 'kcpeMarks', label: 'KCPE Marks' },
                                { key: 'guardianDetails', label: 'Guardian Details' }
                            ].map(field => {
                                const currentFields = preferences.enabledFields || {
                                    nemisNumber: false,
                                    upi: false,
                                    nitaNumber: true,
                                    epraLicenseStatus: true,
                                    kcseGrade: true,
                                    kcpeMarks: false,
                                    nationalId: true,
                                    guardianDetails: true,
                                    admissionNumber: true
                                };
                                const isChecked = !!(currentFields as any)[field.key];
                                return (
                                    <div key={field.key} className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)] transition-colors">
                                        <span className="text-xs text-[var(--md-sys-color-on-surface)] font-medium pl-1">{field.label}</span>
                                        <ToggleSwitch
                                            checked={isChecked}
                                            onChange={v => handleToggleField(field.key, v)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-4">
                        <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={14} /> Regional Localization
                        </h4>
                        
                        <div className="space-y-4">
                            {/* Center Select */}
                            <div>
                                <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-2 px-1">Training Center / Branch</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {['Main Campus', 'West Campus', 'East Campus', 'Other'].map(center => {
                                        const isSelected = (preferences.institutionBranch === center) || 
                                                           (center === 'Other' && !['Main Campus', 'West Campus', 'East Campus'].includes(preferences.institutionBranch || ''));
                                        return (
                                            <button
                                                key={center}
                                                type="button"
                                                onClick={() => {
                                                    if (center !== 'Other') {
                                                        setPreference('institutionBranch', center);
                                                    } else {
                                                        setPreference('institutionBranch', ''); // Clear to prompt custom input
                                                    }
                                                }}
                                                className={clsx(
                                                    "py-2 px-3 rounded-xl border text-xs font-bold font-google transition-all tap-target-premium cursor-pointer",
                                                    isSelected
                                                        ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-black animate-scale-in"
                                                        : "border-transparent bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                                                )}
                                            >
                                                {center}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Custom Center Input */}
                                {!['Main Campus', 'West Campus', 'East Campus'].includes(preferences.institutionBranch || '') && (
                                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                                        <input
                                            type="text"
                                            value={preferences.institutionBranch || ''}
                                            onChange={e => setPreference('institutionBranch', e.target.value)}
                                            placeholder="Enter custom center name (e.g. Campus Location, Branch City)"
                                            className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-medium text-[var(--md-sys-color-on-surface)] focus:outline-none input-glow transition-all font-google animate-fade-in"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Default Subject Focus */}
                            <div>
                                <label className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase block mb-2 px-1">Default Subject Focus</label>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPreference('defaultSubject', 'All')}
                                        className={clsx(
                                            "py-2 px-3 rounded-xl border text-xs font-bold font-google transition-all tap-target-premium cursor-pointer",
                                            (preferences.defaultSubject === 'All' || !preferences.defaultSubject)
                                                ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-black"
                                                : "border-transparent bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                                        )}
                                    >
                                        All Subjects
                                    </button>
                                    {(preferences.customSubjects || ['Solar', 'ICT']).map(sub => {
                                        const isSelected = preferences.defaultSubject === sub;
                                        return (
                                            <button
                                                key={sub}
                                                type="button"
                                                onClick={() => setPreference('defaultSubject', sub)}
                                                className={clsx(
                                                    "py-2 px-3 rounded-xl border text-xs font-bold font-google transition-all tap-target-premium cursor-pointer",
                                                    isSelected
                                                        ? "border-[var(--accent-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] font-black"
                                                        : "border-transparent bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-1)]"
                                                )}
                                            >
                                                {sub}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Swahili Greetings toggle */}
                            <div className="pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
                                <SettingsRow
                                    icon={<Sparkles size={18} className="text-white" />}
                                    iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
                                    title="Swahili Localization & Greetings"
                                    subtitle="Use localized greetings and Swahili phrases in banners"
                                    action={
                                        <ToggleSwitch
                                            checked={preferences.enableSwahiliGreeting ?? true}
                                            onChange={v => setPreference('enableSwahiliGreeting', v)}
                                        />
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══ SALLY AI HEALTH ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={2.8} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-2"><SectionHeader icon={<Activity size={18} />} title="Sally AI Health" iconColor="text-cyan-500" badge="Live" /></div>
                <div className="px-5 pb-5 pt-1 space-y-3">
                    {!sallyHealth && !sallyHealthLoading && (
                        <button
                            onClick={fetchSallyHealth}
                            className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 hover:border-cyan-400/40 transition-all duration-200"
                        >
                            Load Provider Status
                        </button>
                    )}
                    {sallyHealthLoading && (
                        <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
                            <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            Checking Sally...
                        </div>
                    )}
                    {sallyHealth && (
                        <>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface-variant)]/50">
                                <div className={clsx("w-2.5 h-2.5 rounded-full", sallyHealth.activeProvider ? "bg-emerald-400 shadow-emerald-400/40 shadow-lg" : "bg-red-400 shadow-red-400/40 shadow-lg")} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                                        {sallyHealth.activeProvider ? `Active: ${sallyHealth.activeProvider.toUpperCase()}` : 'No active provider'}
                                    </p>
                                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                                        Cache TTL: {sallyHealth.cacheTtlSeconds}s
                                    </p>
                                </div>
                            </div>
                            {sallyHealth.providers.length > 0 && (
                                <div className="space-y-1.5">
                                    {sallyHealth.providers.map((p) => (
                                        <div key={p.provider} className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-[11px] bg-[var(--md-sys-color-surface-variant)]/30">
                                            <span className={clsx("w-1.5 h-1.5 rounded-full flex-shrink-0", p.lastSuccessAt && !p.lastFailureAt ? "bg-emerald-400" : p.failures > 0 ? "bg-amber-400" : "bg-slate-500")} />
                                            <span className="font-bold text-[var(--md-sys-color-on-surface)] uppercase min-w-[70px]">{p.provider}</span>
                                            {p.lastLatencyMs != null && <span className="text-slate-400 font-mono">{p.lastLatencyMs}ms</span>}
                                            {p.failures > 0 && <span className="text-amber-400 ml-auto">{p.failures} fail{p.failures > 1 ? 's' : ''}</span>}
                                            {p.lastError && <span className="text-red-400 text-[9px] truncate max-w-[120px] ml-auto" title={p.lastError}>{p.lastError}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    {sallyTestResult && (
                        <div className="p-2.5 rounded-xl bg-slate-900/50 text-xs font-mono text-slate-300 border border-white/5">
                            {sallyTestResult}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={testSally}
                            disabled={sallyHealthLoading}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 text-violet-400 hover:border-violet-400/40 transition-all duration-200 disabled:opacity-50"
                        >
                            <Zap className="w-3 h-3 inline mr-1" /> Test Sally
                        </button>
                        {sallyHealth && (
                            <button
                                onClick={fetchSallyHealth}
                                disabled={sallyHealthLoading}
                                className="px-3 py-2 rounded-xl text-xs font-bold bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]/80 transition-all duration-200 disabled:opacity-50"
                            >
                                Refresh
                            </button>
                        )}
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

            {/* ═══ PWA & MOBILE PUSH NOTIFICATIONS ═══ */}
            <motion.div className="glass-panel rounded-3xl overflow-hidden" custom={3.5} initial="hidden" animate="visible" variants={cardVariant}>
                <div className="p-5 pb-2"><SectionHeader icon={<BellRing size={18} />} title="PWA & Mobile Push Notifications" iconColor="text-pink-500" /></div>
                <div className="px-5 pb-5 pt-1 space-y-4">
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                        Enable native phone notifications from the PRISM Web App. This allows you to receive instant local schedule reminders, M-Pesa STK payment statuses, and chat alerts even when the app is minimized or the screen is locked.
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)] gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Permission Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx(
                                    "h-2 w-2 rounded-full",
                                    permissionStatus === 'granted' ? "bg-emerald-500 animate-pulse" : permissionStatus === 'denied' ? "bg-rose-500" : "bg-amber-500"
                                )} />
                                <span className="text-sm font-google font-bold capitalize text-[var(--md-sys-color-on-surface)]">
                                    {permissionStatus === 'default' ? 'Not Requested (Default)' : permissionStatus}
                                </span>
                            </div>
                        </div>

                        {permissionStatus !== 'granted' && (
                            <button
                                type="button"
                                onClick={handleEnableNotifications}
                                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white rounded-xl text-xs font-google font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                            >
                                Enable Notifications
                            </button>
                        )}
                    </div>

                    {permissionStatus === 'granted' && (
                        <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                                <p className="text-xs font-google font-bold text-indigo-600 dark:text-indigo-400">Background Delayed Test Alert</p>
                            </div>
                            <p className="text-[11px] text-[var(--md-sys-color-secondary)] leading-relaxed">
                                Schedule a mock notification, lock your screen or put the app in the background, and verify that the notification arrives natively on your device.
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                <div className="flex items-center gap-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl px-3 py-1.5 input-glow transition-shadow">
                                    <span className="text-xs font-medium text-[var(--md-sys-color-secondary)]">Delay:</span>
                                    <input 
                                        type="number" 
                                        min="1" max="60" 
                                        value={testNotificationDelay} 
                                        onChange={e => setTestNotificationDelay(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-12 bg-transparent text-center text-xs font-bold text-[var(--md-sys-color-on-surface)] focus:outline-none"
                                    />
                                    <span className="text-xs font-medium text-[var(--md-sys-color-secondary)]">sec</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSendTestNotification}
                                    disabled={isSchedulingTest}
                                    className="flex-1 min-w-[140px] py-2 px-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-xs font-google font-bold shadow-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                                >
                                    {isSchedulingTest ? (
                                        <>Scheduling...</>
                                    ) : (
                                        <><Bell size={13} /> Test Notification</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
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

            {/* ─── Modals ─── */}
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

                {pendingNicheConfig && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isSeeding && setPendingNicheConfig(null)} />
                        <motion.div className="relative bg-[var(--md-sys-color-surface)] rounded-3xl shadow-2xl w-full max-w-md p-6" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                            <div className="flex items-center gap-3 text-[var(--accent-primary)] mb-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center"><Award size={20} /></div>
                                <h3 className="font-google font-bold text-lg">Configure Standard</h3>
                            </div>
                            <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm mb-6 leading-relaxed">
                                Would you like to clear the workspace database and seed it with realistic <strong>{pendingNicheConfig.toUpperCase()}</strong> mock data (students, classes, and payment records)?
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    disabled={isSeeding}
                                    onClick={() => handleApplyNicheAndSeed(pendingNicheConfig, true)}
                                    className="w-full py-3 rounded-2xl bg-[var(--accent-primary)] text-white font-bold text-sm hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSeeding ? 'Populating Workspace...' : 'Populate Workspace'}
                                </button>
                                <button
                                    type="button"
                                    disabled={isSeeding}
                                    onClick={() => handleApplyNicheAndSeed(pendingNicheConfig, false)}
                                    className="w-full py-3 rounded-2xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] font-bold text-sm hover:brightness-95 transition-all"
                                >
                                    Apply Configuration Standard Only
                                </button>
                                <button
                                    type="button"
                                    disabled={isSeeding}
                                    onClick={() => setPendingNicheConfig(null)}
                                    className="w-full py-2.5 rounded-xl border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors mt-2"
                                >
                                    Cancel
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
