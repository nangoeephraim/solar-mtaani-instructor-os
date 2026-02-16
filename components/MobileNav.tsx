import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, UserCheck, MoreHorizontal, BarChart3, LineChart, ClipboardCheck, Settings, Box, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavProps {
    currentView: string;
    onNavigate: (view: string) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
    const [showMore, setShowMore] = useState(false);

    const primaryItems = [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
        { id: 'students-manage', label: 'Students', icon: Users },
        { id: 'attendance', label: 'Attend', icon: UserCheck },
    ];

    const moreItems = [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'student-analytics', label: 'Student Insights', icon: LineChart },
        { id: 'assessment', label: 'Assessment', icon: ClipboardCheck },
        { id: 'resources', label: 'Resources', icon: Box },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    const isMoreActive = moreItems.some(item => currentView === item.id);

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
                            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                            onClick={() => setShowMore(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="fixed bottom-16 left-2 right-2 z-50 lg:hidden bg-[var(--md-sys-color-surface)] rounded-2xl shadow-xl border border-[var(--md-sys-color-outline)] overflow-hidden safe-area-bottom"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--md-sys-color-outline)]">
                                <h3 className="text-sm font-google font-bold text-[var(--md-sys-color-on-surface)]">More</h3>
                                <button onClick={() => setShowMore(false)} title="Close menu" className="p-1 rounded-full hover:bg-[var(--md-sys-color-surface-variant)]">
                                    <X size={18} className="text-[var(--md-sys-color-secondary)]" />
                                </button>
                            </div>
                            <div className="p-2 grid grid-cols-3 gap-1">
                                {moreItems.map((item) => {
                                    const isActive = currentView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleMoreNav(item.id)}
                                            className={clsx(
                                                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all tap-target",
                                                isActive
                                                    ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]"
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
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-[var(--md-sys-color-outline)] safe-area-bottom"
                style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface) 85%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
            >
                <div className="flex items-center justify-around px-2 py-1">
                    {primaryItems.map((item) => {
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={clsx(
                                    "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[64px] transition-all tap-target relative",
                                    isActive
                                        ? "text-[var(--md-sys-color-primary)]"
                                        : "text-[var(--md-sys-color-on-surface-variant)]"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="mobileActiveTab"
                                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--md-sys-color-primary)] rounded-full"
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <item.icon
                                    size={22}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={clsx(
                                        "transition-colors",
                                        isActive && "text-[var(--md-sys-color-primary)]"
                                    )}
                                />
                                <span className={clsx(
                                    "text-[10px] font-medium",
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
                            "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[64px] transition-all tap-target relative",
                            isMoreActive || showMore
                                ? "text-[var(--md-sys-color-primary)]"
                                : "text-[var(--md-sys-color-on-surface-variant)]"
                        )}
                    >
                        {(isMoreActive && !showMore) && (
                            <motion.div
                                layoutId="mobileActiveTab"
                                className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--md-sys-color-primary)] rounded-full"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <MoreHorizontal
                            size={22}
                            strokeWidth={isMoreActive || showMore ? 2.5 : 2}
                        />
                        <span className={clsx(
                            "text-[10px] font-medium",
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
