import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings } from '../services/storageService';
import { Clock, Users, AlertTriangle, BookOpen, CheckCircle, Trophy, ArrowUpRight, Zap, Monitor, Calendar, Play, ChevronRight, Sparkles, Sun, Moon, Sunrise, Coffee, Target, TrendingUp, Bell, Settings, BarChart3, GraduationCap, UserCheck, Lightbulb, TrendingDown, XCircle, Timer } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeData } from '../services/intelligenceService';
import PageTransition from './PageTransition';
import PageHeader from './PageHeader';

interface DashboardProps {
  data: AppData;
  onNavigate: (view: string) => void;
}

// Live Clock Component
const LiveClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] tabular-nums">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
        <p className="text-xs text-[var(--md-sys-color-secondary)] font-medium">
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

// Sparkline Component
const Sparkline: React.FC<{ data: any[]; color: string }> = ({ data, color }) => {
  // Extract color from the border color class
  const strokeColor = color.includes('#1a73e8') ? '#1a73e8' :  // Google Blue
    color.includes('#0d9488') ? '#0d9488' :  // Teal
      color.includes('#34a853') ? '#34a853' :  // Google Green
        color.includes('#ea8600') ? '#ea8600' : '#64748b';  // Google Yellow/Warning

  return (
    <div className="h-10 w-24 absolute bottom-4 right-4 opacity-50 pointer-events-none">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${color})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Animated Stat Card
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  delay?: number;
  onClick?: () => void;
  trendData?: any[];
}> = ({ icon, label, value, sub, color, delay = 0, onClick, trendData }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
    whileHover={{ y: -4, scale: 1.02 }}
    onClick={onClick}
    className={clsx(
      "glass-card p-5 relative overflow-hidden group cursor-pointer",
      color
    )}
  >
    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
      {icon}
    </div>
    <div className="flex items-start gap-4 relative z-10">
      <motion.div
        className="p-3 rounded-xl bg-[var(--md-sys-color-surface-variant)] group-hover:scale-110 transition-transform"
        whileHover={{ rotate: 10 }}
      >
        {icon}
      </motion.div>
      <div>
        <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-0.5">{label}</p>
        <h3 className="text-2xl font-black text-[var(--md-sys-color-on-surface)]">{value}</h3>
        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">{sub}</p>
      </div>
      {trendData && <Sparkline data={trendData} color={color} />}
    </div>
  </motion.div>
);

// Quick Action Button
const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
  delay?: number;
}> = ({ icon, label, color, onClick, delay = 0 }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center gap-2 p-4 rounded-2xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:shadow-lg transition-all tap-target",
      color
    )}
  >
    <div className="p-3 rounded-xl bg-[var(--md-sys-color-surface-variant)]">
      {icon}
    </div>
    <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{label}</span>
  </motion.button>
);

const Dashboard: React.FC<DashboardProps> = ({ data, onNavigate }) => {
  const [settings, setSettings] = useState<InstructorSettings>(DEFAULT_SETTINGS);
  const today = new Date();
  const currentHour = today.getHours();
  const currentDay = today.getDay();

  useEffect(() => {
    const loaded = getSettings();
    // Ensure preferences exist
    if (!loaded.preferences) {
      setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
    } else {
      setSettings(loaded);
    }
  }, []);

  // Time-based greeting
  const greeting = useMemo(() => {
    if (currentHour < 6) return { text: 'Good Night', icon: <Moon size={24} className="text-indigo-500" />, color: 'from-indigo-500 to-purple-600' };
    if (currentHour < 12) return { text: 'Good Morning', icon: <Sunrise size={24} className="text-orange-500" />, color: 'from-orange-400 to-rose-500' };
    if (currentHour < 17) return { text: 'Good Afternoon', icon: <Sun size={24} className="text-yellow-500" />, color: 'from-yellow-400 to-orange-500' };
    return { text: 'Good Evening', icon: <Coffee size={24} className="text-purple-500" />, color: 'from-purple-500 to-indigo-600' };
  }, [currentHour]);

  // Today's Classes — handle overrides and exclude cancelled
  const todaysClasses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dayIdx = now.getDay();
    const recurring = data.schedule.filter(s => s.dayOfWeek === dayIdx && !s.overrideDate);
    const overrides = data.schedule.filter(s => s.overrideDate === todayStr);
    const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
    return [
      ...recurring.filter(r => !replacedIds.has(r.id)),
      ...overrides
    ].filter(s => s.status !== 'Cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.schedule]);

  const currentClass = todaysClasses.find(s => {
    const [h, m] = s.startTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const nowMin = today.getHours() * 60 + today.getMinutes();
    return nowMin >= startMin && nowMin < startMin + s.durationMinutes;
  });

  const nextClass = todaysClasses.find(s => {
    const [h, m] = s.startTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const nowMin = today.getHours() * 60 + today.getMinutes();
    return startMin > nowMin;
  });

  // Countdown to next class
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const target = nextClass || (currentClass ? null : todaysClasses[0]);
    if (!target) { setCountdown(''); return; }
    const update = () => {
      const now = new Date();
      const [h, m] = target.startTime.split(':').map(Number);
      const targetTime = new Date(now);
      targetTime.setHours(h, m, 0, 0);
      const diffMs = targetTime.getTime() - now.getTime();
      if (diffMs <= 0) { setCountdown('Starting now'); return; }
      const mins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(mins / 60);
      const remainMins = mins % 60;
      setCountdown(hrs > 0 ? `${hrs}h ${remainMins}m` : `${remainMins}m`);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [nextClass, currentClass, todaysClasses]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    let total = 0, completed = 0;
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayIdx = d.getDay();
      const rec = data.schedule.filter(s => s.dayOfWeek === dayIdx && !s.overrideDate);
      const ovr = data.schedule.filter(s => s.overrideDate === dateStr);
      const rIds = new Set(ovr.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
      const active = [...rec.filter(r => !rIds.has(r.id)), ...ovr].filter(s => s.status !== 'Cancelled');
      total += active.length;
      completed += active.filter(s => s.status === 'Completed').length;
    }
    return { total, completed, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [data.schedule]);

  // At-Risk Students
  const atRiskStudents = data.students.filter(student => {
    const competencies = Object.values(student.competencies);
    const avgComp = competencies.length > 0 ? competencies.reduce((a, b) => a + b, 0) / competencies.length : 0;
    return avgComp < 2.5 || student.attendancePct < 80;
  });

  // Stats
  const avgAttendance = Math.round(data.students.reduce((acc, s) => acc + s.attendancePct, 0) / data.students.length);
  const avgCompetency = (data.students.reduce((acc, s) => {
    const vals = Object.values(s.competencies);
    return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
  }, 0) / data.students.length).toFixed(1);

  // Generate Intelligence Insights (only if enabled)
  const insights = useMemo(() => {
    if (settings.preferences?.enableAI === false) return [];
    return analyzeData(data).slice(0, 3);
  }, [data, settings.preferences?.enableAI]);

  return (
    <PageTransition>
      <div className="space-y-6 pb-10 font-sans">
        {/* Header */}
        <PageHeader
          title={`${greeting.text}, ${settings.name?.split(' ')[0] || 'Instructor'}`}
          subtitle="Empowering the next generation of experts"
          icon={() => (
            <motion.div
              className={clsx("w-full h-full rounded-xl bg-gradient-to-br flex items-center justify-center text-white", greeting.color)}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              {greeting.icon}
            </motion.div>
          )}
          action={<LiveClock />}
        />


        {/* Hero Section */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Current Class Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="lg:col-span-2 bg-gradient-to-br from-[var(--md-sys-color-surface)] to-[var(--md-sys-color-surface-variant)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-sm p-8 relative overflow-hidden transition-shadow"
          >
            {/* Decorative Blobs */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--md-sys-color-primary-container)] rounded-full blur-3xl opacity-50" />
            <div className="absolute left-10 bottom-10 w-40 h-40 bg-amber-100 dark:bg-amber-900/30 rounded-full blur-3xl opacity-50" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    {currentClass ? 'Current Session' : (nextClass ? 'Next Up' : 'Schedule')}
                  </span>
                  {countdown && !currentClass && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                      <Timer size={12} />
                      Starts in {countdown}
                    </span>
                  )}
                </motion.div>

                {(currentClass || nextClass) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-4xl font-google font-black text-[var(--md-sys-color-on-surface)] mb-2">
                      Grade {(currentClass || nextClass)!.grade} <span className={clsx((currentClass || nextClass)!.subject === 'Solar' ? 'text-orange-500' : 'text-blue-600')}>{(currentClass || nextClass)!.subject}</span>
                    </h2>
                    <p className="text-[var(--md-sys-color-secondary)] text-lg font-medium flex items-center gap-2 mb-6">
                      <Clock size={18} className="text-[var(--md-sys-color-secondary)]" />
                      {(currentClass || nextClass)!.startTime} • {(currentClass || nextClass)!.durationMinutes} Minutes
                    </p>
                    <div className="flex gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate('schedule')}
                        className="px-6 py-3 bg-[var(--md-sys-color-on-surface)] text-[var(--md-sys-color-surface)] rounded-xl font-bold text-sm hover:opacity-90 transition-colors flex items-center gap-2 shadow-lg"
                      >
                        <Play size={16} fill="currentColor" />
                        Start Class
                      </motion.button>
                      <button
                        onClick={() => onNavigate('attendance')}
                        className="px-6 py-3 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
                      >
                        Take Attendance
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-4">
                    <h2 className="text-3xl font-google font-bold text-[var(--md-sys-color-secondary)]">No classes right now</h2>
                    <p className="text-[var(--md-sys-color-on-surface-variant)] mt-2 font-medium">Check the schedule to plan for upcoming sessions.</p>
                    <button
                      onClick={() => onNavigate('schedule')}
                      className="mt-6 px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-colors flex items-center gap-2 shadow-lg"
                    >
                      View Full Schedule
                    </button>
                  </div>
                )}
              </div>

              {/* Mascot */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="relative w-48 h-48 flex-shrink-0"
              >
                <img
                  src="/frog_weather.png"
                  alt="Assistant"
                  className="w-full h-full object-contain filter drop-shadow-xl"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* At Risk Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-sm p-6 border-l-4 border-l-red-400 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle size={20} />
                <span className="font-bold text-sm uppercase tracking-wider">Attention</span>
              </div>
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                {atRiskStudents.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
              <AnimatePresence>
                {atRiskStudents.length > 0 ? atRiskStudents.slice(0, 4).map((student, idx) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onNavigate('students')}
                    className="p-3 rounded-xl bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-[var(--md-sys-color-on-surface)] text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{student.name}</h4>
                        <p className="text-[10px] font-medium text-[var(--md-sys-color-secondary)] uppercase">
                          {student.subject} • Grade {student.grade}
                        </p>
                      </div>
                      {student.attendancePct < 80 && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                          {student.attendancePct}%
                        </span>
                      )}
                    </div>
                  </motion.div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mb-3"
                    >
                      <CheckCircle className="text-green-500" size={32} />
                    </motion.div>
                    <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">All on track!</p>
                    <p className="text-xs text-[var(--md-sys-color-secondary)]">No concerns</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => onNavigate('students')}
              className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
            >
              View All <ChevronRight size={14} />
            </button>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-4 px-1">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <QuickAction icon={<Calendar size={20} className="text-blue-600" />} label="Schedule" color="hover:border-blue-200" onClick={() => onNavigate('schedule')} delay={0.1} />
            <QuickAction icon={<Users size={20} className="text-purple-600" />} label="Students" color="hover:border-purple-200" onClick={() => onNavigate('students')} delay={0.15} />
            <QuickAction icon={<UserCheck size={20} className="text-green-600" />} label="Attendance" color="hover:border-green-200" onClick={() => onNavigate('attendance')} delay={0.2} />
            <QuickAction icon={<BarChart3 size={20} className="text-emerald-600" />} label="Analytics" color="hover:border-emerald-200" onClick={() => onNavigate('analytics')} delay={0.25} />
            <QuickAction icon={<GraduationCap size={20} className="text-orange-600" />} label="Assessment" color="hover:border-orange-200" onClick={() => onNavigate('assessment')} delay={0.3} />
            <QuickAction icon={<Settings size={20} className="text-gray-600" />} label="Settings" color="hover:border-gray-300" onClick={() => onNavigate('settings')} delay={0.35} />
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users size={24} className="text-[#1a73e8]" />}
            label="Total Students"
            value={data.students.length}
            sub="Across all grades"
            color="border-b-4 border-b-[#1a73e8]"
            delay={0.1}
            onClick={() => onNavigate('students')}
            trendData={[
              { value: 40 }, { value: 42 }, { value: 41 }, { value: 44 }, { value: 45 }, { value: 48 }, { value: data.students.length }
            ]}
          />
          <StatCard
            icon={<BookOpen size={24} className="text-[#0d9488]" />}
            label="Curriculum Units"
            value={data.curriculum.solar.length + data.curriculum.ict.length}
            sub="Active modules"
            color="border-b-4 border-b-[#0d9488]"
            delay={0.15}
            onClick={() => onNavigate('curriculum')}
            trendData={[
              { value: 10 }, { value: 12 }, { value: 12 }, { value: 15 }, { value: 15 }, { value: 18 }, { value: 20 }
            ]}
          />
          <StatCard
            icon={<CheckCircle size={24} className="text-[#34a853]" />}
            label="Attendance"
            value={`${avgAttendance}%`}
            sub="Past 30 days"
            color="border-b-4 border-b-[#34a853]"
            delay={0.2}
            onClick={() => onNavigate('analytics')}
            trendData={[
              { value: 85 }, { value: 82 }, { value: 88 }, { value: 90 }, { value: 87 }, { value: 92 }, { value: avgAttendance }
            ]}
          />
          <StatCard
            icon={<Trophy size={24} className="text-[#ea8600]" />}
            label="Skill Mastery"
            value={avgCompetency}
            sub="Class average (max 4)"
            color="border-b-4 border-b-[#ea8600]"
            delay={0.25}
            onClick={() => onNavigate('analytics')}
            trendData={[
              { value: 2.8 }, { value: 2.9 }, { value: 3.0 }, { value: 3.1 }, { value: 3.0 }, { value: 3.2 }, { value: Number(avgCompetency) }
            ]}
          />
        </div>

        {/* Today's Schedule Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)]">Today's Schedule</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[var(--md-sys-color-secondary)] bg-[var(--md-sys-color-surface-variant)] px-2.5 py-1 rounded-full">
                {todaysClasses.length} class{todaysClasses.length !== 1 ? 'es' : ''}
              </span>
              <button
                onClick={() => onNavigate('schedule')}
                className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:opacity-80 flex items-center gap-1"
              >
                View All <ArrowUpRight size={12} />
              </button>
            </div>
          </div>

          {todaysClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {todaysClasses.slice(0, 4).map((slot, idx) => {
                const isActive = slot.id === currentClass?.id;
                return (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className={clsx(
                      "p-4 rounded-xl border-l-4 transition-all cursor-pointer",
                      slot.subject === 'Solar' ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/20' : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/20',
                      isActive && 'ring-2 ring-[var(--md-sys-color-primary)] ring-offset-2'
                    )}
                    onClick={() => onNavigate('schedule')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {slot.subject === 'Solar' ? <Zap size={14} className="text-orange-600 dark:text-orange-400" /> : <Monitor size={14} className="text-blue-600 dark:text-blue-400" />}
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]">{slot.subject}</span>
                      {isActive && <span className="text-[9px] font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] px-1.5 py-0.5 rounded-full ml-auto">NOW</span>}
                      {!isActive && slot.status === 'Completed' && <CheckCircle size={12} className="text-green-500 ml-auto" />}
                      {!isActive && slot.status === 'Pending' && <Clock size={12} className="text-amber-500 ml-auto" />}
                    </div>
                    <p className="font-bold text-[var(--md-sys-color-on-surface)]">Grade {slot.grade}</p>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium flex items-center gap-1 mt-1">
                      <Clock size={10} /> {slot.startTime} • {slot.durationMinutes}min
                    </p>
                    {slot.status === 'Completed' && (
                      <span className="text-[9px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full mt-1.5 inline-block">Done</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--md-sys-color-secondary)]">
              <Calendar size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No classes scheduled for today</p>
            </div>
          )}

          {/* Weekly Progress Bar */}
          {weeklyStats.total > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Weekly Progress</span>
                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{weeklyStats.completed}/{weeklyStats.total} classes</span>
              </div>
              <div className="w-full h-2.5 bg-[var(--md-sys-color-surface)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyStats.pct}%` }}
                  transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                />
              </div>
              <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-1 text-right font-medium">{weeklyStats.pct}% complete</p>
            </div>
          )}
        </motion.div>


        {/* Smart AI Insights */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/20">
                  <Sparkles size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)]">Smart Insights</h3>
                  <p className="text-[10px] text-[var(--md-sys-color-secondary)] font-medium uppercase tracking-wider">Powered by PRISM Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('analytics')}
                className="text-xs font-bold text-[var(--md-sys-color-primary)] hover:opacity-80 flex items-center gap-1"
              >
                Full Analysis <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {insights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.1 }}
                  className={clsx(
                    "p-4 rounded-xl border flex flex-col h-full",
                    insight.type === 'success' ? "bg-green-50/50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30" :
                      insight.type === 'warning' ? "bg-red-50/50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30" :
                        insight.type === 'info' ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30" :
                          "bg-purple-50/50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30"
                  )}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className={clsx(
                      "p-2 rounded-lg flex-shrink-0",
                      insight.type === 'success' ? "bg-green-100 dark:bg-green-900/30" :
                        insight.type === 'warning' ? "bg-red-100 dark:bg-red-900/30" :
                          insight.type === 'info' ? "bg-blue-100 dark:bg-blue-900/30" :
                            "bg-purple-100 dark:bg-purple-900/30"
                    )}>
                      {insight.type === 'success' ? <CheckCircle size={16} className="text-green-600 dark:text-green-400" /> :
                        insight.type === 'warning' ? <AlertTriangle size={16} className="text-red-600 dark:text-red-400" /> :
                          insight.type === 'info' ? <Lightbulb size={16} className="text-blue-600 dark:text-blue-400" /> :
                            <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] leading-tight">{insight.message}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-auto leading-relaxed pl-11">
                    {insight.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;