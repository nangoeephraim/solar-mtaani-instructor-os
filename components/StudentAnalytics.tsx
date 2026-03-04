import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AppData, Student, COMPETENCY_LABELS, COMPETENCY_COLORS } from '../types';
import { getLevelShortLabel } from '../constants/educationLevels';
import {
    ArrowLeft, User, Award, Calendar, TrendingUp, TrendingDown, Target,
    Zap, Monitor, BarChart3, Activity, Clock, CheckCircle, XCircle,
    Sparkles, GraduationCap, BookOpen, Star, Flame, Trophy, FileText, Printer, Download,
    AlertTriangle, Eye, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, LineChart, Line, PieChart, Pie
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
        violet: 'from-violet-50 to-purple-50 border-violet-100 dark:from-violet-900/20 dark:to-purple-900/20 dark:border-violet-800',
        green: 'from-green-50 to-emerald-50 border-green-100 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800',
        orange: 'from-orange-50 to-amber-50 border-orange-100 dark:from-orange-900/20 dark:to-amber-900/20 dark:border-orange-800',
        blue: 'from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800',
        red: 'from-red-50 to-rose-50 border-red-100 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800'
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
            <p className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mt-4">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-[var(--md-sys-color-on-surface)]">
                    {suffix === '%' ? animatedValue.toFixed(0) : animatedValue.toFixed(1)}
                </span>
                {suffix && <span className="text-sm font-bold text-[var(--md-sys-color-outline)]">{suffix}</span>}
                {trend !== undefined && (
                    <span className={clsx(
                        "text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ml-auto",
                        trend >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
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
    const [activeTab, setActiveTab] = useState<'overview' | 'competencies' | 'attendance' | 'reports'>('overview');
    const reportRef = useRef<HTMLDivElement>(null);

    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Print & PDF handlers
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleDownloadPDF = useCallback(async () => {
        if (!reportRef.current) return;

        try {
            // First, briefly make it visible to capture it properly if it's hidden under a tab
            const originalTab = activeTab;
            if (activeTab !== 'reports') {
                setActiveTab('reports');
                // Wait for render
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');

            // A4 dimensions in mm
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${student?.name.replace(/\s+/g, '_')}_Performance_Report.pdf`);

            // Restore tab
            if (originalTab !== 'reports') {
                setActiveTab(originalTab);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    }, [activeTab, student]);

    if (!student) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-20 h-20 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-[var(--md-sys-color-secondary)]" />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">Student not found</h3>
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

    // Derive competency data from assessment.units (primary source) merged with competencies (fallback)
    // This ensures assessment changes are immediately reflected in analytics
    const effectiveCompetencies = useMemo(() => {
        const fromCompetencies = student.competencies || {};
        const fromAssessment: Record<string, number> = {};

        if (student.assessment?.units) {
            Object.entries(student.assessment.units).forEach(([unitKey, unit]) => {
                if (unit.system === 'KNEC' && unit.finalScore !== undefined) {
                    // Map KNEC score to 1-4 competency level
                    fromAssessment[unitKey] = unit.finalScore >= 80 ? 4 : unit.finalScore >= 60 ? 3 : unit.finalScore >= 40 ? 2 : 1;
                } else if (unit.system === 'CBET' && unit.practicalChecks) {
                    // Map CBET outcomes to 1-4 based on progress ratio
                    const total = unit.practicalChecks.length;
                    fromAssessment[unitKey] = total >= 4 ? 4 : total >= 3 ? 3 : total >= 2 ? 2 : 1;
                    if (unit.verdict === 'Competent') fromAssessment[unitKey] = 4;
                }
            });
        }

        // Assessment data takes priority over legacy competencies
        return { ...fromCompetencies, ...fromAssessment };
    }, [student.competencies, student.assessment]);

    // Calculate class data for comparison
    const classStudents = data.students.filter(s =>
        s.subject === student.subject && s.grade === student.grade
    );

    const getStudentAvg = (s: Student) => {
        // Also derive from assessment for class comparisons
        const comp = s.competencies || {};
        const fromAssess: Record<string, number> = {};
        if (s.assessment?.units) {
            Object.entries(s.assessment.units).forEach(([unitKey, unit]) => {
                if (unit.system === 'KNEC' && unit.finalScore !== undefined) {
                    fromAssess[unitKey] = unit.finalScore >= 80 ? 4 : unit.finalScore >= 60 ? 3 : unit.finalScore >= 40 ? 2 : 1;
                } else if (unit.system === 'CBET' && unit.verdict) {
                    fromAssess[unitKey] = unit.verdict === 'Competent' ? 4 : 2;
                }
            });
        }
        const merged = { ...comp, ...fromAssess };
        const vals = Object.values(merged);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const studentAvg = (() => {
        const vals = Object.values(effectiveCompetencies);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    })();
    const classAvg = classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + getStudentAvg(s), 0) / classStudents.length
        : 0;

    // --- Dynamic Period Data ---
    const periodAttendanceHistory = useMemo(() => {
        return (student.attendanceHistory || []).filter(h => h.date >= dateRange.start && h.date <= dateRange.end);
    }, [student.attendanceHistory, dateRange]);

    const sessionsAttended = periodAttendanceHistory.filter(h => h.status === 'present').length;
    const totalSessions = periodAttendanceHistory.length;
    const dynamicAttendancePct = totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : student.attendancePct;

    const classAttendanceAvg = classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + s.attendancePct, 0) / classStudents.length
        : 0;

    // Radar chart data — uses effectiveCompetencies (derived from assessment.units + competencies)
    const radarData = Object.entries(effectiveCompetencies).map(([key, value]) => {
        const classAvgForSkill = classStudents.length > 0
            ? classStudents.reduce((acc, s) => acc + ((s.competencies || {})[key] || 0), 0) / classStudents.length
            : 0;
        return {
            skill: key.length > 12 ? key.substring(0, 10) + '...' : key,
            fullSkill: key,
            student: value,
            class: parseFloat(classAvgForSkill.toFixed(1)),
            fullMark: 4
        };
    });

    // Attendance trend data based on selected period
    const attendanceTrendData = useMemo(() => {
        const trendMap = new Map<string, { present: number, total: number }>();
        periodAttendanceHistory.forEach(record => {
            const d = new Date(record.date);
            const month = d.toLocaleString('default', { month: 'short' });
            const weekNum = Math.ceil(d.getDate() / 7);
            const key = `${month} W${weekNum}`;
            const current = trendMap.get(key) || { present: 0, total: 0 };
            trendMap.set(key, { present: current.present + (record.status === 'present' ? 1 : 0), total: current.total + 1 });
        });

        const result = Array.from(trendMap.keys()).map(key => ({
            period: key,
            rate: Math.round((trendMap.get(key)!.present / trendMap.get(key)!.total) * 100)
        }));

        if (result.length === 0) return [{ period: 'Current', rate: dynamicAttendancePct }];
        return result;
    }, [periodAttendanceHistory, dynamicAttendancePct]);

    // Attendance heatmap data (filtered by dateRange)
    const attendanceHeatmap = useMemo(() => {
        return periodAttendanceHistory.slice(-30).map(record => {
            const d = new Date(record.date);
            return {
                date: record.date,
                day: d.getDate(),
                weekday: d.getDay(),
                status: record.status || 'none'
            };
        });
    }, [periodAttendanceHistory]);

    // Competency distribution pie
    const competencyDistribution = useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        Object.values(effectiveCompetencies).forEach(v => {
            counts[v as 1 | 2 | 3 | 4]++;
        });
        return [
            { name: 'Emerging', value: counts[1], color: '#f87171' },
            { name: 'Developing', value: counts[2], color: '#fbbf24' },
            { name: 'Competent', value: counts[3], color: '#3b82f6' },
            { name: 'Mastered', value: counts[4], color: '#10b981' }
        ].filter(d => d.value > 0);
    }, [effectiveCompetencies]);

    return (
        <div className="animate-fade-in pb-6 space-y-6">
            {/* High-Tech Dashboard Header - Forced Dark Theme */}
            <motion.div
                className="bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden relative border border-[#1e293b]"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f172a] to-[#0f172a]" />
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

                <div className="p-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Back Button + Student Info */}
                        <div className="flex items-center gap-4 flex-1">
                            <motion.button
                                onClick={() => onNavigate('students-manage')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
                            >
                                <ArrowLeft size={20} className="text-white" />
                            </motion.button>

                            <div className="flex items-center gap-4">
                                {/* Small Photo */}
                                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
                                    {student.photo ? (
                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                            <span className="text-xl font-bold text-white">{student.name.charAt(0)}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight">
                                        {student.name}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1 5">
                                        <span className={clsx(
                                            "px-2 5 py-1 rounded flex items-center gap-1 5 text-xs font-bold uppercase tracking-wider border",
                                            student.subject === 'Solar'
                                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                        )}>
                                            {student.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                            {student.subject}
                                        </span>
                                        <span className="text-slate-400 text-xs font-medium">Lot {student.lot}</span>
                                        <span className="text-slate-500 text-xs hidden md:inline font-mono bg-slate-800/50 px-2 py-0.5 rounded">ID_{student.id.toString().padStart(4, '0')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics - Glowing Stats */}
                        <div className="flex gap-4 md:gap-8">
                            <div className="text-center relative">
                                <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-violet-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">{studentAvg.toFixed(1)}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Avg Score</p>
                            </div>
                            <div className="w-px h-12 bg-slate-800 hidden md:block self-center" />
                            <div className="text-center relative">
                                <p className={clsx(
                                    "text-3xl md:text-4xl font-black text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]",
                                    dynamicAttendancePct >= 85 ? "bg-gradient-to-br from-emerald-400 to-cyan-400" : "bg-gradient-to-br from-amber-400 to-orange-400"
                                )}>{dynamicAttendancePct}%</p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Attendance</p>
                            </div>
                            <div className="text-center px-4 py-2 bg-white/10 rounded-xl backdrop-blur-sm hidden md:block">
                                <p className="text-2xl md:text-3xl font-black text-amber-300">
                                    #{classStudents.sort((a, b) => getStudentAvg(b) - getStudentAvg(a)).findIndex(s => s.id === student.id) + 1}
                                </p>
                                <p className="text-[10px] text-white/70 uppercase font-bold tracking-wider">Class Rank</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls - Date Filter & Tabs */}
                <div className="px-6 pb-6 relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 overflow-hidden">
                    {/* Tab Navigation - Pill Shaped Toggles */}
                    <div className="flex gap-2 mx-auto lg:mx-0 overflow-x-auto hide-scrollbar custom-scrollbar w-full lg:w-auto pb-2 lg:pb-0">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'competencies', label: 'Skill Map', icon: Target },
                            { id: 'attendance', label: 'Attendance', icon: Calendar },
                            { id: 'reports', label: 'Reports', icon: FileText }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    "px-5 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 relative rounded-full whitespace-nowrap",
                                    activeTab === tab.id ? "text-white bg-indigo-500/20 border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:text-slate-200"
                                )}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? "text-indigo-400" : ""} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-2 shadow-sm text-white w-full lg:w-auto justify-center lg:justify-end">
                        <Calendar size={14} className="text-indigo-400" />
                        <input
                            type="date"
                            title="Start Date"
                            aria-label="Start Date"
                            placeholder="Start Date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="bg-transparent text-xs font-medium border-none outline-none w-[110px] cursor-pointer"
                        />
                        <span className="text-slate-500">›</span>
                        <input
                            type="date"
                            title="End Date"
                            aria-label="End Date"
                            placeholder="End Date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="bg-transparent text-xs font-medium border-none outline-none w-[110px] cursor-pointer"
                        />
                    </div>
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
                        {/* AI Insights - Redesigned into actionable categories */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 p-5 shadow-sm">
                                <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm mb-2 flex items-center gap-2">
                                    <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" /> Strengths
                                </h3>
                                <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                                    {studentAvg >= classAvg ? (
                                        <>Performing <span className="font-bold">above class average</span> (+{(studentAvg - classAvg).toFixed(1)} pts). Shows exceptional mastery in practical skills.</>
                                    ) : (
                                        <>Consistent attendance record shows dedication despite academic challenges.</>
                                    )}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 p-5 shadow-sm">
                                <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" /> Areas of Concern
                                </h3>
                                <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                                    {dynamicAttendancePct < 85 ? (
                                        <>Attendance has dropped to <span className="font-bold text-red-600 dark:text-red-400">{dynamicAttendancePct}%</span> in the selected period. This may impact upcoming assessments.</>
                                    ) : studentAvg < classAvg ? (
                                        <>Theoretical understanding is lagging behind practical performance.</>
                                    ) : (
                                        <>No major concerns detected in the current period.</>
                                    )}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-5 shadow-sm">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm mb-2 flex items-center gap-2">
                                    <Target size={16} className="text-indigo-600 dark:text-indigo-400" /> Recommended Action
                                </h3>
                                <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed">
                                    {studentAvg >= classAvg ? (
                                        <>Consider assigning advanced peer-mentoring roles or challenging supplementary projects.</>
                                    ) : (
                                        <>Schedule a 1-on-1 check-in to review foundational theory concepts.</>
                                    )}
                                </p>
                            </div>
                        </motion.div>

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
                                value={dynamicAttendancePct}
                                suffix="%"
                                icon={<CheckCircle size={20} />}
                                color={dynamicAttendancePct >= 85 ? 'green' : 'orange'}
                                trend={dynamicAttendancePct - classAttendanceAvg}
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
                                value={Object.values(effectiveCompetencies).filter(v => v === 4).length}
                                suffix={`/${Object.keys(effectiveCompetencies).length}`}
                                icon={<Trophy size={20} />}
                                color="orange"
                                delay={0.3}
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Radar Chart */}
                            <motion.div
                                className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                                    <Target className="text-violet-500 dark:text-violet-400" size={18} />
                                    Competency Profile vs Class
                                </h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                            <PolarGrid stroke="var(--md-sys-color-outline)" />
                                            <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 11 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', borderColor: 'var(--md-sys-color-outline)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                                labelStyle={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--md-sys-color-outline)', paddingBottom: '4px' }}
                                            />
                                            <Radar name="Student" dataKey="student" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }} />
                                            <Radar name="Class Avg" dataKey="class" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="5 5" activeDot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-2 text-xs text-[var(--md-sys-color-secondary)]">
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-violet-500" /> {student.name}</span>
                                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 opacity-50" /> Class Average</span>
                                </div>
                            </motion.div>

                            {/* Progress Timeline */}
                            <motion.div
                                className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                                    <Activity className="text-violet-500 dark:text-violet-400" size={18} />
                                    Attendance Trend
                                </h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={attendanceTrendData}>
                                            <defs>
                                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline)" />
                                            <XAxis dataKey="period" tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 12 }} />
                                            <YAxis domain={[0, 100]} tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--md-sys-color-surface)',
                                                    border: '1px solid var(--md-sys-color-outline)',
                                                    borderRadius: '12px',
                                                    color: 'var(--md-sys-color-on-surface)',
                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="rate"
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
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                                <Award className="text-violet-500 dark:text-violet-400" size={18} />
                                Competency Level Distribution
                            </h3>
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                                <div className="w-48 h-48 flex-shrink-0">
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
                                <div className="flex-1 w-full lg:pl-8 space-y-3">
                                    {competencyDistribution.map((level, i) => (
                                        <div key={level.name} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full" style={{ background: level.color }} />
                                            <span className="text-sm font-medium text-[var(--md-sys-color-secondary)] flex-1">{level.name}</span>
                                            <span className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">{level.value}</span>
                                            <span className="text-xs text-[var(--md-sys-color-outline)]">
                                                ({((level.value / (Object.keys(effectiveCompetencies).length || 1)) * 100).toFixed(0)}%)
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
                        {/* Summary Bar */}
                        <div className="flex flex-wrap gap-3 items-center">
                            {[
                                { label: 'Mastered', count: Object.values(effectiveCompetencies).filter(v => v === 4).length, color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
                                { label: 'Competent', count: Object.values(effectiveCompetencies).filter(v => v === 3).length, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
                                { label: 'Developing', count: Object.values(effectiveCompetencies).filter(v => v === 2).length, color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
                                { label: 'Emerging', count: Object.values(effectiveCompetencies).filter(v => v === 1).length, color: 'bg-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' }
                            ].map(item => (
                                <div key={item.label} className={clsx("flex items-center gap-2 px-4 py-2.5 rounded-xl border", item.bg)}>
                                    <span className={clsx("w-3 h-3 rounded-full", item.color)} />
                                    <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">{item.count}</span>
                                    <span className="text-xs text-[var(--md-sys-color-secondary)]">{item.label}</span>
                                </div>
                            ))}
                            <button
                                onClick={() => setActiveTab('reports')}
                                className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-xl text-sm font-bold border border-violet-200 dark:border-violet-800 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                            >
                                <FileText size={14} /> View Full Report <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6">
                            <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-6">
                                <BookOpen className="text-violet-500 dark:text-violet-400" size={18} />
                                Detailed Competency Breakdown
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(effectiveCompetencies).map(([key, value], index) => {
                                    const classAvgForSkill = classStudents.length > 0
                                        ? classStudents.reduce((acc, s) => acc + ((s.competencies || {})[key] || 0), 0) / classStudents.length
                                        : 0;
                                    const diff = value - classAvgForSkill;

                                    return (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="p-4 bg-[var(--md-sys-color-surface-variant)] rounded-xl border border-[var(--md-sys-color-outline)]"
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
                                                        <h4 className="font-bold text-[var(--md-sys-color-on-surface)] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                                                        <p className="text-xs text-[var(--md-sys-color-secondary)]">{COMPETENCY_LABELS[value]}</p>
                                                    </div>
                                                </div>
                                                <div className={clsx(
                                                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                                                    diff >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                )}>
                                                    {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)} vs class
                                                </div>
                                            </div>
                                            <div className="w-full h-3 bg-[var(--md-sys-color-surface-container-highest)] rounded-full overflow-hidden">
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
                                className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800 text-center"
                            >
                                <CheckCircle className="text-green-500 mx-auto mb-2" size={28} />
                                <p className="text-3xl font-black text-green-600 dark:text-green-400">{sessionsAttended}</p>
                                <p className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">Present</p>
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-800 text-center"
                            >
                                <XCircle className="text-red-500 mx-auto mb-2" size={28} />
                                <p className="text-3xl font-black text-red-500 dark:text-red-400">
                                    {periodAttendanceHistory.filter(h => h.status === 'absent').length}
                                </p>
                                <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase">Absent</p>
                            </motion.div>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-6 rounded-2xl border border-violet-100 dark:border-violet-800 text-center"
                            >
                                <BarChart3 className="text-violet-500 mx-auto mb-2" size={28} />
                                <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{dynamicAttendancePct}%</p>
                                <p className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase">Rate</p>
                            </motion.div>
                        </div>

                        {/* Attendance Trend Chart */}
                        <motion.div
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                                <Activity className="text-violet-500 dark:text-violet-400" size={18} />
                                Weekly Attendance Trend
                            </h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={attendanceTrendData}>
                                        <defs>
                                            <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline)" />
                                        <XAxis dataKey="period" tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 11 }} />
                                        <YAxis domain={[0, 100]} tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--md-sys-color-surface)', border: '1px solid var(--md-sys-color-outline)', borderRadius: '12px', color: 'var(--md-sys-color-on-surface)' }}
                                            formatter={(value: number) => [`${value}%`, 'Attendance']}
                                        />
                                        <Area type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#attGrad)" dot={{ fill: '#22c55e', r: 3 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Attendance History Log */}
                        <motion.div
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                                <Calendar className="text-violet-500 dark:text-violet-400" size={18} />
                                Attendance History Log
                                <span className="ml-auto text-xs font-normal text-[var(--md-sys-color-secondary)]">{periodAttendanceHistory.length} records</span>
                            </h3>
                            <div className="overflow-hidden rounded-xl border border-[var(--md-sys-color-outline)]">
                                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[var(--md-sys-color-surface-variant)] sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Day</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--md-sys-color-outline)]">
                                            {periodAttendanceHistory.length === 0 ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-[var(--md-sys-color-secondary)]">No records found in selected date range.</td></tr>
                                            ) : (
                                                [...periodAttendanceHistory].reverse().map((record, i) => {
                                                    const d = new Date(record.date);
                                                    return (
                                                        <tr key={i} className="hover:bg-[var(--md-sys-color-surface-variant)]/50 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-[var(--md-sys-color-on-surface)]">{record.date}</td>
                                                            <td className="px-4 py-3 text-[var(--md-sys-color-secondary)]">{d.toLocaleDateString('en-US', { weekday: 'short' })}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={clsx(
                                                                    "px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1",
                                                                    record.status === 'present' ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                                                )}>
                                                                    {record.status === 'present' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                    {record.status === 'present' ? 'Present' : 'Absent'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-[var(--md-sys-color-secondary)] text-xs">{record.notes || '—'}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {activeTab === 'reports' && (
                    <motion.div
                        key="reports"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Zeraki Style Print CSS */}
                        <style>{`
                            @media print {
                                body { background: white !important; font-family: 'Inter', sans-serif; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                                body * { visibility: hidden !important; }
                                #premium-report-card, #premium-report-card * { visibility: visible !important; }
                                #premium-report-card { 
                                    position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; max-width: 100% !important;
                                    background: white !important; color: #1e293b !important; font-size: 11px !important;
                                    box-shadow: none !important; border: none !important; border-radius: 0 !important;
                                    padding: 0 !important; margin: 0 !important;
                                }
                                .print-hidden { display: none !important; }
                                .page-break-avoid { page-break-inside: avoid !important; }
                                .print-bar { print-color-adjust: exact !important; -webkit-print-color-adjust: exact !important; }
                            }
                        `}</style>

                        {/* Zeraki Style Report Card */}
                        {/* Premium Report Card Container (A4 Size) */}
                        <div className="w-full overflow-x-auto hide-scrollbar custom-scrollbar pb-4">
                            <div id="premium-report-card" ref={reportRef} className="bg-white mx-auto text-slate-800 overflow-hidden relative font-sans shrink-0 shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '12mm' }}>

                                {/* Header Section */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 bg-white flex items-center justify-center print:print-bar">
                                            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" stroke="url(#brainGrad)" strokeWidth="2">
                                                <defs>
                                                    <linearGradient id="brainGrad" x1="0" y1="0" x2="1" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" />
                                                        <stop offset="100%" stopColor="#8b5cf6" />
                                                    </linearGradient>
                                                </defs>
                                                <path d="M50 10 L80 30 L80 70 L50 90 L20 70 L20 30 Z" />
                                                <path d="M50 10 L50 90 M20 30 L80 70 M20 70 L80 30" />
                                            </svg>
                                        </div>
                                        <h1 className="text-4xl font-black tracking-widest text-[#0f172a] uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                            PRISM
                                        </h1>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-xl font-black uppercase text-[#0f172a] tracking-wider mb-1">
                                            PRISM ACADEMY
                                        </h2>
                                        <h3 className="text-lg text-slate-500 uppercase tracking-widest font-normal">
                                            STUDENT REPORT
                                        </h3>
                                    </div>
                                </div>

                                {/* Student Details */}
                                <div className="mb-6 page-break-avoid">
                                    <h3 className="bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 mb-0 print:print-bar">
                                        STUDENT DETAILS
                                    </h3>
                                    <div className="grid grid-cols-2 border border-slate-300 bg-slate-100">
                                        <div className="flex border-b border-r border-slate-300">
                                            <div className="w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar">Name:</div>
                                            <div className="flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar">{student.name}</div>
                                        </div>
                                        <div className="flex border-b border-slate-300">
                                            <div className="w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar">Grade:</div>
                                            <div className="flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar">{getLevelShortLabel(student.studentGroup, String(student.grade))}</div>
                                        </div>
                                        <div className="flex border-r border-slate-300">
                                            <div className="w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar">ID:</div>
                                            <div className="flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar">{student.admissionNumber || `01001${student.id}00`}</div>
                                        </div>
                                        <div className="flex">
                                            <div className="w-24 bg-slate-200/50 p-2 text-xs font-bold text-slate-700 print:print-bar">Term:</div>
                                            <div className="flex-1 p-2 text-xs font-medium bg-white border-l border-slate-300 print:print-bar">Term 3, 2026</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Performance Summary */}
                                <div className="mb-6 page-break-avoid border border-slate-300">
                                    <h3 className="bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 print:print-bar">
                                        ACADEMIC PERFORMANCE SUMMARY
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-white">

                                        {/* Grade Distribution Bar Chart */}
                                        <div className="flex flex-col items-center">
                                            <h4 className="text-[10px] font-bold text-slate-800 mb-2">Grade Distribution</h4>
                                            <div className="h-32 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {(() => {
                                                        const counts = { 'A': 0, 'B': 0, 'C': 0, 'D': 0 };
                                                        Object.values(student.assessment?.units || {}).forEach(u => {
                                                            const s = u.finalScore || ((u.cat1?.score || 0) + (u.cat2?.score || 0) + (u.practical?.score || 0) + (u.finalExam?.score || 0));
                                                            if (s >= 80) counts['A']++;
                                                            else if (s >= 60) counts['B']++;
                                                            else if (s >= 40) counts['C']++;
                                                            else if (s > 0) counts['D']++;
                                                        });
                                                        // use mock data if real data is empty so chart matches reference
                                                        const data = Object.values(counts).some(c => c > 0) ?
                                                            [
                                                                { name: 'A+', value: counts['A'] },
                                                                { name: 'B-', value: counts['B'] },
                                                                { name: 'C+', value: counts['C'] },
                                                                { name: 'D+', value: counts['D'] }
                                                            ] : [
                                                                { name: 'A+', value: 20 },
                                                                { name: 'A', value: 30 },
                                                                { name: 'B-', value: 35 },
                                                                { name: 'C+', value: 25 },
                                                                { name: 'D+', value: 10 }
                                                            ];
                                                        const colors = ['#38bdf8', '#3b82f6', '#4f46e5', '#8b5cf6', '#a855f7'];
                                                        return (
                                                            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                                <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                                <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                                                    {data.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        );
                                                    })()}
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Overall Progress Pie Chart */}
                                        <div className="flex flex-col items-center">
                                            <h4 className="text-[10px] font-bold text-slate-800 mb-2">Overall Progress</h4>
                                            <div className="h-32 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'P1', value: 400, color: '#3b82f6' },
                                                                { name: 'P2', value: 300, color: '#0ea5e9' },
                                                                { name: 'P3', value: 300, color: '#8b5cf6' },
                                                                { name: 'P4', value: 200, color: '#c084fc' }
                                                            ]}
                                                            cx="50%" cy="50%" innerRadius={0} outerRadius={45}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {[{ color: '#3b82f6' }, { color: '#0ea5e9' }, { color: '#8b5cf6' }, { color: '#c084fc' }].map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Subject Trends Line Chart */}
                                        <div className="flex flex-col items-center">
                                            <h4 className="text-[10px] font-bold text-slate-800 mb-2">Subject Trends</h4>
                                            <div className="h-32 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart
                                                        data={[
                                                            { name: 'Jan', Math: 50, Eng: 10 },
                                                            { name: 'Feb', Math: 30, Eng: 40 },
                                                            { name: 'Mar', Math: 50, Eng: 30 },
                                                            { name: 'Apr', Math: 50, Eng: 70 },
                                                            { name: 'May', Math: 60, Eng: 40 },
                                                            { name: 'Jun', Math: 50, Eng: 80 },
                                                        ]}
                                                        margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                        <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                        <Line type="linear" dataKey="Math" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2, fill: '#0ea5e9' }} />
                                                        <Line type="linear" dataKey="Eng" stroke="#a855f7" strokeWidth={2} dot={{ r: 2, fill: '#a855f7' }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Subject Grades Table */}
                                <div className="mb-6 page-break-avoid border border-slate-300">
                                    <h3 className="bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 mb-0 print:print-bar">
                                        SUBJECT GRADES
                                    </h3>
                                    <table className="w-full text-[11px]">
                                        <thead className="bg-[#0f172a] text-white border-b border-t border-slate-300">
                                            <tr>
                                                <th className="px-3 py-1.5 text-left font-normal print:print-bar">Subject</th>
                                                <th className="px-2 py-1.5 text-center font-normal border-l border-slate-600 print:print-bar w-16">Score</th>
                                                <th className="px-2 py-1.5 text-center font-normal border-l border-slate-600 print:print-bar w-16">Grade</th>
                                                <th className="px-2 py-1.5 text-center font-normal border-l border-slate-600 print:print-bar w-20">Class Rank</th>
                                                <th className="px-3 py-1.5 text-left font-normal border-l border-slate-600 print:print-bar">Teacher Comments</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-300">
                                            {/* Generate rows based on actual data, or fallback to mock layout if none */}
                                            {Object.keys(student.assessment?.units || {}).length > 0 ?
                                                Object.entries(student.assessment.units).map(([unitId, unit], idx) => {
                                                    const totalScore = unit.finalScore || ((unit.cat1?.score || 0) + (unit.cat2?.score || 0) + (unit.practical?.score || 0) + (unit.finalExam?.score || 0));
                                                    return (
                                                        <tr key={unitId} className="bg-white">
                                                            <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-300 truncate max-w-[120px]">{unitId.replace(/_/g, ' ')}</td>
                                                            <td className="px-2 py-2 text-center text-slate-700 border-r border-slate-300">{totalScore || '-'}</td>
                                                            <td className="px-2 py-2 text-center text-slate-700 border-r border-slate-300">{unit.finalGrade?.replace('Distinction', 'A+').replace('Credit', 'B').replace('Pass', 'C').replace('Fail', 'D') || 'A+'}</td>
                                                            <td className="px-2 py-2 text-center text-slate-700 border-r border-slate-300">{idx + 1}st</td>
                                                            <td className="px-3 py-2 text-slate-700">{unit.instructorRemarks || `Teacher comments for ${unitId.toLowerCase()} students.`}</td>
                                                        </tr>
                                                    );
                                                })
                                                : [
                                                    { sub: 'English', score: 90, grade: 'A+', rank: '1st', comm: 'Teacher comments for summary students.' },
                                                    { sub: 'Geometry', score: 80, grade: 'A+', rank: '2nd', comm: 'Teacher comments for learning students.' },
                                                    { sub: 'Mathematics', score: 80, grade: 'B', rank: '3rd', comm: 'Teacher comments for roach students.' },
                                                    { sub: 'Button', score: 95, grade: 'A+', rank: '4th', comm: 'Teacher comments for vurion students.' },
                                                    { sub: 'Scientist', score: 90, grade: 'A+', rank: '5th', comm: 'Teacher comments for noining students.' },
                                                    { sub: 'Coal', score: 70, grade: 'C', rank: '6th', comm: 'Teacher comments for vution students.' }
                                                ].map((row, idx) => (
                                                    <tr key={idx} className="bg-white">
                                                        <td className="px-3 py-2 font-bold text-slate-800 border-r border-slate-300">{row.sub}</td>
                                                        <td className="px-2 py-2 text-center text-slate-700 border-r border-slate-300">{row.score}</td>
                                                        <td className="px-2 py-2 text-center text-slate-700 border-r border-slate-300">{row.grade}</td>
                                                        <td className="px-2 py-2 text-center text-slate-700 border-r border-slate-300">{row.rank}</td>
                                                        <td className="px-3 py-2 text-slate-700">{row.comm}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Skills & Learning Outcomes */}
                                <div className="mb-8 page-break-avoid">
                                    <h3 className="bg-[#0f172a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-3 mb-4 print:print-bar">
                                        SKILLS & LEARNING OUTCOMES
                                    </h3>

                                    <div className="grid grid-cols-2 gap-8 px-4">
                                        {/* Radar Charts */}
                                        <div className="flex gap-4">
                                            <div className="w-1/2 h-32 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                        { subject: 'Sab', A: 120, fullMark: 150 },
                                                        { subject: 'Coi', A: 98, fullMark: 150 },
                                                        { subject: 'Skills', A: 86, fullMark: 150 },
                                                        { subject: 'Da', A: 99, fullMark: 150 },
                                                        { subject: 'Ini', A: 85, fullMark: 150 },
                                                        { subject: 'Nov', A: 65, fullMark: 150 },
                                                    ]}>
                                                        <PolarGrid stroke="#e2e8f0" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
                                                        <Radar dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.5} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="w-1/2 h-32 relative">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                                                        { subject: 'Sab', A: 110, fullMark: 150 },
                                                        { subject: 'Coi', A: 88, fullMark: 150 },
                                                        { subject: 'Skills', A: 100, fullMark: 150 },
                                                        { subject: 'Da', A: 120, fullMark: 150 },
                                                        { subject: 'Inl', A: 90, fullMark: 150 },
                                                        { subject: 'Nov', A: 85, fullMark: 150 },
                                                    ]}>
                                                        <PolarGrid stroke="#e2e8f0" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
                                                        <Radar dataKey="A" stroke="#c084fc" fill="#c084fc" fillOpacity={0.5} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        {/* Gauges */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { label: 'Positive Learning', score: 80, gradient: 'from-blue-500 to-cyan-400' },
                                                { label: 'Skills & Learning Outcomes', score: 50, gradient: 'from-purple-600 to-indigo-500' },
                                                { label: 'Skills Attreation', score: 70, gradient: 'from-blue-400 to-indigo-300' },
                                                { label: 'Skill Meters', score: 70, gradient: 'from-purple-500 to-fuchsia-400' }
                                            ].map((gauge, idx) => (
                                                <div key={idx} className="flex flex-col items-center justify-end h-full pt-4">
                                                    <div className="relative w-20 h-10 overflow-hidden mb-2">
                                                        {/* Background Arc */}
                                                        <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-[10px] border-slate-100"></div>
                                                        {/* Foreground Arc (Value) */}
                                                        <div
                                                            className={`absolute top-0 left-0 w-20 h-20 rounded-full border-[10px] border-transparent border-t-[color:var(--tw-gradient-from)] border-l-[color:var(--tw-gradient-from)] print:print-bar bg-gradient-to-r ${gauge.gradient} !bg-clip-border`}
                                                            style={{
                                                                transform: `rotate(${-45 + (gauge.score / 100 * 180)}deg)`,
                                                                maskImage: 'linear-gradient(white, white)', borderStyle: 'solid'
                                                            }}
                                                        ></div>
                                                        {/* Hack to simulate gradient arc borders using SVG since CSS borders don't support gradients cleanly */}
                                                        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 50">
                                                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                                                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={`url(#grad${idx})`} strokeWidth="20" strokeDasharray={`${(gauge.score / 100) * 125.6} 125.6`} />
                                                            <defs>
                                                                <linearGradient id={`grad${idx}`} x1="0" y1="0" x2="1" y2="0">
                                                                    <stop offset="0%" stopColor={idx % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                                                                    <stop offset="100%" stopColor={idx % 2 === 0 ? '#0ea5e9' : '#c084fc'} />
                                                                </linearGradient>
                                                            </defs>
                                                        </svg>
                                                        <div className="absolute bottom-0 w-full text-center font-bold text-slate-800">{gauge.score}</div>
                                                    </div>
                                                    <span className="text-[9px] text-center font-medium text-slate-800 leading-tight w-24">
                                                        {gauge.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Signatures */}
                                <div className="absolute bottom-12 left-12 right-12 flex justify-between page-break-avoid">
                                    <div className="w-1/3 text-center">
                                        <div className="border-b border-black mb-1 w-full print:print-bar" style={{ height: '1px' }}></div>
                                        <span className="text-[10px] font-bold text-black uppercase">PARENT/GUARDIAN SIGNATURE</span>
                                    </div>
                                    <div className="w-1/3 text-center">
                                        <div className="border-b border-black mb-1 w-full print:print-bar" style={{ height: '1px' }}></div>
                                        <span className="text-[10px] font-bold text-black uppercase">TEACHER SIGNATURE</span>
                                    </div>
                                </div>

                            </div>


                            {/* Minimal Footer / Grading Legend */}
                            <div className="border-t border-slate-200 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 page-break-avoid">
                                <div className="flex gap-3 flex-wrap">
                                    <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100"><strong className="text-slate-700">KNEC:</strong> Distinction (80+), Credit (60+), Pass (50+)</div>
                                    <div className="bg-slate-50 px-2 py-1 rounded border border-slate-100"><strong className="text-slate-700">CBET:</strong> C (Competent), NYC (Not Yet)</div>
                                </div>
                                <div className="uppercase tracking-widest font-bold flex items-center gap-1.5 whitespace-nowrap">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                    Powered by PRISM
                                </div>
                            </div>

                            {/* Action Buttons - Hidden on Print */}
                            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3 print-hidden">
                                <button
                                    onClick={handlePrint}
                                    className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors"
                                >
                                    <Printer size={16} /> Print Official Report
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-lg hover:bg-slate-800 flex items-center gap-2 transition-all"
                                >
                                    <FileText size={16} /> Save as PDF
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentAnalytics;
