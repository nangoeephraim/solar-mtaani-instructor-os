import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings } from '../services/storageService';
import {
  Clock, Users, AlertTriangle, BookOpen, CheckCircle, Trophy,
  ArrowUpRight, Zap, Monitor, Calendar, Play, ChevronRight,
  Sparkles, Sun, Moon, Sunrise, Coffee, Target, TrendingUp,
  Bell, Settings, BarChart3, GraduationCap, UserCheck, Lightbulb,
  TrendingDown, XCircle, Timer, ArrowRight, Activity, Megaphone
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { analyzeData } from '../services/intelligenceService';
import PageTransition from './PageTransition';

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

// ── Live Clock ──
const LiveClock: React.FC = () => {
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
};

// ── Animated Stat Card ──
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
}> = ({ icon, label, value, suffix = '', sub, gradient, accentColor, delay = 0, onClick, trendData }) => {
  const animatedValue = useAnimatedCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      onClick={onClick}
      className="relative bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
    >
      {/* Accent top edge */}
      <div className={clsx('h-1 w-full', gradient)} />

      <div className="p-6 flex flex-col justify-between min-h-[160px]">
        {/* Icon badge + label */}
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className={clsx('p-3 rounded-2xl text-white shadow-lg', gradient)}
            whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
          >
            {icon}
          </motion.div>
          <span className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-[0.12em]">{label}</span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums">{animatedValue}</span>
          {suffix && <span className="text-lg font-bold text-[var(--md-sys-color-on-surface-variant)]">{suffix}</span>}
        </div>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-1">{sub}</p>

        {/* Sparkline */}
        {trendData && (
          <div className="absolute bottom-3 right-3 w-24 h-10 opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke={accentColor} strokeWidth={2.5} fill={`url(#sg-${label})`} isAnimationActive />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Circular Progress Ring ──
const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number }> = ({ pct, size = 56, stroke = 5 }) => {
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
};

// ── Quick Action Button ──
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  bg: string;
  onClick: () => void;
  delay?: number;
}> = ({ icon, label, bg, onClick, delay = 0 }) => (
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
);

/* ─────────────────────────────────────────────
   Main Dashboard Component
   ───────────────────────────────────────────── */

interface DashboardProps {
  data: AppData;
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const { user } = useAuth();
  const [currentSettings, setCurrentSettings] = useState<InstructorSettings>(getSettings());

  useEffect(() => {
    const loaded = getSettings();
    setCurrentSettings(!loaded.preferences ? { ...loaded, preferences: DEFAULT_SETTINGS.preferences } : loaded);
  }, []);

  const today = new Date();
  const currentHour = today.getHours();

  // ── Greeting ──
  const greeting = useMemo(() => {
    if (currentHour < 6) return { text: 'Good Night', icon: <Moon size={28} />, gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600' };
    if (currentHour < 12) return { text: 'Good Morning', icon: <Sunrise size={28} />, gradient: 'bg-gradient-to-br from-amber-400 to-orange-500' };
    if (currentHour < 17) return { text: 'Good Afternoon', icon: <Sun size={28} />, gradient: 'bg-gradient-to-br from-sky-400 to-blue-500' };
    return { text: 'Good Evening', icon: <Coffee size={28} />, gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600' };
  }, [currentHour]);

  // ── Today's Classes ──
  const todaysClasses = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    const dayIdx = today.getDay();
    const recurring = data.schedule.filter(s => s.dayOfWeek === dayIdx && !s.overrideDate);
    const overrides = data.schedule.filter(s => s.overrideDate === todayStr);
    const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
    return [...recurring.filter(r => !replacedIds.has(r.id)), ...overrides]
      .filter(s => s.status !== 'Cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.schedule]);

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
      const active = [...rec.filter(r => !rIds.has(r.id)), ...ovr].filter(s => s.status !== 'Cancelled');
      total += active.length;
      completed += active.filter(s => s.status === 'Completed').length;
    }
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [data.schedule]);

  // ── At-Risk Students ──
  const atRiskStudents = data.students.filter(s => {
    const vals = Object.values(s.competencies);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return avg < 2.5 || s.attendancePct < 80;
  });

  // ── Aggregate Stats ──
  const avgAttendance = Math.round(data.students.reduce((a, s) => a + s.attendancePct, 0) / Math.max(data.students.length, 1));
  const avgCompetency = parseFloat((data.students.reduce((a, s) => {
    const v = Object.values(s.competencies);
    return a + (v.reduce((x, y) => x + y, 0) / Math.max(v.length, 1));
  }, 0) / Math.max(data.students.length, 1)).toFixed(1));

  // ── AI Insights ──
  const insights = useMemo(() => {
    if (currentSettings.preferences?.enableAI === false) return [];
    return analyzeData(data).slice(0, 3);
  }, [data, currentSettings.preferences?.enableAI]);

  const heroTarget = currentClass || nextClass;

  /* ─────────── RENDER ─────────── */
  return (
    <PageTransition>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12 font-sans max-w-[1400px] mx-auto">

        {/* ═══ TOP ROW: HERO (8) + AI INSIGHTS (4) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="xl:col-span-8 relative rounded-3xl overflow-hidden bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm"
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
                    <h1 className="text-2xl sm:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight leading-none">
                      {greeting.text}, {currentSettings.name?.split(' ')[0] || 'Instructor'}
                    </h1>
                    <p className="text-[11px] font-bold tracking-widest text-[var(--md-sys-color-primary)] uppercase mt-1">Illuminating Learning</p>
                  </div>
                </div>

                {/* Hero Actions */}
                <div className="flex flex-wrap gap-3 mt-5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('schedule')}
                    className="px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
                  >
                    {heroTarget ? <><Play size={16} fill="currentColor" /> Start Class</> : <><Calendar size={16} /> View Schedule</>}
                  </motion.button>
                  {heroTarget && (
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="px-5 py-2.5 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors shadow-sm"
                    >
                      Take Attendance
                    </button>
                  )}
                </div>
              </div>

              {/* Right: Clock */}
              <LiveClock />
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
        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users size={22} />} label="Total Students" value={data.students.length} sub="Across all grades"
            gradient="bg-gradient-to-r from-blue-500 to-indigo-600" accentColor="#4f46e5" delay={0.25}
            onClick={() => onNavigate('students')}
            trendData={[{ value: data.students.length - 8 }, { value: data.students.length - 3 }, { value: data.students.length - 1 }, { value: data.students.length }]}
          />
          <StatCard
            icon={<BookOpen size={22} />} label="Curriculum" value={data.curriculum.solar.length + data.curriculum.ict.length} sub="Active modules"
            gradient="bg-gradient-to-r from-teal-400 to-emerald-500" accentColor="#10b981" delay={0.3}
            onClick={() => onNavigate('curriculum')}
            trendData={[{ value: 8 }, { value: 12 }, { value: 16 }, { value: data.curriculum.solar.length + data.curriculum.ict.length }]}
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

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap size={18} className="text-amber-500" />
              <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] text-sm uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-6 gap-x-4">
              <QuickAction icon={<Calendar size={22} />} label="Schedule" bg="bg-gradient-to-br from-blue-500 to-indigo-500" onClick={() => onNavigate('schedule')} delay={0.1} />
              <QuickAction icon={<Users size={22} />} label="Students" bg="bg-gradient-to-br from-purple-500 to-pink-500" onClick={() => onNavigate('students')} delay={0.15} />
              <QuickAction icon={<UserCheck size={22} />} label="Attendance" bg="bg-gradient-to-br from-emerald-500 to-green-500" onClick={() => onNavigate('attendance')} delay={0.2} />
              <QuickAction icon={<BarChart3 size={22} />} label="Analytics" bg="bg-gradient-to-br from-cyan-500 to-blue-500" onClick={() => onNavigate('analytics')} delay={0.25} />
              <QuickAction icon={<GraduationCap size={22} />} label="Assess" bg="bg-gradient-to-br from-orange-500 to-red-500" onClick={() => onNavigate('assessment')} delay={0.3} />
              <QuickAction icon={<Settings size={22} />} label="Settings" bg="bg-gradient-to-br from-gray-500 to-slate-600" onClick={() => onNavigate('settings')} delay={0.35} />
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
            className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm flex flex-col overflow-hidden max-h-[360px]"
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
              <AnimatePresence>
                {atRiskStudents.length > 0 ? atRiskStudents.slice(0, 5).map((student, idx) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onNavigate('students')}
                    className="p-3.5 rounded-2xl bg-amber-50/20 dark:bg-amber-900/5 border border-amber-100/30 dark:border-amber-900/10 hover:bg-amber-50/60 dark:hover:bg-amber-900/20 hover:border-amber-200/50 dark:hover:border-amber-800/50 transition-all cursor-pointer group flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{student.name}</h4>
                      <p className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mt-1">Grade {student.grade} · {student.subject}</p>
                    </div>
                    {student.attendancePct < 80 && (
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className="text-[8px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Attend.</span>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">{student.attendancePct}%</span>
                      </div>
                    )}
                  </motion.div>
                )) : (
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

export default Dashboard;