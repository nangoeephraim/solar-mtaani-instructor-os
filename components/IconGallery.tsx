import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Users, UserCheck, BarChart3, LineChart,
  ClipboardCheck, Box, Wallet, UsersRound, MessageSquare, Settings,
  Compass, ArrowRight, Sparkles, Search, Send, RefreshCw, Radio, Grid, X, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { addChatMessage } from '../services/storageService';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';
import { AppData } from '../types';
import clsx from 'clsx';

interface IconGalleryProps {
  onNavigate: (view: string) => void;
  data?: AppData | null;
  setData?: React.Dispatch<React.SetStateAction<AppData | null>>;
}

const ROLE_LEVEL: Record<string, number> = { admin: 3, instructor: 2, viewer: 1 };

const IconGallery: React.FC<IconGalleryProps> = ({ onNavigate, data = null, setData }) => {
  const { user } = useAuth();
  const { preferences } = useTheme();
  const { showToast } = useToast();
  const userLevel = ROLE_LEVEL[user?.role || 'viewer'] || 1;

  // --- Search and Filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Core' | 'Analytics' | 'Utilities'>('All');

  // --- Quick Actions States ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLatency, setSyncLatency] = useState<number | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'general' | 'announcements'>('announcements');
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Modules catalog specification
  const features = [
    {
      id: 'dashboard',
      label: 'Home & Dashboard',
      description: 'Overview of student tallies, attendance charts, and quick-action alerts.',
      icon: LayoutDashboard,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      borderGlow: 'rgba(59, 130, 246, 0.45)',
      minRole: 'viewer',
      category: 'Core',
    },
    {
      id: 'schedule',
      label: 'Schedule & Timetable',
      description: 'Coordinate class sessions, manage calendars, and track lesson status.',
      icon: Calendar,
      gradient: 'from-purple-500/20 to-pink-500/20',
      borderGlow: 'rgba(168, 85, 247, 0.45)',
      minRole: 'viewer',
      category: 'Core',
    },
    {
      id: 'students-manage',
      label: 'Student Directory',
      description: 'Rosters of active student profiles, contacts, and custom details.',
      icon: Users,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      borderGlow: 'rgba(16, 185, 129, 0.45)',
      minRole: 'viewer',
      category: 'Core',
    },
    {
      id: 'attendance',
      label: 'Attendance Register',
      description: 'Log daily class status, verify sessions, and view history registers.',
      icon: UserCheck,
      gradient: 'from-amber-500/20 to-orange-500/20',
      borderGlow: 'rgba(245, 158, 11, 0.45)',
      minRole: 'viewer',
      category: 'Core',
    },
    {
      id: 'student-analytics',
      label: 'Student Insights',
      description: 'Explore individual academic trajectories, trends, and progress charts.',
      icon: LineChart,
      gradient: 'from-cyan-500/20 to-blue-500/20',
      borderGlow: 'rgba(6, 182, 212, 0.45)',
      minRole: 'instructor',
      category: 'Analytics',
    },
    {
      id: 'assessment',
      label: 'Grades & Assessments',
      description: 'Log marks, calculate averages, and generate student report cards.',
      icon: ClipboardCheck,
      gradient: 'from-violet-500/20 to-fuchsia-500/20',
      borderGlow: 'rgba(139, 92, 246, 0.45)',
      minRole: 'instructor',
      category: 'Analytics',
    },
    {
      id: 'analytics',
      label: 'System Analytics',
      description: 'Comprehensive data on payments, attendance distributions, and metrics.',
      icon: BarChart3,
      gradient: 'from-rose-500/20 to-red-500/20',
      borderGlow: 'rgba(244, 63, 94, 0.45)',
      minRole: 'admin',
      category: 'Analytics',
    },
    {
      id: 'resources',
      label: 'Document Repository',
      description: 'Class reference guides, library files, and syllabus worksheets.',
      icon: Box,
      gradient: 'from-sky-500/20 to-indigo-500/20',
      borderGlow: 'rgba(14, 165, 233, 0.45)',
      minRole: 'viewer',
      category: 'Utilities',
    },
    {
      id: 'fees',
      label: 'Financials & Fees',
      description: 'Track outstanding balances, audit records, and initiate M-Pesa STK push.',
      icon: Wallet,
      gradient: 'from-green-500/20 to-emerald-500/20',
      borderGlow: 'rgba(34, 197, 94, 0.45)',
      minRole: 'admin',
      category: 'Utilities',
    },
    {
      id: 'instructors',
      label: 'Instructor Directory',
      description: 'Manage staff credentials, assigned classes, and administrative access.',
      icon: UsersRound,
      gradient: 'from-teal-500/20 to-sky-500/20',
      borderGlow: 'rgba(20, 184, 166, 0.45)',
      minRole: 'admin',
      category: 'Utilities',
    },
    {
      id: 'communications',
      label: 'Communications',
      description: 'Real-time instructor messaging, chat rooms, and automated notifications.',
      icon: MessageSquare,
      gradient: 'from-indigo-500/20 to-purple-500/20',
      borderGlow: 'rgba(99, 102, 241, 0.45)',
      minRole: 'viewer',
      category: 'Utilities',
    },
    {
      id: 'settings',
      label: 'System Settings',
      description: 'Configure PWA Push Notifications, toggle Dark Mode, and monitor Supabase sync.',
      icon: Settings,
      gradient: 'from-slate-500/20 to-zinc-500/20',
      borderGlow: 'rgba(100, 116, 139, 0.45)',
      minRole: 'viewer',
      category: 'Utilities',
    }
  ];

  // Filtering modules
  const authorizedFeatures = useMemo(() => {
    return features.filter(f => userLevel >= (ROLE_LEVEL[f.minRole] || 1));
  }, [userLevel]);

  const filteredFeatures = useMemo(() => {
    return authorizedFeatures.filter(f => {
      const matchSearch = f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = activeCategory === 'All' || f.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [authorizedFeatures, searchQuery, activeCategory]);

  // --- Quick actions triggers ---
  const handleDatabaseSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncLatency(null);
    const start = Date.now();
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
      if (error) throw error;
      const latency = Date.now() - start;
      setSyncLatency(latency);
      showToast(`Database synced! Latency: ${latency}ms`, 'success');
    } catch (e) {
      showToast('Database offline or sync failed.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTriggerOptimizer = () => {
    localStorage.setItem('prism_pending_optimize', 'true');
    showToast('Launching Auto-Optimizer. Opening schedule...', 'info');
    setTimeout(() => {
      onNavigate('schedule');
    }, 800);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsBroadcasting(true);
    try {
      const channels = data?.communications?.channels || [];
      let targetChannel = channels.find(c => c.name.toLowerCase() === broadcastTarget);
      if (!targetChannel && channels.length > 0) {
        targetChannel = channels[0];
      }
      
      if (!targetChannel) {
        throw new Error("No messaging channel found to broadcast.");
      }

      if (setData && data) {
        const payload = {
          id: 'broadcast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          channelId: targetChannel.id,
          senderId: user?.id || 'sys-broadcast',
          senderName: user?.name || 'System Administrator',
          senderRole: user?.role || 'admin',
          content: `📢 [BROADCAST] ${broadcastText}`,
        };

        const updatedData = await addChatMessage(data, payload);
        setData(updatedData);
        showToast(`Broadcast sent to #${targetChannel.name}!`, 'success');
        setBroadcastText('');
        setShowBroadcastModal(false);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to dispatch broadcast.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1200px] mx-auto p-2 sm:p-4 text-[var(--md-sys-color-on-surface)] flex-1 overflow-y-auto custom-scrollbar pb-28 md:pb-8">
      
      {/* Banner Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glassmorphic-card-premium p-6 rounded-[28px] overflow-hidden bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-white/10 shadow-lg relative"
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[9px] uppercase tracking-widest font-black rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Sparkles size={10} className="text-indigo-400" /> Control Hub
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
              Command Center
            </h1>
            <p className="text-xs sm:text-sm text-[var(--md-sys-color-secondary)] mt-1 max-w-xl font-medium">
              Futuristic module control room mapping all systems. Filter features, trigger optimization, or manage database sync.
            </p>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/5 dark:bg-black/20 rounded-2xl border border-white/5 self-start sm:self-auto shadow-inner">
            <Compass className="text-indigo-500 animate-spin" style={{ animationDuration: '30s' }} size={22} />
            <div className="text-left">
              <p className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Active Role</p>
              <p className="text-xs font-black text-[var(--md-sys-color-on-surface)] uppercase">{user?.role || 'Viewer'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Directory Controls: Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--glass-bg)] backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-sm">
        {/* Search bar */}
        <div className="relative w-full sm:max-w-xs flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search directory..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/10 dark:bg-slate-950/20 border border-white/5 rounded-2xl text-xs font-google text-[var(--md-sys-color-on-surface)] placeholder-slate-400 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex bg-slate-900/10 dark:bg-slate-950/25 p-1 rounded-2xl border border-white/5 w-full sm:w-auto">
          {(['All', 'Core', 'Analytics', 'Utilities'] as const).map(cat => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all relative font-google",
                  isSelected 
                    ? "bg-slate-900/30 dark:bg-white/5 text-indigo-500 dark:text-indigo-400 shadow-sm border border-white/5 font-extrabold"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modules Grid */}
      <AnimatePresence mode="wait">
        {filteredFeatures.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 text-center bg-[var(--glass-bg)] border border-white/5 rounded-[28px]"
          >
            <Grid size={40} className="mx-auto text-slate-500 opacity-20 mb-3" />
            <p className="text-sm font-google font-bold text-slate-400">No modules match your selection</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters or keywords</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredFeatures.map(item => {
              const IconComponent = item.icon;
              return (
                <motion.div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="group relative cursor-pointer overflow-hidden rounded-[24px] p-5 border border-white/5 bg-slate-900/10 dark:bg-slate-950/20 backdrop-blur-md shadow-sm hover:shadow-xl transition-all duration-300 hover:border-white/10 flex flex-col justify-between"
                  style={{ minHeight: '150px' }}
                  whileHover={{ y: -4 }}
                >
                  <div className={clsx(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10",
                    item.gradient
                  )} />

                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div
                        className="p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 flex items-center justify-center bg-white/5 dark:bg-black/30 border border-white/5"
                        style={{ boxShadow: `0 0 15px -3px ${item.borderGlow}` }}
                      >
                        <IconComponent className="text-indigo-400 group-hover:text-white transition-colors" size={20} />
                      </div>
                      <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 text-indigo-400 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight size={16} />
                      </span>
                    </div>

                    <h3 className="font-google font-extrabold text-xs text-[var(--md-sys-color-on-surface)] group-hover:text-indigo-400 transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-400 uppercase tracking-widest">
                      {item.id.replace('-manage', '')}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYSTEM QUICK ACTIONS DECK */}
      <div className="flex flex-col gap-4 bg-[var(--glass-bg)] backdrop-blur-md p-6 rounded-[28px] border border-white/5 shadow-sm">
        <h2 className="text-xs font-google font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Control Deck Actions
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-1">
          {/* Sync Database */}
          <div 
            onClick={handleDatabaseSync}
            className="p-4 rounded-2xl bg-white/5 dark:bg-black/10 border border-white/5 hover:border-indigo-500/20 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs font-black group-hover:text-indigo-400 transition-colors">Sync Database</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {syncLatency !== null ? `Healthy (${syncLatency}ms)` : 'Verify Supabase connection'}
                </p>
              </div>
            </div>
          </div>

          {/* Timetable Optimizer */}
          <div 
            onClick={handleTriggerOptimizer}
            className="p-4 rounded-2xl bg-white/5 dark:bg-black/10 border border-white/5 hover:border-purple-500/20 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Sparkles size={16} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs font-black group-hover:text-purple-400 transition-colors">Run Optimizer</p>
                <p className="text-[10px] text-slate-400 truncate">Auto-optimize timetable</p>
              </div>
            </div>
          </div>

          {/* Instant Broadcast */}
          <div 
            onClick={() => setShowBroadcastModal(true)}
            className="p-4 rounded-2xl bg-white/5 dark:bg-black/10 border border-white/5 hover:border-emerald-500/20 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Radio size={16} className="animate-pulse" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-xs font-black group-hover:text-emerald-400 transition-colors">Send Broadcast</p>
                <p className="text-[10px] text-slate-400 truncate">Dispatch instant message</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BROADCAST ANNOUNCEMENT MODAL --- */}
      <AnimatePresence>
        {showBroadcastModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBroadcastModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl w-full max-w-md backdrop-blur-md shadow-2xl relative z-10 text-white text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio size={20} className="text-emerald-400 animate-pulse" />
                  <h3 className="font-google font-extrabold text-sm uppercase tracking-wider">New Instant Broadcast</h3>
                </div>
                <button 
                  onClick={() => setShowBroadcastModal(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Broadcast Destination</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('announcements')}
                    className={clsx(
                      "py-2.5 rounded-xl text-xs font-bold transition-all border",
                      broadcastTarget === 'announcements'
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50"
                        : "bg-white/5 text-slate-300 border-transparent hover:border-white/5"
                    )}
                  >
                    📣 Announcements
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('general')}
                    className={clsx(
                      "py-2.5 rounded-xl text-xs font-bold transition-all border",
                      broadcastTarget === 'general'
                        ? "bg-indigo-600/20 text-indigo-400 border-indigo-500/50"
                        : "bg-white/5 text-slate-300 border-transparent hover:border-white/5"
                    )}
                  >
                    💬 General Chat
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Message Content</label>
                <textarea
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder="Type announcement broadcast..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/5 rounded-2xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500/50 resize-none font-medium"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  disabled={isBroadcasting || !broadcastText.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  {isBroadcasting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send size={12} /> Send Broadcast
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default React.memo(IconGallery);
