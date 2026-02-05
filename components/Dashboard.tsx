import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings } from '../services/storageService';
import { Clock, Users, AlertTriangle, BookOpen, CheckCircle, Trophy, ArrowUpRight, Zap, Monitor, Calendar, Play, ChevronRight, Sparkles, Sun, Moon, Sunrise, Coffee, Target, TrendingUp, Bell, Settings, BarChart3, GraduationCap, UserCheck, Lightbulb, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeData } from '../services/intelligenceService';

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
        <p className="text-2xl font-black text-gray-900 tabular-nums">
          {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </p>
        <p className="text-xs text-gray-500 font-medium">
          {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
      </div>
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
}> = ({ icon, label, value, sub, color, delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
    whileHover={{ y: -4, scale: 1.02 }}
    onClick={onClick}
    className={clsx(
      "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg cursor-pointer transition-all relative overflow-hidden group",
      color
    )}
  >
    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
      {icon}
    </div>
    <div className="flex items-start gap-4 relative z-10">
      <motion.div
        className="p-3 rounded-xl bg-gray-100 group-hover:scale-110 transition-transform"
        whileHover={{ rotate: 10 }}
      >
        {icon}
      </motion.div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <h3 className="text-2xl font-black text-gray-900">{value}</h3>
        <p className="text-xs text-gray-500 font-medium">{sub}</p>
      </div>
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
      "flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all",
      color
    )}
  >
    <div className="p-3 rounded-xl bg-gray-50">
      {icon}
    </div>
    <span className="text-xs font-bold text-gray-700">{label}</span>
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

  // Today's Classes
  const todaysClasses = data.schedule
    .filter(s => s.dayOfWeek === currentDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentClass = todaysClasses.find(s => {
    const slotHour = parseInt(s.startTime.split(':')[0]);
    return slotHour >= currentHour;
  }) || todaysClasses[0];

  const nextClass = todaysClasses.find(s => {
    const slotHour = parseInt(s.startTime.split(':')[0]);
    return slotHour > currentHour;
  });

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
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            className={clsx("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg", greeting.color)}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            {greeting.icon}
          </motion.div>
          <div>
            <h1 className="text-3xl font-google font-black text-gray-900 tracking-tight flex items-center gap-2">
              {greeting.text}, {settings.name?.split(' ')[0] || 'Instructor'}
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Sparkles size={20} className="text-yellow-500" />
              </motion.span>
            </h1>
            <p className="text-gray-500 font-medium">Empowering the next generation of experts</p>
          </div>
        </div>
        <LiveClock />
      </motion.header>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Current Class Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 relative overflow-hidden">
          {/* Decorative Blobs */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute left-10 bottom-10 w-40 h-40 bg-yellow-100 rounded-full blur-3xl opacity-50" />

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
                  {currentClass ? 'Current Session' : 'Next Up'}
                </span>
              </motion.div>

              {currentClass ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-4xl font-google font-black text-gray-900 mb-2">
                    Grade {currentClass.grade} <span className={clsx(currentClass.subject === 'Solar' ? 'text-orange-500' : 'text-blue-600')}>{currentClass.subject}</span>
                  </h2>
                  <p className="text-gray-500 text-lg font-medium flex items-center gap-2 mb-6">
                    <Clock size={18} className="text-gray-400" />
                    {currentClass.startTime} • {currentClass.durationMinutes} Minutes
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onNavigate('schedule')}
                      className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center gap-2 shadow-lg shadow-gray-900/20"
                    >
                      <Play size={16} fill="white" />
                      Start Class
                    </motion.button>
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                    >
                      Take Attendance
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="py-4">
                  <h2 className="text-3xl font-google font-bold text-gray-400">No classes right now</h2>
                  <p className="text-gray-500 mt-2 font-medium">Check the schedule to plan for upcoming sessions.</p>
                  <button
                    onClick={() => onNavigate('schedule')}
                    className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
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
        </div>

        {/* At Risk Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 border-l-4 border-l-red-400 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              <span className="font-bold text-sm uppercase tracking-wider">Attention</span>
            </div>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
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
                  className="p-3 rounded-xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors">{student.name}</h4>
                      <p className="text-[10px] font-medium text-gray-500 uppercase">
                        {student.subject} • Grade {student.grade}
                      </p>
                    </div>
                    {student.attendancePct < 80 && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
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
                    className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-3"
                  >
                    <CheckCircle className="text-green-500" size={32} />
                  </motion.div>
                  <p className="text-sm font-bold text-gray-700">All on track!</p>
                  <p className="text-xs text-gray-400">No concerns</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => onNavigate('students')}
            className="w-full py-3 rounded-xl bg-red-50 text-red-700 font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            View All <ChevronRight size={14} />
          </button>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Quick Actions</h3>
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
          icon={<Users size={24} className="text-blue-600" />}
          label="Total Students"
          value={data.students.length}
          sub="Across all grades"
          color="border-b-4 border-b-blue-500"
          delay={0.1}
          onClick={() => onNavigate('students')}
        />
        <StatCard
          icon={<BookOpen size={24} className="text-purple-600" />}
          label="Curriculum Units"
          value={data.curriculum.solar.length + data.curriculum.ict.length}
          sub="Active modules"
          color="border-b-4 border-b-purple-500"
          delay={0.15}
          onClick={() => onNavigate('curriculum')}
        />
        <StatCard
          icon={<CheckCircle size={24} className="text-green-600" />}
          label="Attendance"
          value={`${avgAttendance}%`}
          sub="Past 30 days"
          color="border-b-4 border-b-green-500"
          delay={0.2}
          onClick={() => onNavigate('analytics')}
        />
        <StatCard
          icon={<Trophy size={24} className="text-orange-600" />}
          label="Skill Mastery"
          value={avgCompetency}
          sub="Class average (max 4)"
          color="border-b-4 border-b-orange-500"
          delay={0.25}
          onClick={() => onNavigate('analytics')}
        />
      </div>

      {/* Today's Schedule Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <h3 className="font-google font-bold text-gray-800">Today's Schedule</h3>
          </div>
          <button
            onClick={() => onNavigate('schedule')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ArrowUpRight size={12} />
          </button>
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
                    slot.subject === 'Solar' ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-blue-500 bg-blue-50/50',
                    isActive && 'ring-2 ring-blue-500 ring-offset-2'
                  )}
                  onClick={() => onNavigate('schedule')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {slot.subject === 'Solar' ? <Zap size={14} className="text-orange-600" /> : <Monitor size={14} className="text-blue-600" />}
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{slot.subject}</span>
                    {isActive && <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full ml-auto">NOW</span>}
                  </div>
                  <p className="font-bold text-gray-900">Grade {slot.grade}</p>
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                    <Clock size={10} /> {slot.startTime} • {slot.durationMinutes}min
                  </p>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No classes scheduled for today</p>
          </div>
        )}
      </motion.div>


      {/* Smart AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md shadow-indigo-500/20">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-google font-bold text-gray-800">Smart Insights</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Powered by PRISM Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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
                  insight.type === 'success' ? "bg-green-50/50 border-green-100" :
                    insight.type === 'warning' ? "bg-red-50/50 border-red-100" :
                      insight.type === 'info' ? "bg-blue-50/50 border-blue-100" :
                        "bg-purple-50/50 border-purple-100"
                )}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className={clsx(
                    "p-2 rounded-lg flex-shrink-0",
                    insight.type === 'success' ? "bg-green-100" :
                      insight.type === 'warning' ? "bg-red-100" :
                        insight.type === 'info' ? "bg-blue-100" :
                          "bg-purple-100"
                  )}>
                    {insight.type === 'success' ? <CheckCircle size={16} className="text-green-600" /> :
                      insight.type === 'warning' ? <AlertTriangle size={16} className="text-red-600" /> :
                        insight.type === 'info' ? <Lightbulb size={16} className="text-blue-600" /> :
                          <TrendingUp size={16} className="text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 leading-tight">{insight.message}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-auto leading-relaxed pl-11">
                  {insight.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;