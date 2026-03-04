import React from 'react';
import { LayoutDashboard, Calendar, Users, ClipboardCheck, Settings, BarChart3, UserCheck, LineChart, Box, MessageSquare, Wallet, UsersRound } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { AppData, UserRole } from '../types';
import { getUnreadCount } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  data?: AppData;
}

// Role hierarchy: admin > instructor > viewer
const ROLE_LEVEL: Record<string, number> = { admin: 3, instructor: 2, viewer: 1 };

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, data }) => {
  const { user } = useAuth();
  const unreadCount = data && user ? (data.communications?.channels || []).reduce((sum, ch) => sum + getUnreadCount(data, ch.id, user.id || 'sys-user'), 0) : 0;
  const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;

  const navItems: { id: string; label: string; icon: any; minRole: UserRole }[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard, minRole: 'viewer' },
    { id: 'analytics', label: 'Overview Analytics', icon: BarChart3, minRole: 'admin' },
    { id: 'schedule', label: 'Timetable', icon: Calendar, minRole: 'viewer' },
    { id: 'students-manage', label: 'Students', icon: Users, minRole: 'viewer' },
    { id: 'student-analytics', label: 'Student Insights', icon: LineChart, minRole: 'instructor' },
    { id: 'attendance', label: 'Attendance', icon: UserCheck, minRole: 'viewer' },
    { id: 'assessment', label: 'NITA Assessment', icon: ClipboardCheck, minRole: 'instructor' },
    { id: 'resources', label: 'Resources', icon: Box, minRole: 'viewer' },
    { id: 'fees', label: 'Fee Management', icon: Wallet, minRole: 'admin' },
    { id: 'instructors', label: 'Instructors', icon: UsersRound, minRole: 'admin' },
    { id: 'communications', label: 'Communications', icon: MessageSquare, minRole: 'viewer' },
    { id: 'settings', label: 'Settings', icon: Settings, minRole: 'viewer' },
  ];

  // Filter nav items by role
  const visibleItems = navItems.filter(item => userLevel >= (ROLE_LEVEL[item.minRole] || 1));

  return (
    <div className="hidden lg:flex w-[260px] flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-3xl z-20 sidebar-glass shadow-lg border border-[var(--md-sys-color-outline-variant)] bg-[var(--glass-bg)] backdrop-blur-3xl overflow-hidden">
      {/* Logo Header */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--md-sys-color-outline)]">
        <motion.div
          className="w-16 h-12 flex-shrink-0 flex items-center justify-center p-1"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-sm" />
        </motion.div>
        <div className="hidden lg:block ml-1">
          <p className="text-[9px] font-bold tracking-[0.15em] text-[var(--md-sys-color-primary)] uppercase">Illuminating Learning</p>
        </div>
      </div>

      {/* Role badge */}
      {user && (
        <div className="px-4 pt-3 pb-1">
          <div className={clsx(
            "text-[9px] font-black tracking-[0.15em] uppercase text-center py-1 rounded-full",
            user.role === 'admin'
              ? "bg-violet-500/10 text-violet-700 dark:bg-violet-400/20 dark:text-violet-300"
              : user.role === 'instructor'
                ? "bg-blue-500/10 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300"
                : "bg-slate-500/10 text-slate-700 dark:bg-slate-400/20 dark:text-slate-300"
          )}>
            {user.role === 'admin' ? '🛡️ Administrator' : user.role === 'instructor' ? '📘 Instructor' : '👁️ Viewer'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 mt-2 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item, index) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group font-medium relative overflow-hidden tap-target mx-auto",
                isActive
                  ? "bg-[var(--md-sys-color-primary)] text-white shadow-md shadow-indigo-500/20"
                  : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              )}
            >
              <div className="relative z-10 flex items-center gap-4 w-full">
                {/* Active left-edge indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-white opacity-40"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon
                  size={24}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={clsx(
                    "transition-colors duration-300",
                    isActive ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-secondary)] group-hover:text-[var(--md-sys-color-on-surface)]"
                  )}
                />
                <span className={clsx(
                  "text-sm font-google tracking-wide transition-colors duration-300 flex-1",
                  isActive ? "font-bold" : "font-medium"
                )}>{item.label}</span>
                {item.id === 'communications' && unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center animate-pulse">{unreadCount}</span>
                )}
              </div>

              {/* Hover Glow Effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--md-sys-color-surface-variant)]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 mt-auto safe-area-bottom">
        <motion.div
          className="hidden lg:block bg-gradient-to-br from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] rounded-xl p-4 border border-[var(--md-sys-color-outline)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">System Online</p>
          </div>
          <p className="text-[10px] text-[var(--md-sys-color-secondary)] leading-relaxed">
            All data is locally synced.
          </p>
          <p className="text-[9px] text-[var(--md-sys-color-secondary)] mt-1 opacity-60">
            PRISM v2.0.0
          </p>
        </motion.div>
        <div className="lg:hidden flex justify-center py-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;