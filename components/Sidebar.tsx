import React from 'react';
import { LayoutDashboard, Calendar, Users, ClipboardCheck, Settings, BarChart3, UserCheck, LineChart, UserCircle } from 'lucide-react';
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
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 lg:w-72 flex flex-col h-full bg-white border-r border-gray-200 z-20">
      {/* Logo Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <motion.div
          className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <span className="text-white font-black text-lg">P</span>
        </motion.div>
        <div className="hidden lg:block">
          <h1 className="font-black text-xl text-gray-900 tracking-tight">PRISM</h1>
          <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Instructor OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item, index) => {
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={clsx(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group font-medium relative overflow-hidden",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              <motion.div
                whileHover={{ rotate: isActive ? 0 : 10 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={clsx(
                    "transition-colors",
                    isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                  )}
                />
              </motion.div>
              <span className="text-sm hidden lg:block tracking-wide">{item.label}</span>

              {/* Hover Glow Effect */}
              {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Status Footer */}
      <div className="p-4 mt-auto">
        <motion.div
          className="hidden lg:block bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm"
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
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">System Online</p>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            All data is locally synced.
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