import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle, ChevronRight, BarChart3, PieChart as PieChartIcon, Activity, Zap, Monitor, Star, Target, Clock, ArrowUpRight, Sparkles, Download, Lightbulb, Calendar, RefreshCw, FileText, ChevronDown, PartyPopper, Brain } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeData } from '../services/intelligenceService';

interface AnalyticsProps {
    data: AppData;
    onNavigate: (view: string) => void;
}

const GOOGLE_COLORS = ['#4285f4', '#ea4335', '#fbbc04', '#34a853', '#9333ea', '#f97316'];

// Animated Counter Hook
const useAnimatedCounter = (end: number, duration: number = 1000) => {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const currentCount = Math.floor(progress * end);

            if (countRef.current !== currentCount) {
                countRef.current = currentCount;
                setCount(currentCount);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        startTimeRef.current = null;
        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
};

// Mini Sparkline Component
const MiniSparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => (
    <svg viewBox="0 0 100 30" className="w-full h-8 mt-2">
        <defs>
            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
        </defs>
        <path
            d={`M ${data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / Math.max(...data)) * 25}`).join(' L ')}`}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d={`M 0,30 L ${data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / Math.max(...data)) * 25}`).join(' L ')} L 100,30 Z`}
            fill={`url(#spark-${color})`}
        />
    </svg>
);

// Animated Metric Card with Sparkline
const MetricCard: React.FC<{
    title: string;
    value: number;
    suffix?: string;
    subtitle: string;
    trend?: 'up' | 'down';
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    icon: React.ReactNode;
    delay?: number;
    sparklineData?: number[];
}> = ({ title, value, suffix = '', subtitle, trend, color, icon, delay = 0, sparklineData }) => {
    const animatedValue = useAnimatedCounter(value, 1500);

    const gradients = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-emerald-500 to-green-600',
        yellow: 'from-amber-400 to-orange-500',
        red: 'from-red-500 to-rose-600',
        purple: 'from-purple-500 to-indigo-600'
    };

    const colorHex = {
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#f59e0b',
        red: '#ef4444',
        purple: '#8b5cf6'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 300, damping: 25 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <motion.div
                        className={clsx("p-2.5 rounded-xl bg-gradient-to-br text-white shadow-lg", gradients[color])}
                        whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                    >
                        {icon}
                    </motion.div>
                    {trend && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: delay + 0.3 }}
                            className={clsx(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                trend === 'up' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}
                        >
                            {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {trend === 'up' ? '+5%' : '-3%'}
                        </motion.div>
                    )}
                </div>

                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900 tabular-nums">{animatedValue}</span>
                    {suffix && <span className="text-sm font-bold text-gray-400">{suffix}</span>}
                </div>
                <p className="text-xs text-gray-500 font-medium">{subtitle}</p>

                {sparklineData && <MiniSparkline data={sparklineData} color={colorHex[color]} />}
            </div>

            <div className={clsx("h-1 w-full bg-gradient-to-r", gradients[color])} />
        </motion.div>
    );
};

// Quick Insight Chip
const InsightChip: React.FC<{
    type: 'success' | 'warning' | 'info' | 'prediction';
    message: string;
    delay?: number;
}> = ({ type, message, delay = 0 }) => {
    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        prediction: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    const icons = {
        success: <PartyPopper size={14} className="text-green-600" />,
        warning: <AlertTriangle size={14} className="text-amber-600" />,
        info: <Lightbulb size={14} className="text-blue-600" />,
        prediction: <Brain size={14} className="text-purple-600" />
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className={clsx("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium", styles[type])}
        >
            {icons[type]}
            {message}
        </motion.div>
    );
};

// Chart Container
const ChartCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    delay?: number;
    className?: string;
    action?: React.ReactNode;
}> = ({ title, icon, children, delay = 0, className, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 200, damping: 25 }}
        className={clsx("bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-shadow", className)}
    >
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                    {icon}
                </div>
                <h3 className="font-google font-bold text-gray-800">{title}</h3>
            </div>
            {action}
        </div>
        {children}
    </motion.div>
);

const Analytics: React.FC<AnalyticsProps> = ({ data, onNavigate }) => {
    const [selectedMetric, setSelectedMetric] = useState<'performance' | 'attendance' | 'overview'>('overview');
    const [hoveredStudent, setHoveredStudent] = useState<number | null>(null);
    const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'term'>('month');
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Calculate subject averages
    const solarStudents = data.students.filter(s => s.subject === 'Solar');
    const ictStudents = data.students.filter(s => s.subject === 'ICT');

    const getAvgCompetency = (students: Student[]) => {
        if (students.length === 0) return 0;
        const total = students.reduce((acc, s) => {
            const vals = Object.values(s.competencies);
            return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
        }, 0);
        return parseFloat((total / students.length).toFixed(2));
    };

    const subjectData = [
        { name: 'Solar PV', score: getAvgCompetency(solarStudents), students: solarStudents.length, color: '#f97316', icon: '⚡' },
        { name: 'Computer Studies', score: getAvgCompetency(ictStudents), students: ictStudents.length, color: '#3b82f6', icon: '💻' }
    ];

    // Grade distribution
    const gradeData = [5, 6, 7, 8, 9].map(grade => ({
        grade: `Grade ${grade}`,
        shortGrade: `G${grade}`,
        students: data.students.filter(s => s.grade === grade).length,
        avgScore: getAvgCompetency(data.students.filter(s => s.grade === grade)),
        attendance: Math.round(data.students.filter(s => s.grade === grade).reduce((acc, s) => acc + s.attendancePct, 0) / Math.max(1, data.students.filter(s => s.grade === grade).length))
    }));

    // Attendance trend
    const attendanceTrend = [
        { week: 'W1', fullWeek: 'Week 1', rate: 92, target: 90 },
        { week: 'W2', fullWeek: 'Week 2', rate: 88, target: 90 },
        { week: 'W3', fullWeek: 'Week 3', rate: 95, target: 90 },
        { week: 'W4', fullWeek: 'Week 4', rate: 91, target: 90 },
        { week: 'W5', fullWeek: 'Week 5', rate: Math.round(data.students.reduce((acc, s) => acc + s.attendancePct, 0) / data.students.length), target: 90 }
    ];

    // Sparkline data
    const performanceSparkline = [2.8, 3.0, 2.9, 3.1, 3.2, getAvgCompetency(data.students)];
    const attendanceSparkline = attendanceTrend.map(w => w.rate);
    const studentsSparkline = [8, 10, 12, 14, 16, data.students.length];
    const atRiskSparkline = [5, 4, 3, 4, 2, data.students.filter(s => getAvgCompetency([s]) < 2.5 || s.attendancePct < 80).length];

    // Top performers
    const topPerformers = [...data.students]
        .map(student => ({
            ...student,
            avgScore: Object.values(student.competencies).reduce((x, y) => x + y, 0) / Object.values(student.competencies).length
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

    // At-risk students
    const atRiskStudents = data.students.filter(s => {
        const avg = Object.values(s.competencies).reduce((a, b) => a + b, 0) / Object.values(s.competencies).length;
        return avg < 2.5 || s.attendancePct < 80;
    });

    // Competency distribution
    const competencyDistribution = [
        { name: 'Mastery (3.5-4)', value: data.students.filter(s => getAvgCompetency([s]) >= 3.5).length, color: '#22c55e' },
        { name: 'Proficient (2.5-3.4)', value: data.students.filter(s => getAvgCompetency([s]) >= 2.5 && getAvgCompetency([s]) < 3.5).length, color: '#3b82f6' },
        { name: 'Developing (1.5-2.4)', value: data.students.filter(s => getAvgCompetency([s]) >= 1.5 && getAvgCompetency([s]) < 2.5).length, color: '#f59e0b' },
        { name: 'Needs Support (<1.5)', value: data.students.filter(s => getAvgCompetency([s]) < 1.5).length, color: '#ef4444' }
    ];

    // Overall stats
    const overallAvg = getAvgCompetency(data.students);
    const overallAttendance = Math.round(data.students.reduce((acc, s) => acc + s.attendancePct, 0) / data.students.length);

    // Calculate comparisons
    const prevAttendance = 82; // Mock previous week data

    const [settings, setSettings] = useState<InstructorSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const loaded = getSettings();
        if (!loaded.preferences) {
            setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
        } else {
            setSettings(loaded);
        }
    }, []);

    // Derived Metrics
    const activeData = useMemo(() => {
        if (settings.preferences?.enableAI === false) return [];
        return analyzeData(data);
    }, [data, settings.preferences?.enableAI]);

    const primaryInsight = activeData.length > 0 ? activeData[0] : null;

    // Export Functions
    const exportToCSV = () => {
        const headers = ['Name', 'Subject', 'Grade', 'Lot', 'Attendance %', 'Avg Competency'];
        const rows = data.students.map(s => [
            s.name,
            s.subject,
            s.grade,
            s.lot,
            s.attendancePct,
            (Object.values(s.competencies).reduce((a, b) => a + b, 0) / Object.values(s.competencies).length).toFixed(2)
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `slyc_analytics_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        setShowExportMenu(false);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-google font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="text-blue-600" /> Analytics Dashboard
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">Real-time performance metrics and insights</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Time Period Selector */}
                    <div className="flex gap-1 bg-gray-100/80 p-1 rounded-full border border-gray-200">
                        {[
                            { id: 'week', label: 'Week' },
                            { id: 'month', label: 'Month' },
                            { id: 'term', label: 'Term' }
                        ].map((period, idx) => (
                            <button
                                key={idx}
                                onClick={() => setTimePeriod(period.id as any)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    timePeriod === period.id
                                        ? "bg-white shadow-sm text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>

                    {/* Export Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 hover:shadow-sm transition-all"
                        >
                            <Download size={14} />
                            Export
                            <ChevronDown size={14} />
                        </button>
                        <AnimatePresence>
                            {showExportMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={exportToCSV}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <FileText size={14} />
                                        Export as CSV
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Quick Insights Panel */}
            {activeData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap gap-3"
                >
                    {activeData.map((insight, idx) => (
                        <InsightChip key={idx} type={insight.type} message={insight.message} delay={0.1 + idx * 0.05} />
                    ))}
                </motion.div>
            )}

            {/* Key Metrics Row with Sparklines */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Class Average"
                    value={Math.round(overallAvg * 100) / 100}
                    suffix="/4"
                    subtitle="Competency Score"
                    trend={overallAvg >= 2.5 ? 'up' : 'down'}
                    color="blue"
                    icon={<Award size={20} />}
                    delay={0}
                    sparklineData={performanceSparkline}
                />
                <MetricCard
                    title="Attendance"
                    value={overallAttendance}
                    suffix="%"
                    subtitle="Monthly Average"
                    trend={overallAttendance >= 85 ? 'up' : 'down'}
                    color="green"
                    icon={<Users size={20} />}
                    delay={0.1}
                    sparklineData={attendanceSparkline}
                />
                <MetricCard
                    title="Total Students"
                    value={data.students.length}
                    subtitle="Currently Enrolled"
                    color="purple"
                    icon={<Star size={20} />}
                    delay={0.2}
                    sparklineData={studentsSparkline}
                />
                <MetricCard
                    title="At-Risk"
                    value={atRiskStudents.length}
                    subtitle="Need Attention"
                    trend={atRiskStudents.length > 3 ? 'down' : 'up'}
                    color="red"
                    icon={<AlertTriangle size={20} />}
                    delay={0.3}
                    sparklineData={atRiskSparkline}
                />
            </div>

            {/* Tab Navigation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-1 bg-gray-100/80 p-1.5 rounded-full border border-gray-200 shadow-inner w-fit"
            >
                {[
                    { id: 'overview', label: 'Overview', icon: Target },
                    { id: 'performance', label: 'Performance', icon: BarChart3 },
                    { id: 'attendance', label: 'Attendance', icon: Activity }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSelectedMetric(tab.id as any)}
                        className={clsx(
                            "px-5 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                            selectedMetric === tab.id
                                ? "bg-white shadow-md text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </motion.div>

            {/* Main Charts Section */}
            <AnimatePresence mode="wait">
                {selectedMetric === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                    >
                        {/* Subject Performance Comparison */}
                        <ChartCard title="Program Performance" icon={<Zap size={18} />} delay={0.1} className="lg:col-span-2">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {subjectData.map((subject, idx) => (
                                    <motion.div
                                        key={subject.name}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + idx * 0.1 }}
                                        className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: subject.color + '20' }}>
                                                {subject.icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{subject.name}</p>
                                                <p className="text-xs text-gray-500">{subject.students} students</p>
                                            </div>
                                        </div>
                                        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(subject.score / 4) * 100}%` }}
                                                transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                                                className="absolute inset-y-0 left-0 rounded-full"
                                                style={{ backgroundColor: subject.color }}
                                            />
                                        </div>
                                        <p className="text-right text-sm font-bold mt-2" style={{ color: subject.color }}>{subject.score.toFixed(1)}/4.0</p>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={gradeData} barGap={8}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="shortGrade" tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                                padding: '12px 16px'
                                            }}
                                            cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                        />
                                        <Bar dataKey="avgScore" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} name="Avg Score" />
                                        <defs>
                                            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#1d4ed8" />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        {/* Competency Distribution */}
                        <ChartCard title="Skill Levels" icon={<PieChartIcon size={18} />} delay={0.2}>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={competencyDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={0}
                                        >
                                            {competencyDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-4">
                                {competencyDistribution.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-gray-600 font-medium">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </ChartCard>
                    </motion.div>
                )}

                {selectedMetric === 'performance' && (
                    <motion.div
                        key="performance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Top Performers */}
                        <ChartCard
                            title="Top Performers"
                            icon={<Award size={18} />}
                            delay={0.1}
                            action={
                                <button onClick={() => onNavigate('students')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                    View All <ArrowUpRight size={12} />
                                </button>
                            }
                        >
                            <div className="space-y-2">
                                {topPerformers.map((student, idx) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + idx * 0.05 }}
                                        onMouseEnter={() => setHoveredStudent(student.id)}
                                        onMouseLeave={() => setHoveredStudent(null)}
                                        className={clsx(
                                            "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                                            hoveredStudent === student.id ? "bg-blue-50 shadow-sm" : "bg-gray-50 hover:bg-gray-100"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black",
                                            idx === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md" :
                                                idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                                                    idx === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" :
                                                        "bg-gray-100 text-gray-600"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 text-sm truncate">{student.name}</p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                {student.subject === 'Solar' ? <Zap size={10} /> : <Monitor size={10} />}
                                                {student.subject} • G{student.grade}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-gray-900">{student.avgScore.toFixed(1)}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ChartCard>

                        {/* At Risk Students */}
                        <ChartCard title="Attention Required" icon={<AlertTriangle size={18} />} delay={0.2} className="border-l-4 border-l-red-400">
                            {atRiskStudents.length > 0 ? (
                                <div className="space-y-2">
                                    {atRiskStudents.slice(0, 5).map((student, idx) => {
                                        const avg = (Object.values(student.competencies).reduce((a, b) => a + b, 0) / Object.values(student.competencies).length);
                                        const isLowScore = avg < 2.5;
                                        const isLowAttendance = student.attendancePct < 80;

                                        return (
                                            <motion.div
                                                key={student.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                className="flex items-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-sm truncate">{student.name}</p>
                                                    <div className="flex gap-1.5 mt-1 flex-wrap">
                                                        {isLowScore && (
                                                            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold">
                                                                Score: {avg.toFixed(1)}
                                                            </span>
                                                        )}
                                                        {isLowAttendance && (
                                                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                                                                {student.attendancePct}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4"
                                    >
                                        <PartyPopper className="text-green-500" size={32} />
                                    </motion.div>
                                    <p className="font-bold text-gray-700">All students on track!</p>
                                    <p className="text-sm text-gray-400">No immediate concerns</p>
                                </div>
                            )}
                        </ChartCard>
                    </motion.div>
                )}

                {selectedMetric === 'attendance' && (
                    <motion.div
                        key="attendance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Attendance Trend */}
                        <ChartCard title="Weekly Attendance Trend" icon={<Activity size={18} />} delay={0.1}>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceTrend}>
                                        <defs>
                                            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="fullWeek" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[70, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                background: 'white',
                                                border: 'none',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="rate"
                                            stroke="#22c55e"
                                            strokeWidth={3}
                                            fill="url(#attendanceGradient)"
                                            dot={{ fill: '#22c55e', strokeWidth: 2, r: 5 }}
                                            activeDot={{ r: 8, fill: '#22c55e' }}
                                            name="Attendance %"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="target"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={false}
                                            name="Target (90%)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>

                        {/* Grade Attendance Breakdown */}
                        <div className="grid grid-cols-5 gap-4">
                            {gradeData.map((grade, idx) => (
                                <motion.div
                                    key={grade.grade}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg transition-all"
                                >
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{grade.grade}</p>
                                    <p className="text-3xl font-black text-gray-900">{grade.attendance}%</p>
                                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${grade.attendance}%` }}
                                            transition={{ delay: 0.4 + idx * 0.1, duration: 1 }}
                                            className={clsx(
                                                "h-full rounded-full",
                                                grade.attendance >= 90 ? "bg-green-500" :
                                                    grade.attendance >= 80 ? "bg-yellow-500" : "bg-red-500"
                                            )}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{grade.students} students</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Analytics;
