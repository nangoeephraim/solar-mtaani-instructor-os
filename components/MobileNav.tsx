import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, UserCheck, MoreHorizontal, BarChart3, LineChart, ClipboardCheck, Settings, Box, X, MessageSquare, Wallet, UsersRound } from 'lucide-react';
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

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
    const [showMore, setShowMore] = useState(false);
    const { user } = useAuth();
    const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;

    const primaryItems: { id: string; label: string; icon: any; minRole: UserRole }[] = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard, minRole: 'viewer' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, minRole: 'viewer' },
        { id: 'students-manage', label: 'Students', icon: Users, minRole: 'viewer' },
        { id: 'attendance', label: 'Attend', icon: UserCheck, minRole: 'viewer' },
    ];

    const moreItems: { id: string; label: string; icon: any; minRole: UserRole }[] = [
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
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden hide-on-keyboard"
                            onClick={() => setShowMore(false)}
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="fixed bottom-24 left-4 right-4 z-50 lg:hidden bg-[var(--glass-bg)] backdrop-blur-3xl rounded-3xl shadow-2xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden safe-area-bottom hide-on-keyboard"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-sys-color-outline)]">
                                <h3 className="text-sm font-google font-bold text-[var(--md-sys-color-on-surface)]">More</h3>
                                <button onClick={() => setShowMore(false)} title="Close menu" className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-variant)]">
                                    <X size={18} className="text-[var(--md-sys-color-secondary)]" />
                                </button>
                            </div>
                            <div className="p-2 grid grid-cols-3 gap-1">
                                {visibleMore.map((item) => {
                                    const isActive = currentView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleMoreNav(item.id)}
                                            className={clsx(
                                                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-all tap-target",
                                                isActive
                                                    ? "bg-[var(--md-sys-color-primary)] text-white shadow-md shadow-indigo-500/20"
                                                    : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                            )}
                                        >
                                            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                            <span className={clsx("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
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
                <div className="flex items-center justify-around px-2 py-2 bg-[var(--glass-bg)] backdrop-blur-[32px] rounded-full shadow-xl shadow-indigo-500/10 border border-[var(--md-sys-color-outline-variant)]">
                    {visiblePrimary.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
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
                            </button>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setShowMore(prev => !prev)}
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
                    </button>
                </div>
            </motion.nav>
        </>
    );
};

export default MobileNav;
