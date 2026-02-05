import React, { useState, useEffect, useMemo } from 'react';
import { AppData, Student, COMPETENCY_LABELS, COMPETENCY_COLORS } from '../types';
import {
    ArrowLeft, User, Award, Calendar, TrendingUp, TrendingDown, Target,
    Zap, Monitor, BarChart3, Activity, Clock, CheckCircle, XCircle,
    Sparkles, GraduationCap, BookOpen, Star, Flame, Trophy
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';

interface StudentAnalyticsProps {
    data: AppData;
    studentId: number;
    onNavigate: (view: string) => void;
}

// Hook for animated counter
const useAnimatedCounter = (end: number, duration: number = 1000) => {
    const [value, setValue] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = 0;

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            setValue(startValue + (end - startValue) * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [end, duration]);

    return value;
};

// Animated Stat Card
const StatCard: React.FC<{
    title: string;
    value: number;
    suffix?: string;
    icon: React.ReactNode;
    color: 'violet' | 'green' | 'orange' | 'blue' | 'red';
    trend?: number;
    delay?: number;
}> = ({ title, value, suffix = '', icon, color, trend, delay = 0 }) => {
    const animatedValue = useAnimatedCounter(value, 1500);

    const gradients = {
        violet: 'from-violet-500 to-purple-600',
        green: 'from-green-500 to-emerald-600',
        orange: 'from-orange-500 to-amber-600',
        blue: 'from-blue-500 to-indigo-600',
        red: 'from-red-500 to-rose-600'
    };

    const bgColors = {
        violet: 'from-violet-50 to-purple-50 border-violet-100',
        green: 'from-green-50 to-emerald-50 border-green-100',
        orange: 'from-orange-50 to-amber-50 border-orange-100',
        blue: 'from-blue-50 to-indigo-50 border-blue-100',
        red: 'from-red-50 to-rose-50 border-red-100'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: 'spring', stiffness: 300 }}
            className={clsx(
                "bg-gradient-to-br rounded-2xl p-5 border relative overflow-hidden",
                bgColors[color]
            )}
        >
            <motion.div
                className={clsx("p-2.5 rounded-xl bg-gradient-to-br text-white w-fit shadow-lg", gradients[color])}
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400 }}
            >
                {icon}
            </motion.div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-gray-900">
                    {suffix === '%' ? animatedValue.toFixed(0) : animatedValue.toFixed(1)}
                </span>
                {suffix && <span className="text-sm font-bold text-gray-400">{suffix}</span>}
                {trend !== undefined && (
                    <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ml-auto",
                        trend >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ data, studentId, onNavigate }) => {
    const student = data.students.find(s => s.id === studentId);
    const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'attendance'>('overview');

    if (!student) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600">Student not found</h3>
                    <button
                        onClick={() => onNavigate('students-manage')}
                        className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium text-sm"
                    >
                        Back to Students
                    </button>
                </div>
            </div>
        );
    }

    // Calculate class data for comparison
    const classStudents = data.students.filter(s =>
        s.subject === student.subject && s.grade === student.grade
    );

    const getStudentAvg = (s: Student) => {
        const vals = Object.values(s.competencies);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const studentAvg = getStudentAvg(student);
    const classAvg = classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + getStudentAvg(s), 0) / classStudents.length
        : 0;
    const classAttendanceAvg = classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + s.attendancePct, 0) / classStudents.length
        : 0;

    // Radar chart data
    const radarData = Object.entries(student.competencies).map(([key, value]) => {
        const classAvgForSkill = classStudents.length > 0
            ? classStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classStudents.length
            : 0;
        return {
            skill: key.length > 12 ? key.substring(0, 10) + '...' : key,
            fullSkill: key,
            student: value,
            class: parseFloat(classAvgForSkill.toFixed(1)),
            fullMark: 4
        };
    });

    // Progress over time data (simulated)
    const progressData = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const month = new Date(now);
            month.setMonth(month.getMonth() - (5 - i));
            // Simulate progressive improvement
            const baseScore = 1.5 + (i * 0.3) + Math.random() * 0.5;
            return {
                month: month.toLocaleDateString('en-US', { month: 'short' }),
                score: Math.min(parseFloat(baseScore.toFixed(1)), 4)
            };
        });
    }, []);

    // Attendance heatmap data (last 30 days)
    const attendanceHeatmap = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const record = student.attendanceHistory.find(h => h.date === dateStr);
            days.push({
                date: dateStr,
                day: date.getDate(),
                weekday: date.getDay(),
                status: record?.status || 'none'
            });
        }
        return days;
    }, [student.attendanceHistory]);

    // Competency distribution pie
    const competencyDistribution = useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        Object.values(student.competencies).forEach(v => {
            counts[v as 1 | 2 | 3 | 4]++;
        });
        return [
            { name: 'Emerging', value: counts[1], color: '#f87171' },
            { name: 'Developing', value: counts[2], color: '#fbbf24' },
            { name: 'Competent', value: counts[3], color: '#3b82f6' },
            { name: 'Mastered', value: counts[4], color: '#10b981' }
        ].filter(d => d.value > 0);
    }, [student.competencies]);

    // Sessions attended/total
    const sessionsAttended = student.attendanceHistory.filter(h => h.status === 'present').length;
    const totalSessions = student.attendanceHistory.length;

    return (
        <div className="animate-fade-in pb-6 space-y-6">
            {/* Header */}
            <motion.div
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="p-6 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50">
                    <div className="flex items-start gap-6">
                        {/* Back Button */}
                        <motion.button
                            onClick={() => onNavigate('students-manage')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </motion.button>

                        {/* Student Info */}
                        <div className="flex items-center gap-5 flex-1">
                            {student.photo ? (
                                <img src={student.photo} alt={student.name} className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="text-3xl font-bold text-white">{student.name.charAt(0)}</span>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={clsx(
                                        "px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1",
                                        student.subject === 'Solar' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {student.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                        {student.subject}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                                        Grade {student.grade}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-google font-bold text-gray-900">{student.name}</h1>
                                <p className="text-gray-500 text-sm">Lot {student.lot} • ID #{student.id.toString().padStart(4, '0')}</p>
                            </div>
                        </div>

                        {/* Header Stats */}
                        <div className="flex gap-3">
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center min-w-[80px]">
                                <Flame className="text-orange-500 mx-auto mb-1" size={20} />
                                <p className={clsx(
                                    "text-xl font-black",
                                    studentAvg >= classAvg ? "text-green-600" : "text-orange-500"
                                )}>
                                    {studentAvg >= classAvg ? 'Above' : 'Below'}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Class Avg</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center min-w-[80px]">
                                <Trophy className="text-yellow-500 mx-auto mb-1" size={20} />
                                <p className="text-xl font-black text-violet-600">
                                    #{classStudents.sort((a, b) => getStudentAvg(b) - getStudentAvg(a)).findIndex(s => s.id === student.id) + 1}
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">Class Rank</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-t border-gray-100 bg-white">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'competencies', label: 'Competencies', icon: Target },
                        { id: 'attendance', label: 'Attendance', icon: Calendar }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2 relative",
                                activeTab === tab.id ? "text-violet-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeStudentTab"
                                    className="absolute bottom-0 left-4 right-4 h-[3px] bg-violet-600 rounded-t-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                title="Avg Competency"
                                value={studentAvg}
                                suffix="/4"
                                icon={<Star size={20} />}
                                color="violet"
                                trend={studentAvg - classAvg}
                                delay={0}
                            />
                            <StatCard
                                title="Attendance Rate"
                                value={student.attendancePct}
                                suffix="%"
                                icon={<CheckCircle size={20} />}
                                color={student.attendancePct >= 85 ? 'green' : 'orange'}
                                trend={student.attendancePct - classAttendanceAvg}
                                delay={0.1}
                            />
                            <StatCard
                                title="Sessions Attended"
                                value={sessionsAttended}
                                suffix={`/${totalSessions}`}
                                icon={<Clock size={20} />}
                                color="blue"
                                delay={0.2}
                            />
                            <StatCard
                                title="Skills Mastered"
                                value={Object.values(student.competencies).filter(v => v === 4).length}
                                suffix={`/${Object.keys(student.competencies).length}`}
                                icon={<Trophy size={20} />}
                                color="orange"
                                delay={0.3}
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Radar Chart */}
                            <motion.div
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <Target className="text-violet-500" size={18} />
                                    Competency Profile vs Class
                                </h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="skill" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                                            <Radar name="Student" dataKey="student" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} />
                                            <Radar name="Class Avg" dataKey="class" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="5 5" />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-2 text-xs">
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-violet-500" /> {student.name}</span>
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 opacity-50" /> Class Average</span>
                                </div>
                            </motion.div>

                            {/* Progress Timeline */}
                            <motion.div
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <Activity className="text-violet-500" size={18} />
                                    Performance Trend
                                </h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={progressData}>
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <YAxis domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="score"
                                                stroke="#8b5cf6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorScore)"
                                                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                                activeDot={{ r: 6, fill: '#8b5cf6' }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        </div>

                        {/* Competency Distribution Pie */}
                        <motion.div
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <Award className="text-violet-500" size={18} />
                                Competency Level Distribution
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="w-48 h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={competencyDistribution}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {competencyDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 pl-8 space-y-3">
                                    {competencyDistribution.map((level, i) => (
                                        <div key={level.name} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ background: level.color }} />
                                            <span className="text-sm font-medium text-gray-700 flex-1">{level.name}</span>
                                            <span className="text-lg font-bold text-gray-900">{level.value}</span>
                                            <span className="text-xs text-gray-400">
                                                ({((level.value / Object.keys(student.competencies).length) * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeTab === 'competencies' && (
                    <motion.div
                        key="competencies"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-6">
                                <BookOpen className="text-violet-500" size={18} />
                                Detailed Competency Breakdown
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(student.competencies).map(([key, value], index) => {
                                    const classAvgForSkill = classStudents.length > 0
                                        ? classStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classStudents.length
                                        : 0;
                                    const diff = value - classAvgForSkill;

                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 bg-gray-50 rounded-xl border border-gray-100"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                                                        COMPETENCY_COLORS[value as 1 | 2 | 3 | 4]
                                                    )}>
                                                        {value}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                        <p className="text-xs text-gray-500">{COMPETENCY_LABELS[value]}</p>
                                                    </div>
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                                                    diff >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)} vs class
                                                </div>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(value / 4) * 100}%` }}
                                                    transition={{ delay: 0.3 + index * 0.05, duration: 0.8, type: 'spring' }}
                                                    className={clsx(
                                                        "h-full rounded-full",
                                                        value === 4 ? "bg-emerald-500" :
                                                            value === 3 ? "bg-blue-500" :
                                                                value === 2 ? "bg-amber-500" : "bg-rose-500"
                                                    )}
                                                />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'attendance' && (
                    <motion.div
                        key="attendance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Attendance Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 text-center"
                            >
                                <CheckCircle className="text-green-500 mx-auto mb-2" size={28} />
                                <p className="text-3xl font-black text-green-600">{sessionsAttended}</p>
                                <p className="text-xs font-bold text-green-700 uppercase">Present</p>
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-2xl border border-red-100 text-center"
                            >
                                <XCircle className="text-red-500 mx-auto mb-2" size={28} />
                                <p className="text-3xl font-black text-red-500">
                                    {student.attendanceHistory.filter(h => h.status === 'absent').length}
                                </p>
                                <p className="text-xs font-bold text-red-700 uppercase">Absent</p>
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-100 text-center"
                            >
                                <BarChart3 className="text-violet-500 mx-auto mb-2" size={28} />
                                <p className="text-3xl font-black text-violet-600">{student.attendancePct}%</p>
                                <p className="text-xs font-bold text-violet-700 uppercase">Rate</p>
                            </motion.div>
                        </div>

                        {/* Attendance Heatmap */}
                        <motion.div
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-6">
                                <Calendar className="text-violet-500" size={18} />
                                Attendance Heatmap (Last 30 Days)
                            </h3>
                            <div className="grid grid-cols-7 gap-2">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} className="text-center text-[10px] font-bold text-gray-400 pb-2">{d}</div>
                                ))}
                                {attendanceHeatmap.map((day, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3 + i * 0.01 }}
                                        className={clsx(
                                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110",
                                            day.status === 'present' && "bg-green-500 text-white shadow-md shadow-green-500/30",
                                            day.status === 'absent' && "bg-red-400 text-white shadow-md shadow-red-400/30",
                                            day.status === 'none' && "bg-gray-100 text-gray-400"
                                        )}
                                        title={`${day.date}: ${day.status === 'none' ? 'No record' : day.status}`}
                                    >
                                        {day.day}
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex justify-center gap-6 mt-6 text-xs">
                                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-green-500" /> Present</span>
                                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-400" /> Absent</span>
                                <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-200" /> No Record</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentAnalytics;
