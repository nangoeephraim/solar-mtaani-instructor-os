import React from 'react';
import { LayoutDashboard, Calendar, Users, ClipboardCheck, Settings, BarChart3, UserCheck, LineChart, Box } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'analytics', label: 'Overview Analytics', icon: BarChart3 },
    { id: 'schedule', label: 'Timetable', icon: Calendar },
    { id: 'students-manage', label: 'Students', icon: Users },
    { id: 'student-analytics', label: 'Student Insights', icon: LineChart },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'assessment', label: 'NITA Assessment', icon: ClipboardCheck },
    { id: 'resources', label: 'Resources', icon: Box },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="hidden lg:flex w-72 flex-col h-full border-r border-[var(--md-sys-color-outline)] z-20 safe-area-top" style={{ backgroundColor: 'color-mix(in srgb, var(--md-sys-color-surface) 85%, transparent)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
      {/* Logo Header */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--md-sys-color-outline)]">
        <motion.div
          className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-[var(--accent-primary)] to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <span className="text-white font-black text-lg">P</span>
        </motion.div>
        <div className="hidden lg:block">
          <h1 className="font-black text-xl text-[var(--md-sys-color-on-surface)] tracking-tight">PRISM</h1>
          <p className="text-[10px] font-bold tracking-widest text-[var(--md-sys-color-secondary)] uppercase">Instructor OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item, index) => {
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
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-full transition-all duration-300 group font-medium relative overflow-hidden tap-target mx-auto",
                isActive
                  ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-sm"
                  : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
              )}
            >
              <div className="relative z-10 flex items-center gap-4 w-full">
                {/* Active left-edge indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[var(--md-sys-color-primary)]"
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
                  "text-sm font-google tracking-wide transition-colors duration-300",
                  isActive ? "font-bold" : "font-medium"
                )}>{item.label}</span>
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
            PRISM v1.0.0
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