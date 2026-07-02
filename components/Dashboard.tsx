import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import {
  Clock, Users, AlertTriangle, BookOpen, CheckCircle, Trophy,
  ArrowUpRight, Zap, Monitor, Calendar, Play, ChevronRight,
  Sparkles, Sun, Moon, Sunrise, Coffee, Target, TrendingUp,
  Bell, Settings, BarChart3, GraduationCap, UserCheck, Lightbulb,
  TrendingDown, XCircle, Timer, ArrowRight, Activity, Megaphone,
  Video, FileText, MessageSquare, CheckSquare, ListTodo, MessageCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { analyzeData } from '../services/intelligenceService';
import { getPendingMutations } from '../services/offlineSyncService';
import PageTransition from './PageTransition';
import WordRotator from './WordRotator';

/* ─────────────────────────────────────────────
   Hooks
   ───────────────────────────────────────────── */

const useAnimatedCounter = (end: number, duration = 1200) => {
  const [count, setCount] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    ref.current = null;
    const step = (ts: number) => {
      if (!ref.current) ref.current = ts;
      const progress = Math.min((ts - ref.current) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(end);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return count;
};

/* ─────────────────────────────────────────────
   Sub-Components
   ───────────────────────────────────────────── */

// ── Live Clock (memoized — owns its own interval, no props) ──
const LiveClock: React.FC = React.memo(() => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right select-none">
      <p className="text-2xl sm:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums tracking-tight">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </p>
      <p className="text-sm text-[var(--md-sys-color-secondary)] font-medium">
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
});

// ── Animated Stat Card (memoized — premium glassmorphic) ──
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  sub: string;
  gradient: string;
  accentColor: string;
  delay?: number;
  onClick?: () => void;
  trendData?: { value: number }[];
}> = React.memo(({ icon, label, value, suffix = '', sub, gradient, accentColor, delay = 0, onClick, trendData }) => {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
      onClick={onClick}
      className="relative bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Gradient glow orb — visible on hover */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-[0.08] blur-2xl transition-opacity duration-500 pointer-events-none"
        style={{ background: accentColor }}
      />

      {/* Accent top edge with gradient */}
      <div className={clsx('h-1.5 w-full', gradient)} />

      <div className="p-3.5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:min-h-[170px] relative">
        {/* Icon badge + label */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <motion.div
            className={clsx('p-2 sm:p-3 rounded-xl sm:rounded-2xl text-white shadow-lg', gradient)}
            whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1, transition: { duration: 0.5 } }}
          >
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { size: undefined, className: 'w-4 h-4 sm:w-5 sm:h-5' }) : icon}
          </motion.div>
          <span className="text-[9px] sm:text-[11px] font-black text-[var(--md-sys-color-secondary)] uppercase tracking-[0.06em] sm:tracking-[0.12em] truncate">{label}</span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span className="text-2xl sm:text-4xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums leading-none">{animatedValue}</span>
          {suffix && <span className="text-xs sm:text-lg font-bold text-[var(--md-sys-color-on-surface-variant)]">{suffix}</span>}
        </div>
        <p className="text-[9px] sm:text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-1 select-none truncate max-w-[90%]">{sub}</p>

        {/* Sparkline */}
        {trendData && (
          <div className="absolute bottom-2 right-2 w-20 sm:w-28 h-8 sm:h-12 opacity-15 sm:opacity-25 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id={`sg-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2.5} fill={`url(#sg-${label.replace(/\s+/g, '-')})`} isAnimationActive />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// ── Circular Progress Ring (memoized — pure component) ──
const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number }> = React.memo(({ pct, size = 56, stroke = 5 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--md-sys-color-outline-variant)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ring-grad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * pct) / 100 }}
        transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34a853" />
          <stop offset="100%" stopColor="#1a73e8" />
        </linearGradient>
      </defs>
    </svg>
  );
});

// ── Quick Action Button (memoized — pure presentational) ──
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  bg: string;
  onClick: () => void;
  delay?: number;
}> = React.memo(({ icon, label, bg, onClick, delay = 0 }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 22 }}
    whileHover={{ y: -4, scale: 1.06 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2.5 group outline-none"
  >
    <div className={clsx(
      'w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all text-white',
      bg
    )}>
      {icon}
    </div>
    <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] group-hover:text-[var(--md-sys-color-on-surface)] transition-colors">{label}</span>
  </motion.button>
));

// ── Connection Status Indicator ──
const ConnectionStatus: React.FC = React.memo(() => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Check pending mutations count
    const checkPending = async () => {
      try {
        const mutations = await getPendingMutations();
        setPendingCount(mutations.length);
      } catch { /* silent */ }
    };
    checkPending();
    const id = setInterval(checkPending, 10000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(id);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
        isOnline && pendingCount === 0
          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
          : isOnline && pendingCount > 0
          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40"
      )}
    >
      <span className="relative flex h-2 w-2">
        {isOnline && pendingCount === 0 && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={clsx(
          "relative inline-flex rounded-full h-2 w-2",
          isOnline && pendingCount === 0 ? "bg-emerald-500" : isOnline ? "bg-amber-500" : "bg-red-500"
        )} />
      </span>
      {isOnline && pendingCount === 0
        ? "Synced"
        : isOnline
        ? `${pendingCount} pending`
        : "Offline"
      }
    </motion.div>
  );
});

/* ─────────────────────────────────────────────
   Main Dashboard Component
   ───────────────────────────────────────────── */

interface DashboardProps {
  data: AppData;
  onNavigate: (view: string, studentId?: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const { user } = useAuth();
  const { preferences, settings: currentSettings } = useTheme();
  const [activeDeckTab, setActiveDeckTab] = useState<'actions' | 'tasks'>('actions');
  const [expandedRiskId, setExpandedRiskId] = useState<number | null>(null);

  const today = new Date();
  const currentHour = today.getHours();

  // ── Greeting ──
  const greeting = useMemo(() => {
    const isSwahili = preferences.enableSwahiliGreeting ?? true;
    if (currentHour < 6) return { text: isSwahili ? 'Usiku Mwema' : 'Good Night', icon: <Moon size={28} />, gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600' };
    if (currentHour < 12) return { text: isSwahili ? 'Habari za Asubuhi' : 'Good Morning', icon: <Sunrise size={28} />, gradient: 'bg-gradient-to-br from-amber-400 to-orange-500' };
    if (currentHour < 17) return { text: isSwahili ? 'Habari za Mchana' : 'Good Afternoon', icon: <Sun size={28} />, gradient: 'bg-gradient-to-br from-sky-400 to-blue-500' };
    return { text: isSwahili ? 'Habari za Jioni' : 'Good Evening', icon: <Coffee size={28} />, gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600' };
  }, [currentHour, preferences.enableSwahiliGreeting]);

  // ── Today's Classes ──
  const todaysClasses = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    const dayIdx = today.getDay();
    const recurring = data.schedule.filter(s => s.dayOfWeek === dayIdx && !s.overrideDate);
    const overrides = data.schedule.filter(s => s.overrideDate === todayStr);
    const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
    let classes = [...recurring.filter(r => !replacedIds.has(r.id)), ...overrides]
      .filter(s => s.status !== 'Cancelled');
    
    // Filter by preferred subject focus
    if (preferences.defaultSubject && preferences.defaultSubject !== 'All') {
      classes = classes.filter(s => s.subject === preferences.defaultSubject);
    }
    
    return classes.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.schedule, preferences.defaultSubject]);

  const currentClass = todaysClasses.find(s => {
    const [h, m] = s.startTime.split(':').map(Number);
    const start = h * 60 + m;
    const now = today.getHours() * 60 + today.getMinutes();
    return now >= start && now < start + s.durationMinutes;
  });

  const nextClass = todaysClasses.find(s => {
    const [h, m] = s.startTime.split(':').map(Number);
    return h * 60 + m > today.getHours() * 60 + today.getMinutes();
  });

  // ── Countdown ──
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const target = nextClass || (currentClass ? null : todaysClasses[0]);
    if (!target) { setCountdown(''); return; }
    const tick = () => {
      const now = new Date();
      const [h, m] = target.startTime.split(':').map(Number);
      const t = new Date(now); t.setHours(h, m, 0, 0);
      const diff = t.getTime() - now.getTime();
      if (diff <= 0) { setCountdown('Starting now'); return; }
      const mins = Math.floor(diff / 60000);
      setCountdown(mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [nextClass, currentClass, todaysClasses]);

  // ── Weekly Stats ──
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const dayOff = now.getDay() === 0 ? -6 : 1 - now.getDay();
    const mon = new Date(now); mon.setDate(now.getDate() + dayOff);
    let total = 0, completed = 0;
    for (let i = 0; i < 5; i++) {
      const d = new Date(mon); d.setDate(mon.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const di = d.getDay();
      const rec = data.schedule.filter(s => s.dayOfWeek === di && !s.overrideDate);
      const ovr = data.schedule.filter(s => s.overrideDate === ds);
      const rIds = new Set(ovr.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
      let active = [...rec.filter(r => !rIds.has(r.id)), ...ovr].filter(s => s.status !== 'Cancelled');
      
      if (preferences.defaultSubject && preferences.defaultSubject !== 'All') {
        active = active.filter(s => s.subject === preferences.defaultSubject);
      }
      
      total += active.length;
      completed += active.filter(s => s.status === 'Completed').length;
    }
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [data.schedule, preferences.defaultSubject]);

  // Filter students based on preferred subject
  const filteredStudents = useMemo(() => {
    if (preferences.defaultSubject && preferences.defaultSubject !== 'All') {
      return data.students.filter(s => s.subject === preferences.defaultSubject);
    }
    return data.students;
  }, [data.students, preferences.defaultSubject]);

  // ── At-Risk Students (memoized — expensive O(n) filter with nested reduce) ──
  const atRiskStudents = useMemo(() => filteredStudents.filter(s => {
    const vals = Object.values(s.competencies);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return avg < 2.5 || s.attendancePct < 80;
  }), [filteredStudents]);

  // ── Aggregate Stats (memoized — O(n) reduce on every render otherwise) ──
  const avgAttendance = useMemo(() => Math.round(
    filteredStudents.reduce((a, s) => a + s.attendancePct, 0) / Math.max(filteredStudents.length, 1)
  ), [filteredStudents]);

  const avgCompetency = useMemo(() => parseFloat((filteredStudents.reduce((a, s) => {
    const v = Object.values(s.competencies);
    return a + (v.reduce((x, y) => x + y, 0) / Math.max(v.length, 1));
  }, 0) / Math.max(filteredStudents.length, 1)).toFixed(1)), [filteredStudents]);

  const curriculumCount = useMemo(() => {
    // Sum all available curriculum items regardless of subject type
    const allItems = Object.values(data.curriculum || {}).flat();
    return allItems.length;
  }, [data.curriculum]);

  // ── AI Insights ──
  const insights = useMemo(() => {
    if (currentSettings.preferences?.enableAI === false) return [];
    return analyzeData(data).slice(0, 3);
  }, [data, currentSettings.preferences?.enableAI]);

  // ── Unread Messages ──
  const unreadMessagesCount = useMemo(() => {
    if (!data.communications || !user) return 0;
    const channels = data.communications.channels || [];
    const messages = data.communications.messages || {};
    let count = 0;
    channels.forEach(ch => {
      const msgs = messages[ch.id] || [];
      const lastRead = ch.lastReadBy?.[user.id];
      if (!lastRead) {
         count += msgs.filter(m => m.senderId !== user.id).length;
      } else {
         const lastReadDate = new Date(lastRead).getTime();
         count += msgs.filter(m => m.senderId !== user.id && new Date(m.timestamp).getTime() > lastReadDate).length;
      }
    });
    return count;
  }, [data.communications, user]);

  // ── Action Items (Smart Tasks) ──
  const actionItems = useMemo(() => {
    const items = [];
    if (currentClass) {
      items.push({ id: 'att', title: `Take attendance for ${currentClass.grade} ${currentClass.subject}`, icon: <CheckSquare size={16} />, action: () => onNavigate('attendance'), color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30' });
      items.push({ id: 'meet', title: `Join video meeting for ${currentClass.subject}`, icon: <Video size={16} />, action: () => onNavigate('communications'), color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30' });
    } else if (nextClass) {
      items.push({ id: 'prep', title: `Prepare for next class: ${nextClass.subject}`, icon: <FileText size={16} />, action: () => onNavigate('resources'), color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-100 dark:border-indigo-900/30' });
    }
    
    if (atRiskStudents.length > 0) {
      items.push({ id: 'risk', title: `Review ${atRiskStudents.length} at-risk student${atRiskStudents.length > 1 ? 's' : ''}`, icon: <AlertTriangle size={16} />, action: () => onNavigate('student-analytics'), color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/30' });
    }
    
    if (unreadMessagesCount > 0) {
      items.push({ id: 'msgs', title: `Read ${unreadMessagesCount} unread message${unreadMessagesCount > 1 ? 's' : ''}`, icon: <MessageSquare size={16} />, action: () => onNavigate('communications'), color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-900/30' });
    }

    const pendingPayments = data.payments?.filter(p => p.status?.toLowerCase() === 'pending').length || 0;
    if (pendingPayments > 0 && (user?.role === 'admin' || user?.role === 'instructor')) {
       items.push({ id: 'fees', title: `Review ${pendingPayments} pending payment${pendingPayments > 1 ? 's' : ''}`, icon: <AlertTriangle size={16}/>, action: () => onNavigate('fees'), color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30' });
    }

    return items;
  }, [currentClass, nextClass, atRiskStudents.length, unreadMessagesCount, onNavigate, data.payments, user?.role]);

  const heroTarget = currentClass || nextClass;

  /* ─────────── RENDER ─────────── */
  return (
    <PageTransition>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-32 sm:pb-16 px-4 sm:px-0 font-sans max-w-[1400px] mx-auto">

        {/* ═══ TOP ROW: HERO (8) + AI INSIGHTS (4) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="xl:col-span-8 relative rounded-3xl overflow-hidden bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm hover:shadow-xl transition-shadow duration-500"
        >
          {/* Glassmorphic Background Overlays */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--md-sys-color-surface)] via-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-primary-container)] opacity-40 mix-blend-overlay z-0" />
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-[var(--md-sys-color-primary)] opacity-[0.05] rounded-[100px] rotate-45 blur-3xl pointer-events-none z-0" />
          <div className="absolute left-10 -bottom-20 w-64 h-64 bg-indigo-500 opacity-[0.04] rounded-full blur-2xl pointer-events-none z-0" />

          <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full justify-between gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Left: Greeting */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    className={clsx('w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md backdrop-blur-sm', greeting.gradient)}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                  >
                    {greeting.icon}
                  </motion.div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight leading-none flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{greeting.text},</span>
                      <span className="bg-gradient-to-r from-[var(--md-sys-color-primary)] to-indigo-500 bg-clip-text text-transparent">{currentSettings.name?.split(' ')[0] || 'Instructor'}!</span>
                    </h1>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--md-sys-color-secondary)] mt-2 flex items-center gap-1.5 select-none animate-fade-in">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{preferences.enableSwahiliGreeting ?? true ? 'Karibu' : 'Welcome to'}</span>
                      <span className="font-extrabold text-[var(--md-sys-color-on-surface)] border-b-2 border-dashed border-[var(--md-sys-color-primary)]/30 pb-0.5">{preferences.institutionBranch || 'Main Campus'}</span>
                      <span>Branch</span>
                    </p>
                    <div className="text-[11px] font-bold tracking-widest text-[var(--md-sys-color-primary)] uppercase mt-2.5 min-h-[16px] flex items-center">
                      <WordRotator 
                        words={
                          preferences.enableSwahiliGreeting ?? true 
                            ? ["Kazi iendelee Masomoni", "Elimu ni Mwanga wetu", "Kukuza Vijana wa Leo", "Pamoja Tunaweza", "Nguvu ya Elimu"]
                            : ["Empowering Every Learner", "Advancing Education Access", "Shaping Community Leaders", "Optimizing Workloads", "Illuminating Futures"]
                        } 
                        intervalMs={4000} 
                        className="w-full animate-fade-in" 
                      />
                    </div>
                  </div>
                </div>

                {/* Hero Actions */}
                <div className="flex flex-wrap gap-3 mt-5">
                  {currentClass ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate('communications')}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
                      >
                        <Video size={16} fill="currentColor" /> Join Class Meeting
                      </motion.button>
                      <button
                        onClick={() => onNavigate('attendance')}
                        className="px-5 py-2.5 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors shadow-sm flex items-center gap-2"
                      >
                        <CheckSquare size={16} /> Take Attendance
                      </button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate('schedule')}
                        className="px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
                      >
                        <Calendar size={16} /> View Schedule
                      </motion.button>
                      {nextClass && (
                        <button
                          onClick={() => onNavigate('resources')}
                          className="px-5 py-2.5 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors shadow-sm flex items-center gap-2"
                        >
                          <FileText size={16} /> Lesson Resources
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right: Clock + Connection Status */}
              <div className="flex flex-col items-end gap-2">
                <LiveClock />
                <ConnectionStatus />
              </div>
            </div>

            {/* Horizontal Timeline */}
            <div className="mt-2 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[var(--md-sys-color-surface)]/80 to-transparent pointer-events-none z-10" />
              <div className="flex items-center justify-between mb-3 relative z-20 pr-4">
                <h3 className="text-[10px] font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-widest flex items-center gap-1.5 opacity-80">
                  <Timer size={12} /> Today's Timeline
                </h3>
                {countdown && !currentClass && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm animate-pulse">
                    Starting in {countdown}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-1 overflow-x-auto pb-1 hide-scrollbar custom-scrollbar relative z-20">
                {todaysClasses.length > 0 ? todaysClasses.map((slot, idx) => {
                  const isActive = slot.id === currentClass?.id;
                  const isDone = slot.status === 'Completed';

                  return (
                    <div key={slot.id} className={clsx("flex flex-col relative flex-shrink-0 w-28 sm:w-36", isDone ? "opacity-60 grayscale hover:grayscale-0" : "opacity-100 transition-all")}>
                      {/* Line connecting nodes */}
                      <div className="absolute top-1.5 left-3 w-full h-[2px] bg-[var(--md-sys-color-outline-variant)] -z-10" />
                      {isActive && <div className="absolute top-1.5 left-3 w-1/2 h-[2px] bg-[var(--md-sys-color-primary)] shadow-[0_0_8px_var(--md-sys-color-primary)] -z-10" />}

                      {/* Node Point */}
                      <div className={clsx(
                        "w-3.5 h-3.5 rounded-full border-[3px] z-10 mx-auto",
                        isActive ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] shadow-[0_0_12px_var(--md-sys-color-primary)]" : "border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]"
                      )} />

                      {/* Class Details Bubble */}
                      <div onClick={() => onNavigate('schedule')} className={clsx(
                        "mt-3 p-3 rounded-xl border text-left cursor-pointer transition-transform hover:-translate-y-1 mx-1",
                        isActive ? "bg-[var(--md-sys-color-primary)]/10 border-[var(--md-sys-color-primary)]/40 shadow-sm" : "bg-[var(--md-sys-color-surface)]/80 border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-1">
                            <Clock size={10} /> {slot.startTime}
                          </span>
                          {isActive && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--md-sys-color-primary)] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--md-sys-color-primary)]"></span></span>}
                        </div>
                        <p className={clsx("font-bold text-xs truncate", isActive ? "text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-on-surface)]")}>
                          G{slot.grade} {slot.subject}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-2 px-1 text-xs text-[var(--md-sys-color-secondary)] font-medium w-full flex items-center gap-2">
                    <Target size={14} className="opacity-50" /> Timeline clear. Enjoy your day!
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ AI INSIGHTS (Col Span 4) ═══ */}
        {insights.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="xl:col-span-4 bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm flex flex-col relative overflow-hidden h-[360px] xl:h-auto"
          >
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500 opacity-[0.05] rounded-full blur-3xl pointer-events-none z-0" />

            <div className="p-6 pb-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] text-sm leading-tight">PRISM Intelligence</h3>
                  <p className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-[0.15em] mt-0.5">Live Insights</p>
                </div>
              </div>
              <button onClick={() => onNavigate('analytics')} className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:underline flex items-center gap-1">
                View All <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-10 bg-[var(--md-sys-color-surface)]/50">
              {insights.map((insight, idx) => {
                const typeMap = {
                  success: { theme: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400', icon: <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />, iconBg: 'bg-emerald-100/80 dark:bg-emerald-900/50' },
                  warning: { theme: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-500', icon: <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />, iconBg: 'bg-amber-100/80 dark:bg-amber-900/50' },
                  info: { theme: 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400', icon: <Lightbulb size={14} className="text-indigo-600 dark:text-indigo-400" />, iconBg: 'bg-indigo-100/80 dark:bg-indigo-900/50' },
                  prediction: { theme: 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100/60 dark:border-purple-900/40 text-purple-700 dark:text-purple-400', icon: <TrendingUp size={14} className="text-purple-600 dark:text-purple-400" />, iconBg: 'bg-purple-100/80 dark:bg-purple-900/50' },
                };
                const t = typeMap[insight.type] || typeMap.info;

                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={clsx('p-3.5 rounded-2xl border flex flex-col hover:shadow-sm transition-shadow', t.theme)}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={clsx('p-1.5 rounded-lg flex-shrink-0', t.iconBg)}>
                        {t.icon}
                      </div>
                      <p className="text-sm font-bold leading-tight line-clamp-2">{insight.message}</p>
                    </div>
                    <p className="text-[11px] opacity-80 leading-relaxed pl-9 line-clamp-3">{insight.detail}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="xl:col-span-4 bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm flex flex-col items-center justify-center p-8 text-center">
            <Sparkles size={28} className="text-[var(--md-sys-color-secondary)] mb-3 opacity-30" />
            <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">AI Disabled</p>
            <p className="text-[11px] text-[var(--md-sys-color-secondary)] mt-1 max-w-[180px]">Enable Intelligence in Settings to see smart insights.</p>
          </div>
        )}

        {/* ═══ STAT CARDS (Grid 4) ═══ */}
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={<Users size={22} />} label="Total Students" value={filteredStudents.length} sub={preferences.defaultSubject && preferences.defaultSubject !== 'All' ? `${preferences.defaultSubject} students` : "Across all grades"}
            gradient="bg-gradient-to-r from-blue-500 to-indigo-600" accentColor="#4f46e5" delay={0.25}
            onClick={() => onNavigate('students')}
            trendData={[{ value: Math.max(0, filteredStudents.length - 8) }, { value: Math.max(0, filteredStudents.length - 3) }, { value: Math.max(0, filteredStudents.length - 1) }, { value: filteredStudents.length }]}
          />
          <StatCard
            icon={<BookOpen size={22} />} label="Curriculum" value={curriculumCount} sub={preferences.defaultSubject && preferences.defaultSubject !== 'All' ? `${preferences.defaultSubject} modules` : "Active modules"}
            gradient="bg-gradient-to-r from-teal-400 to-emerald-500" accentColor="#10b981" delay={0.3}
            onClick={() => onNavigate('curriculum')}
            trendData={[{ value: Math.max(0, curriculumCount - 4) }, { value: Math.max(0, curriculumCount - 2) }, { value: Math.max(0, curriculumCount - 1) }, { value: curriculumCount }]}
          />
          <StatCard
            icon={<CheckCircle size={22} />} label="Attendance" value={avgAttendance} suffix="%" sub="Past 30 days"
            gradient="bg-gradient-to-r from-green-500 to-lime-500" accentColor="#84cc16" delay={0.35}
            onClick={() => onNavigate('analytics')}
            trendData={[{ value: 82 }, { value: 86 }, { value: avgAttendance - 2 }, { value: avgAttendance }]}
          />
          <StatCard
            icon={<Trophy size={22} />} label="Skill Mastery" value={Math.round(avgCompetency * 10)} suffix="/40" sub="Class average / 4.0"
            gradient="bg-gradient-to-r from-amber-400 to-orange-500" accentColor="#f59e0b" delay={0.4}
            onClick={() => onNavigate('analytics')}
            trendData={[{ value: 24 }, { value: 27 }, { value: 31 }, { value: Math.round(avgCompetency * 10) }]}
          />
        </div>

        {/* ═══ BOTTOM LEFT (8) ═══ */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          {/* Command Center: Quick Actions & Smart Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col gap-4"
          >
            {/* Mobile Pill Tabs Header (Hidden on md/desktop) */}
            <div className="flex md:hidden bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl p-1 gap-1">
              <button
                onClick={() => setActiveDeckTab('actions')}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 outline-none tap-target-premium",
                  activeDeckTab === 'actions'
                    ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm border border-[var(--md-sys-color-outline-variant)]/30 font-black"
                    : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                )}
              >
                <Zap size={14} /> Actions
              </button>
              <button
                onClick={() => setActiveDeckTab('tasks')}
                className={clsx(
                  "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 outline-none tap-target-premium",
                  activeDeckTab === 'tasks'
                    ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm border border-[var(--md-sys-color-outline-variant)]/30 font-black"
                    : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                )}
              >
                <ListTodo size={14} /> Tasks
                {actionItems.length > 0 && (
                  <span className="bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] text-[9px] font-black px-1.5 py-0.5 rounded-md">
                    {actionItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* PC side-by-side and Mobile selective display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions Panel */}
              <div className={clsx(
                "bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6 flex flex-col transition-all duration-300",
                activeDeckTab === 'actions' ? 'block animate-fade-in' : 'hidden md:flex'
              )}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-amber-500" />
                    <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] text-sm uppercase tracking-wider">Quick Actions</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-y-6 gap-x-4 flex-1 content-start">
                  <QuickAction icon={<Calendar size={22} />} label="Schedule" bg="bg-gradient-to-br from-blue-500 to-indigo-500" onClick={() => onNavigate('schedule')} delay={0.1} />
                  <QuickAction icon={<Users size={22} />} label="Students" bg="bg-gradient-to-br from-purple-500 to-pink-500" onClick={() => onNavigate('students')} delay={0.15} />
                  <QuickAction icon={<UserCheck size={22} />} label="Attendance" bg="bg-gradient-to-br from-emerald-500 to-green-500" onClick={() => onNavigate('attendance')} delay={0.2} />
                  <QuickAction icon={<BarChart3 size={22} />} label="Analytics" bg="bg-gradient-to-br from-cyan-500 to-blue-500" onClick={() => onNavigate('analytics')} delay={0.25} />
                  <QuickAction icon={<GraduationCap size={22} />} label="Assess" bg="bg-gradient-to-br from-orange-500 to-red-500" onClick={() => onNavigate('assessment')} delay={0.3} />
                  <QuickAction icon={<Settings size={22} />} label="Settings" bg="bg-gradient-to-br from-gray-500 to-slate-600" onClick={() => onNavigate('settings')} delay={0.35} />
                </div>
              </div>

              {/* Smart Tasks Panel */}
              <div className={clsx(
                "bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6 flex flex-col transition-all duration-300",
                activeDeckTab === 'tasks' ? 'block animate-fade-in' : 'hidden md:flex'
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ListTodo size={18} className="text-emerald-500" />
                    <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] text-sm uppercase tracking-wider">Smart Tasks</h3>
                  </div>
                  {actionItems.length > 0 && (
                    <span className="bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] text-xs font-black px-2.5 py-1 rounded-lg">
                      {actionItems.length}
                    </span>
                  )}
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar max-h-[220px]">
                  {actionItems.length > 0 ? (
                    actionItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        onClick={item.action}
                        className={clsx('p-3 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all hover:shadow-sm hover:-translate-y-0.5', item.bg, item.border)}
                      >
                        <div className={clsx('p-2 rounded-xl bg-white dark:bg-black/20 shadow-sm', item.color)}>
                          {item.icon}
                        </div>
                        <span className={clsx('font-bold text-sm flex-1', item.color.replace('text-', 'text-').replace('-500', '-700 dark:text-').replace('-700 dark:text-', '-700 dark:text-'))}>{item.title}</span>
                        <ChevronRight size={16} className="opacity-50" />
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-4 opacity-60">
                      <CheckSquare size={32} className="text-emerald-500 mb-2" />
                      <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">All caught up!</p>
                      <p className="text-[11px] text-[var(--md-sys-color-secondary)]">No pending actions right now.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Detailed Schedule (Weekly Progress Block) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6 flex flex-col sm:flex-row items-center gap-8"
          >
            {weeklyStats.total > 0 ? (
              <>
                <div className="flex-shrink-0 relative">
                  <ProgressRing pct={weeklyStats.pct} size={90} stroke={8} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-black text-[var(--md-sys-color-on-surface)] text-lg leading-none">{weeklyStats.pct}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                  <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-[0.2em] flex items-center justify-center sm:justify-start gap-1.5 mb-1.5">
                    <Activity size={12} /> Weekly Goal Progress
                  </p>
                  <p className="text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums mb-4">
                    {weeklyStats.completed}<span className="text-sm font-medium text-[var(--md-sys-color-on-surface-variant)] leading-none align-baseline"> / {weeklyStats.total} total classes completed</span>
                  </p>
                  <div className="w-full h-3 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyStats.pct}%` }}
                      transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-[var(--md-sys-color-primary)] to-indigo-400 rounded-full"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full text-center py-6 text-[var(--md-sys-color-secondary)] font-medium">No classes scheduled this week.</div>
            )}
          </motion.div>

        </div>

        {/* ═══ BOTTOM RIGHT (4) ═══ */}
        <div className="xl:col-span-4 flex flex-col gap-6">

          {/* At-Risk Panel */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm flex flex-col overflow-hidden max-h-[460px] transition-all"
          >
            <div className="px-6 py-5 flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)]/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl">
                  <AlertTriangle size={16} />
                </div>
                <span className="font-bold text-sm text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">Needs Attention</span>
              </div>
              <span className="bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] text-xs font-black px-2.5 py-1 rounded-lg">
                {atRiskStudents.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 hide-scrollbar custom-scrollbar bg-[var(--md-sys-color-surface)]/50">
              <AnimatePresence initial={false}>
                {atRiskStudents.length > 0 ? atRiskStudents.slice(0, 5).map((student, idx) => {
                  const isExpanded = expandedRiskId === student.id;
                  const strugglingComp = Object.entries(student.competencies)
                    .filter(([_, val]) => val < 2.5)
                    .map(([key, _]) => key.toUpperCase());

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={clsx(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2.5",
                        isExpanded 
                          ? "bg-amber-50/40 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700/60 shadow-md"
                          : "bg-amber-50/20 dark:bg-amber-900/5 border-amber-100/30 dark:border-amber-900/10 hover:bg-amber-50/60 dark:hover:bg-amber-900/20 hover:border-amber-200/50 dark:hover:border-amber-800/50 hover:shadow-sm"
                      )}
                      onClick={() => setExpandedRiskId(isExpanded ? null : student.id)}
                    >
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate flex items-center gap-1.5">
                            {student.name}
                            <span className={clsx("transition-transform duration-300 text-[var(--md-sys-color-secondary)]", isExpanded && "rotate-90 text-amber-500")}>
                              <ChevronRight size={14} />
                            </span>
                          </h4>
                          <p className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mt-1">Grade {student.grade} · {student.subject}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Score</span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                              {Object.values(student.competencies).length > 0 
                                ? (Object.values(student.competencies).reduce((a, b) => a + b, 0) / Object.values(student.competencies).length).toFixed(1)
                                : '0.0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Accordion */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden border-t border-amber-100/50 dark:border-amber-900/30 pt-2.5 mt-1 flex flex-col gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col gap-1.5">
                              {student.attendancePct < 80 && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                  <AlertTriangle size={12} /> Low Attendance: {student.attendancePct}% (Target: 80%)
                                </div>
                              )}
                              {strugglingComp.length > 0 ? (
                                <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                                  <span className="font-bold text-[var(--md-sys-color-secondary)] uppercase text-[9px] tracking-wider block mb-1">Struggling Competencies:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {strugglingComp.map(c => (
                                      <span key={c} className="px-2 py-0.5 bg-amber-100/50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-md font-bold text-[9px] uppercase tracking-wider">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <CheckCircle size={12} /> Competencies on track.
                                </div>
                              )}
                            </div>

                            {/* Action Buttons Deck */}
                            <div className="flex gap-2 justify-end border-t border-amber-100/30 dark:border-amber-900/20 pt-2">
                              <button
                                onClick={() => onNavigate('student-profile', student.id)}
                                className="px-2.5 py-1 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all shadow-sm"
                              >
                                Profile
                              </button>
                              <button
                                onClick={() => onNavigate('communications')}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all shadow-sm flex items-center gap-1"
                              >
                                <MessageCircle size={10} /> Message
                              </button>
                              <button
                                onClick={() => onNavigate('assessment')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white border border-transparent rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all shadow-sm"
                              >
                                Assess
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                }) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/10 rounded-2xl flex items-center justify-center mb-3 text-emerald-500 opacity-60">
                      <CheckCircle size={24} />
                    </div>
                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)] mb-1">Clear Horizon</p>
                    <p className="text-[10px] text-[var(--md-sys-color-secondary)] max-w-[140px]">No students currently need attention.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
            {atRiskStudents.length > 0 && (
              <button onClick={() => onNavigate('students')} className="bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] py-2 text-xs font-bold hover:bg-[var(--md-sys-color-outline-variant)] transition-colors">
                View All Needs Attention
              </button>
            )}
          </motion.div>

          {/* Announcements Widget */}
          {(() => {
            const announcements = (data.communications?.messages?.['chan_announcements'] || []).filter(m => !m.isDeleted).slice(-2).reverse();
            return (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Megaphone size={16} className="text-indigo-500" />
                    <h3 className="font-google font-bold text-sm text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">Announcements</h3>
                  </div>
                </div>

                {announcements.length > 0 ? (
                  <div className="space-y-3">
                    {announcements.map((msg, idx) => (
                      <div
                        key={msg.id}
                        onClick={() => onNavigate('communications')}
                        className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 hover:bg-[var(--md-sys-color-outline-variant)]/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)]">{msg.senderName}</span>
                          <span className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase">
                            {new Date(msg.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--md-sys-color-secondary)] line-clamp-2 leading-relaxed">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[var(--md-sys-color-secondary)] border border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl">
                    <p className="font-medium text-[11px]">No active broadcasts</p>
                  </div>
                )}
              </motion.div>
            );
          })()}

        </div>

      </div>
    </PageTransition>
  );
};

export default React.memo(Dashboard, (prevProps, nextProps) => {
  return prevProps.onNavigate === nextProps.onNavigate &&
         prevProps.data?.students === nextProps.data?.students &&
         prevProps.data?.schedule === nextProps.data?.schedule &&
         prevProps.data?.curriculum === nextProps.data?.curriculum &&
         prevProps.data?.communications?.messages?.['chan_announcements'] === nextProps.data?.communications?.messages?.['chan_announcements'];
});
