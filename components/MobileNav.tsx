import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Users, UserCheck, MoreHorizontal, BarChart3, LineChart, ClipboardCheck, Settings, Box, X, MessageSquare, Wallet, UsersRound, Grid, Compass } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface MobileNavProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

// Role hierarchy: admin > instructor > viewer
const ROLE_LEVEL: Record<string, number> = { admin: 3, instructor: 2, viewer: 1 };

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.05
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
            type: "spring", 
            stiffness: 300, 
            damping: 24 
        } 
    }
} as const;

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
    const [showMore, setShowMore] = useState(false);
    const [commsMobileView, setCommsMobileView] = useState<'list' | 'chat'>('list');
    const { user } = useAuth();
    const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;

    // Intercept back button to close More overlay
    useEffect(() => {
        const handleBackButton = (e: Event) => {
            if (showMore) {
                e.preventDefault();
                setShowMore(false);
            }
        };
        window.addEventListener('app-back-button', handleBackButton);
        return () => window.removeEventListener('app-back-button', handleBackButton);
    }, [showMore]);

    useEffect(() => {
        const handleViewChange = (e: Event) => {
            const customEvent = e as CustomEvent<'list' | 'chat'>;
            if (customEvent.detail === 'list' || customEvent.detail === 'chat') {
                setCommsMobileView(customEvent.detail);
            }
        };

        window.addEventListener('communications-mobile-view-change', handleViewChange);
        return () => {
            window.removeEventListener('communications-mobile-view-change', handleViewChange);
        };
    }, []);

    const triggerHaptics = () => {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate(15);
            } catch (e) {
                // Ignore vibration errors
            }
        }
    };

    // ── WhatsApp pattern: hide nav entirely when inside a full-screen chat/comms view ──
    // This prevents accidental tab switches while typing and maximises chat screen space.
    // Fixed lock loop bug: render a floating modern back/home chevron button to escape safely.
    if (currentView === 'communications' && commsMobileView === 'chat') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 50, x: '-50%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed bottom-6 left-1/2 z-50 lg:hidden hide-on-keyboard"
            >
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        triggerHaptics();
                        onNavigate('dashboard');
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--md-sys-color-primary)] text-white rounded-full shadow-lg shadow-indigo-500/20 font-google font-bold text-sm hover:scale-105 active:scale-95 transition-all tap-target-premium"
                    style={{ minHeight: '48px', minWidth: '150px' }}
                >
                    <LayoutDashboard size={18} strokeWidth={2.5} />
                    <span>Exit Chat</span>
                </motion.button>
            </motion.div>
        );
    }

    const primaryItems: { id: string; label: string; icon: any; minRole: UserRole }[] = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard, minRole: 'viewer' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, minRole: 'viewer' },
        { id: 'students-manage', label: 'Students', icon: Users, minRole: 'viewer' },
        { id: 'attendance', label: 'Attend', icon: UserCheck, minRole: 'viewer' },
    ];

    const moreItems: { id: string; label: string; icon: any; minRole: UserRole }[] = [
        { id: 'icon-gallery', label: 'Command Center', icon: Grid, minRole: 'viewer' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, minRole: 'admin' },
        { id: 'student-analytics', label: 'Student Insights', icon: LineChart, minRole: 'instructor' },
        { id: 'assessment', label: 'Assessment', icon: ClipboardCheck, minRole: 'instructor' },
        { id: 'resources', label: 'Resources', icon: Box, minRole: 'viewer' },
        { id: 'fees', label: 'Fees', icon: Wallet, minRole: 'admin' },
        { id: 'instructors', label: 'Instructors', icon: UsersRound, minRole: 'admin' },
        { id: 'communications', label: 'Communications', icon: MessageSquare, minRole: 'viewer' },
        { id: 'settings', label: 'Settings', icon: Settings, minRole: 'viewer' },
    ];

    // Filter by role
    const visiblePrimary = primaryItems.filter(item => userLevel >= (ROLE_LEVEL[item.minRole] || 1));
    const visibleMore = moreItems.filter(item => userLevel >= (ROLE_LEVEL[item.minRole] || 1));

    const isMoreActive = visibleMore.some(item => currentView === item.id);

    const handleMoreNav = (id: string) => {
        onNavigate(id);
        setShowMore(false);
    };

    return (
        <>
            {/* More overlay */}
            <AnimatePresence>
                {showMore && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40 lg:hidden hide-on-keyboard backdrop-blur-sm"
                            onClick={() => setShowMore(false)}
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                            className="fixed bottom-24 left-4 right-4 z-50 lg:hidden glass-glassmorphism rounded-[28px] shadow-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden safe-area-bottom hide-on-keyboard"
                        >
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--md-sys-color-outline)] bg-white/20 dark:bg-black/20">
                                <h3 className="text-sm font-google font-bold text-[var(--md-sys-color-on-surface)] tracking-wide">Command Center</h3>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        triggerHaptics();
                                        setShowMore(false);
                                    }}
                                    title="Close menu"
                                    className="p-1.5 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] transition-all tap-target-premium flex items-center justify-center"
                                >
                                    <X size={18} className="text-[var(--md-sys-color-secondary)]" />
                                </motion.button>
                            </div>
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="p-3 grid grid-cols-3 gap-2 bg-white/10 dark:bg-black/10"
                            >
                                {visibleMore.map((item) => {
                                    const isActive = currentView === item.id;
                                    return (
                                        <motion.button
                                            key={item.id}
                                            variants={itemVariants}
                                            whileTap={{ scale: 0.94 }}
                                            onClick={() => {
                                                triggerHaptics();
                                                handleMoreNav(item.id);
                                            }}
                                            className={clsx(
                                                "flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all tap-target-premium justify-center",
                                                isActive
                                                    ? "bg-[var(--md-sys-color-primary)] text-white shadow-lg shadow-indigo-500/20"
                                                    : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-white/25 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                            <span className={clsx("text-[10px] text-center tracking-tight", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom nav bar */}
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed bottom-4 left-4 right-4 z-50 lg:hidden safe-area-bottom hide-on-keyboard"
            >
                <div className="flex items-center justify-around px-2 py-2 bg-[var(--glass-bg)] backdrop-blur-md rounded-full shadow-xl shadow-indigo-500/10 border border-[var(--md-sys-color-outline-variant)]">
                    {visiblePrimary.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                key={item.id}
                                onClick={() => {
                                    triggerHaptics();
                                    onNavigate(item.id);
                                }}
                                className={clsx(
                                    "flex flex-col items-center justify-center gap-1 min-w-[64px] h-[54px] rounded-full transition-all tap-target relative z-10",
                                    isActive
                                        ? "text-[var(--md-sys-color-primary)]"
                                        : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActiveTab"
                                        className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/20 rounded-full -z-10"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <item.icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className="transition-colors"
                                />
                                <span className={clsx(
                                    "text-[10px] font-medium tracking-tight",
                                    isActive && "font-bold"
                                )}>
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}

                    {/* More Button */}
                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => {
                            triggerHaptics();
                            setShowMore(prev => !prev);
                        }}
                        className={clsx(
                            "flex flex-col items-center justify-center gap-1 min-w-[64px] h-[54px] rounded-full transition-all tap-target relative z-10",
                            isMoreActive || showMore
                                ? "text-[var(--md-sys-color-primary)]"
                                : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                        )}
                    >
                        {(isMoreActive && !showMore) && (
                            <motion.div
                                layoutId="mobileActiveTab"
                                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/20 rounded-full -z-10"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <MoreHorizontal
                            size={22}
                            strokeWidth={isMoreActive || showMore ? 2.5 : 2}
                        />
                        <span className={clsx(
                            "text-[10px] font-medium tracking-tight",
                            (isMoreActive || showMore) && "font-bold"
                        )}>
                            More
                        </span>
                    </motion.button>
                </div>
            </motion.nav>
        </>
    );
};

export default React.memo(MobileNav);
