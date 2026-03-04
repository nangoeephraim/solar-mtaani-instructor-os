import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS } from '../types';
import { getLevelShortLabel } from '../constants/educationLevels';
import { getSettings } from '../services/storageService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Users, Award, AlertTriangle, ChevronRight, BarChart3, PieChart as PieChartIcon, Activity, Zap, Monitor, Star, Target, Clock, ArrowUpRight, Sparkles, Download, Lightbulb, Calendar, RefreshCw, FileText, ChevronDown, PartyPopper, Brain, Printer, GitCompare, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeData } from '../services/intelligenceService';
import { fetchAnalyticsSummary } from '../services/storageService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ClassAveragesResult, SubjectComparisonResult, AtRiskStudentResult, GradeDistributionResult } from '../types';
import { supabase } from '../services/supabase';
import { useToast } from './Toast';

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
            className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-xl transition-all overflow-hidden group"
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
                                trend === 'up' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            )}
                        >
                            {trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {trend === 'up' ? '+5%' : '-3%'}
                        </motion.div>
                    )}
                </div>

                <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-0.5">{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[var(--md-sys-color-on-surface)] tabular-nums">{animatedValue}</span>
                    {suffix && <span className="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">{suffix}</span>}
                </div>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">{subtitle}</p>

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
            <span className="text-[var(--md-sys-color-on-surface)]">{message}</span>
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
        className={clsx("bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6 hover:shadow-lg transition-shadow", className)}
    >
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--md-sys-color-surface-variant)] rounded-lg text-[var(--md-sys-color-on-surface-variant)]">
                    {icon}
                </div>
                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)]">{title}</h3>
            </div>
            {action}
        </div>
        {children}
    </motion.div>
);

const Analytics: React.FC<AnalyticsProps> = ({ data, onNavigate }) => {
    const [selectedMetric, setSelectedMetric] = useState<'performance' | 'attendance' | 'overview' | 'comparison'>('overview');
    const [hoveredStudent, setHoveredStudent] = useState<number | null>(null);
    const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'term'>('month');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [comparisonStudents, setComparisonStudents] = useState<number[]>([]);
    const [showComparisonPicker, setShowComparisonPicker] = useState(false);
    const analyticsRef = useRef<HTMLDivElement>(null);
    const [settings, setSettings] = useState<InstructorSettings>(DEFAULT_SETTINGS);

    // --- Server-Side Analytics State ---
    const [classAvg, setClassAvg] = useState<ClassAveragesResult>({ overall_avg_score: 0, overall_avg_attendance: 0, total_students: 0 });
    const [subjectComp, setSubjectComp] = useState<SubjectComparisonResult[]>([]);
    const [atRiskList, setAtRiskList] = useState<AtRiskStudentResult[]>([]);
    const [gradeDist, setGradeDist] = useState<GradeDistributionResult[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isGeneratingCloud, setIsGeneratingCloud] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        const loadStats = async () => {
            setIsLoadingStats(true);
            const stats = await fetchAnalyticsSummary();
            setClassAvg(stats.classAverages);
            setSubjectComp(stats.subjectComparison);
            setAtRiskList(stats.atRiskStudents);
            setGradeDist(stats.gradeDistribution);
            setIsLoadingStats(false);
        };
        loadStats();
    }, []);

    useEffect(() => {
        const loaded = getSettings();
        if (!loaded.preferences) {
            setSettings({ ...loaded, preferences: DEFAULT_SETTINGS.preferences });
        } else {
            setSettings(loaded);
        }
    }, []);

    // Grade distribution mapping for Recharts
    const gradeData = gradeDist.map(g => ({
        grade: `${g.grade}`,
        shortGrade: `${g.grade}`,
        students: g.student_count,
        avgScore: g.avg_score,
        attendance: g.avg_attendance
    }));

    // Subject data mapping for Recharts
    const subjectData = subjectComp.map(s => ({
        name: s.subject,
        score: s.avg_score,
        students: s.student_count,
        color: s.subject === 'Solar' ? '#f97316' : '#3b82f6',
        icon: s.subject === 'Solar' ? 'âš¡' : 'ðŸ’»'
    }));

    // Attendance trend

    // Competency helper (must be before first usage)
    const getAvgCompetency = (students: Student[]) => {
        if (students.length === 0) return 0;
        const total = students.reduce((acc, s) => {
            const vals = Object.values(s.competencies);
            return acc + (vals.reduce((a, b) => a + b, 0) / vals.length);
        }, 0);
        return parseFloat((total / students.length).toFixed(2));
    };

    const attendanceTrend = [
        { week: 'W1', fullWeek: 'Week 1', rate: 92, target: 90 },
        { week: 'W2', fullWeek: 'Week 2', rate: 88, target: 90 },
        { week: 'W3', fullWeek: 'Week 3', rate: 95, target: 90 },
        { week: 'W4', fullWeek: 'Week 4', rate: 91, target: 90 },
        { week: 'W5', fullWeek: 'Week 5', rate: data.students.length > 0 ? Math.round(data.students.reduce((acc, s) => acc + s.attendancePct, 0) / data.students.length) : 0, target: 90 }
    ];

    // Sparkline data
    const performanceSparkline = [2.8, 3.0, 2.9, 3.1, 3.2, getAvgCompetency(data.students)];
    const attendanceSparkline = attendanceTrend.map(w => w.rate);
    const studentsSparkline = [8, 10, 12, 14, 16, classAvg.total_students];
    const atRiskSparkline = [5, 4, 3, 4, 2, atRiskList.length];

    // Top performers (Keep client side for now, or move to RPC later)
    const topPerformers = [...data.students]
        .map(student => ({
            ...student,
            avgScore: Object.values(student.competencies).reduce((x, y) => x + y, 0) / Object.values(student.competencies).length
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

    // At-risk students
    const atRiskStudents = atRiskList;

    // Competency distribution
    const competencyDistribution = [
        { name: 'Mastery (3.5-4)', value: data.students.filter(s => getAvgCompetency([s]) >= 3.5).length, color: '#22c55e' },
        { name: 'Proficient (2.5-3.4)', value: data.students.filter(s => getAvgCompetency([s]) >= 2.5 && getAvgCompetency([s]) < 3.5).length, color: '#3b82f6' },
        { name: 'Developing (1.5-2.4)', value: data.students.filter(s => getAvgCompetency([s]) >= 1.5 && getAvgCompetency([s]) < 2.5).length, color: '#f59e0b' },
        { name: 'Needs Support (<1.5)', value: data.students.filter(s => getAvgCompetency([s]) < 1.5).length, color: '#ef4444' }
    ];

    // Overall stats
    const overallAvg = classAvg.overall_avg_score;
    const overallAttendance = classAvg.overall_avg_attendance;

    // Calculate comparisons
    const prevAttendance = 82; // Mock previous week data

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

    // PDF Export
    const exportToPDF = async () => {
        if (!analyticsRef.current) return;
        setShowExportMenu(false);

        try {
            const canvas = await html2canvas(analyticsRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add header
            pdf.setFontSize(20);
            pdf.setTextColor(59, 130, 246);
            pdf.text('Analytics Report', 14, 20);
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
            pdf.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 34);

            // Add image
            pdf.addImage(imgData, 'PNG', 0, 45, imgWidth, Math.min(imgHeight, 240));

            pdf.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('PDF export failed:', error);
        }
    };

    const handlePrint = () => {
        setShowExportMenu(false);
        window.print();
    };

    // Cloud Report Generation â€” fast data-driven PDF + cloud upload w/ local fallback
    // Cloud Report Generation — Server-side via Edge Function, client-side fallback
    const handleCloudReportGeneration = async () => {
        setIsGeneratingCloud(true);
        try {
            // ── Try server-side generation first (Edge Function) ──
            const { data, error } = await supabase.functions.invoke('generate-report', {
                body: { reportType: 'cohort_summary', filters: { dateRange, timePeriod } }
            });

            if (!error && data?.downloadUrl) {
                showToast('Cloud Report generated on server! Opening...', 'success');
                setTimeout(() => window.open(data.downloadUrl, '_blank'), 800);
                return;
            }

            // ── Fallback: generate client-side PDF ──
            console.warn('[CloudReport] Edge Function unavailable, falling back to client-side:', error?.message || 'No download URL');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const W = pdf.internal.pageSize.getWidth();
            let y = 14;

            // Header
            pdf.setFillColor(15, 23, 42);
            pdf.rect(0, 0, W, 36, 'F');
            pdf.setFillColor(59, 130, 246);
            pdf.rect(0, 36, W, 2, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PRISM Analytics Report', 14, 20);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(148, 163, 184);
            pdf.text('Generated: ' + new Date().toLocaleDateString() + '  |  Period: ' + dateRange.start + ' to ' + dateRange.end, 14, 30);
            y = 46;

            // Key Metrics
            pdf.setTextColor(30, 30, 30);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('KEY METRICS', 14, y);
            y += 6;
            const metricsArr = [
                { label: 'Class Average', value: (classAvg.overall_avg_score || 0).toFixed(2) + ' / 4.0' },
                { label: 'Attendance', value: (classAvg.overall_avg_attendance || 0) + '%' },
                { label: 'Total Students', value: '' + classAvg.total_students },
                { label: 'At-Risk', value: '' + atRiskStudents.length },
            ];
            const bxW = (W - 28 - 12) / 4;
            metricsArr.forEach((m, i) => {
                const bx = 14 + i * (bxW + 4);
                pdf.setFillColor(249, 250, 251);
                pdf.roundedRect(bx, y, bxW, 22, 3, 3, 'F');
                pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(107, 114, 128);
                pdf.text(m.label, bx + 4, y + 8);
                pdf.setFontSize(14); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 30, 30);
                pdf.text(m.value, bx + 4, y + 18);
            });
            y += 30;

            // Subject Performance
            if (subjectComp.length > 0) {
                pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 30, 30);
                pdf.text('SUBJECT PERFORMANCE', 14, y); y += 6;
                pdf.setFillColor(59, 130, 246); pdf.rect(14, y, W - 28, 8, 'F');
                pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
                pdf.text('Subject', 18, y + 5.5); pdf.text('Students', 80, y + 5.5); pdf.text('Avg Score', 120, y + 5.5);
                y += 8;
                subjectComp.forEach((s, idx) => {
                    const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 250];
                    pdf.setFillColor(bg[0], bg[1], bg[2]); pdf.rect(14, y, W - 28, 7, 'F');
                    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40);
                    pdf.text(s.subject, 18, y + 5); pdf.text('' + s.student_count, 80, y + 5); pdf.text(s.avg_score.toFixed(2), 120, y + 5);
                    y += 7;
                });
                y += 4;
            }

            // Grade Distribution
            if (gradeDist.length > 0) {
                pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 30, 30);
                pdf.text('GRADE DISTRIBUTION', 14, y); y += 6;
                pdf.setFillColor(59, 130, 246); pdf.rect(14, y, W - 28, 8, 'F');
                pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
                pdf.text('Grade', 18, y + 5.5); pdf.text('Students', 60, y + 5.5); pdf.text('Avg Score', 100, y + 5.5); pdf.text('Attendance', 140, y + 5.5);
                y += 8;
                gradeDist.forEach((g, idx) => {
                    const bg = idx % 2 === 0 ? [255, 255, 255] : [245, 247, 250];
                    pdf.setFillColor(bg[0], bg[1], bg[2]); pdf.rect(14, y, W - 28, 7, 'F');
                    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40);
                    pdf.text('' + g.grade, 18, y + 5); pdf.text('' + g.student_count, 60, y + 5);
                    pdf.text(g.avg_score.toFixed(2), 100, y + 5); pdf.text(g.avg_attendance.toFixed(0) + '%', 140, y + 5);
                    y += 7;
                });
                y += 4;
            }

            // At-Risk
            if (atRiskStudents.length > 0) {
                if (y > 230) { pdf.addPage(); y = 14; }
                pdf.setFontSize(12); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(239, 68, 68);
                pdf.text('AT-RISK STUDENTS', 14, y); y += 6;
                pdf.setFillColor(239, 68, 68); pdf.rect(14, y, W - 28, 8, 'F');
                pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(255, 255, 255);
                pdf.text('Name', 18, y + 5.5); pdf.text('Avg Score', 90, y + 5.5); pdf.text('Attendance', 140, y + 5.5);
                y += 8;
                atRiskStudents.forEach((s, idx) => {
                    if (y > 275) { pdf.addPage(); y = 14; }
                    const bg = idx % 2 === 0 ? [255, 255, 255] : [254, 242, 242];
                    pdf.setFillColor(bg[0], bg[1], bg[2]); pdf.rect(14, y, W - 28, 7, 'F');
                    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(40, 40, 40);
                    pdf.text(s.name, 18, y + 5); pdf.text(s.avg_score.toFixed(2), 90, y + 5); pdf.text(s.attendance_pct.toFixed(0) + '%', 140, y + 5);
                    y += 7;
                });
            }

            // Footer
            const pageCount = pdf.getNumberOfPages();
            for (let p = 1; p <= pageCount; p++) {
                pdf.setPage(p);
                pdf.setDrawColor(229, 231, 235); pdf.line(14, 284, W - 14, 284);
                pdf.setFontSize(7); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(156, 163, 175);
                pdf.text('PRISM OS  |  Client-Generated Fallback', 14, 289);
                pdf.text('Page ' + p + ' of ' + pageCount, W - 14, 289, { align: 'right' });
            }

            pdf.save('PRISM_Analytics_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
            showToast('Report saved locally (server unavailable)', 'info');
        } catch (err) {
            console.error('[CloudReport] Generation failed:', err);
            showToast('Report generation failed. Please try again.', 'error');
        } finally {
            setIsGeneratingCloud(false);
        }
    };

    // Toggle student for comparison
    const toggleComparisonStudent = (studentId: number) => {
        setComparisonStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            }
            if (prev.length >= 3) {
                return [...prev.slice(1), studentId];
            }
            return [...prev, studentId];
        });
    };

    // Get comparison data for radar chart
    const getComparisonData = () => {
        const selectedStudents = data.students.filter(s => comparisonStudents.includes(s.id));
        if (selectedStudents.length === 0) return [];

        const allCompetencies = new Set<string>();
        selectedStudents.forEach(s => Object.keys(s.competencies).forEach(k => allCompetencies.add(k)));

        return Array.from(allCompetencies).slice(0, 6).map(comp => {
            const entry: any = { competency: comp.substring(0, 15) + (comp.length > 15 ? '...' : '') };
            selectedStudents.forEach(s => {
                entry[s.name] = s.competencies[comp] || 0;
            });
            return entry;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10 font-sans" ref={analyticsRef}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                        <BarChart3 className="text-[var(--md-sys-color-primary)]" /> Analytics Dashboard
                    </h2>
                    <p className="text-[var(--md-sys-color-secondary)] text-sm font-medium">Real-time performance metrics and insights</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Time Period Selector */}
                    <div className="flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-full border border-[var(--md-sys-color-outline)]">
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
                                        ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]"
                                        : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                )}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>

                    <div className="hidden sm:block h-6 border-l border-[var(--md-sys-color-outline)] mx-1"></div>

                    {/* Generate Cloud Report Button */}
                    <button
                        onClick={handleCloudReportGeneration}
                        disabled={isGeneratingCloud}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-70"
                    >
                        {isGeneratingCloud ? (
                            <RefreshCw size={14} className="animate-spin" />
                        ) : (
                            <Sparkles size={14} className="text-purple-200" />
                        )}
                        {isGeneratingCloud ? 'Generating...' : 'Cloud Report'}
                    </button>

                    {/* Export Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-full text-sm font-bold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] hover:shadow-sm transition-all"
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
                                    className="absolute right-0 mt-2 w-48 bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)] shadow-xl z-50 overflow-hidden"
                                >
                                    <button
                                        onClick={exportToCSV}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] flex items-center gap-2"
                                    >
                                        <FileText size={14} />
                                        Export as CSV
                                    </button>
                                    <button
                                        onClick={exportToPDF}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] flex items-center gap-2 border-t border-[var(--md-sys-color-outline)]"
                                    >
                                        <Download size={14} />
                                        Export as PDF
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] flex items-center gap-2 border-t border-[var(--md-sys-color-outline)]"
                                    >
                                        <Printer size={14} />
                                        Print Report
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
                    value={classAvg.total_students}
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
            <div className="flex flex-wrap items-center gap-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1.5 rounded-full border border-[var(--md-sys-color-outline)] shadow-inner overflow-x-auto hide-scrollbar custom-scrollbar w-full sm:w-auto"
                >
                    {[
                        { id: 'overview', label: 'Overview', icon: Target },
                        { id: 'performance', label: 'Performance', icon: BarChart3 },
                        { id: 'attendance', label: 'Attendance', icon: Activity },
                        { id: 'comparison', label: 'Compare', icon: GitCompare }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedMetric(tab.id as any)}
                            className={clsx(
                                "px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                                selectedMetric === tab.id
                                    ? "bg-[var(--md-sys-color-surface)] shadow-md text-[var(--md-sys-color-primary)]"
                                    : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                        >
                            <tab.icon size={16} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* Date Range Filter */}
                <div className="flex items-center gap-1 sm:gap-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl px-2 sm:px-3 py-2 w-full sm:w-auto justify-center mt-2 sm:mt-0">
                    <Calendar size={14} className="text-[var(--md-sys-color-secondary)] flex-shrink-0" />
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] border-none outline-none w-[100px] sm:w-32"
                    />
                    <span className="text-[var(--md-sys-color-secondary)] flex-shrink-0">—</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] border-none outline-none w-[100px] sm:w-32"
                    />
                </div>
            </div>


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
                                        className="p-4 rounded-xl border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: subject.color + '20' }}>
                                                {subject.icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">{subject.name}</p>
                                                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{subject.students} students</p>
                                            </div>
                                        </div>
                                        <div className="relative h-3 bg-[var(--md-sys-color-surface)] rounded-full overflow-hidden">
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

                            <div className="h-48 overflow-x-auto hide-scrollbar custom-scrollbar w-full">
                                <div className="min-w-[500px] h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={gradeData} barGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline)" vertical={false} />
                                            <XAxis dataKey="shortGrade" tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                            <YAxis domain={[0, 4]} tick={{ fill: 'var(--md-sys-color-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--md-sys-color-surface)',
                                                    border: '1px solid var(--md-sys-color-outline)',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                                    padding: '12px 16px',
                                                    color: 'var(--md-sys-color-on-surface)'
                                                }}
                                                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                                itemStyle={{ color: 'var(--md-sys-color-on-surface)' }}
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
                                            hoveredStudent === student.id ? "bg-blue-50 dark:bg-blue-900/20 shadow-sm" : "bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface)]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black",
                                            idx === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-md" :
                                                idx === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                                                    idx === 2 ? "bg-gradient-to-br from-orange-400 to-red-500 text-white" :
                                                        "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-secondary)]"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate">{student.name}</p>
                                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
                                                {student.subject === 'Solar' ? <Zap size={10} /> : <Monitor size={10} />}
                                                {student.subject} â€¢ {getLevelShortLabel(student.studentGroup, String(student.grade))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg text-[var(--md-sys-color-on-surface)]">{student.avgScore.toFixed(1)}</p>
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
                                        const avg = student.avg_score;
                                        const isLowScore = avg < 2.5;
                                        const isLowAttendance = student.attendance_pct < 80;

                                        return (
                                            <motion.div
                                                key={student.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                className="flex items-center gap-3 p-3 bg-red-50/50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm truncate">{student.name}</p>
                                                    <div className="flex gap-1.5 mt-1 flex-wrap">
                                                        {isLowScore && (
                                                            <span className="text-[9px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                                                                Score: {avg.toFixed(1)}
                                                            </span>
                                                        )}
                                                        {isLowAttendance && (
                                                            <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full font-bold">
                                                                {student.attendance_pct}%
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
                                    className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] p-5 text-center hover:shadow-lg transition-all"
                                >
                                    <p className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest mb-2">{grade.grade}</p>
                                    <p className="text-3xl font-black text-[var(--md-sys-color-on-surface)]">{grade.attendance}%</p>
                                    <div className="mt-3 h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
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
                                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-2">{grade.students} students</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Comparison View */}
                {selectedMetric === 'comparison' && (
                    <motion.div
                        key="comparison"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Student Selector */}
                        <ChartCard title="Select Students to Compare" icon={<GitCompare size={18} />} delay={0.1}>
                            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4">Select up to 3 students to compare their competencies side-by-side</p>
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                                {data.students.map(student => (
                                    <button
                                        key={student.id}
                                        onClick={() => toggleComparisonStudent(student.id)}
                                        className={clsx(
                                            "px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                                            comparisonStudents.includes(student.id)
                                                ? "bg-[var(--md-sys-color-primary)] text-white shadow-md"
                                                : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]"
                                        )}
                                    >
                                        {student.name}
                                        {comparisonStudents.includes(student.id) && <X size={14} />}
                                    </button>
                                ))}
                            </div>
                        </ChartCard>

                        {/* Radar Chart Comparison */}
                        {comparisonStudents.length >= 2 && (
                            <ChartCard title="Competency Comparison" icon={<Target size={18} />} delay={0.2}>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={getComparisonData()}>
                                            <PolarGrid stroke="var(--md-sys-color-outline)" />
                                            <PolarAngleAxis
                                                dataKey="competency"
                                                tick={{ fill: 'var(--md-sys-color-on-surface)', fontSize: 11 }}
                                            />
                                            {comparisonStudents.map((studentId, idx) => {
                                                const student = data.students.find(s => s.id === studentId);
                                                if (!student) return null;
                                                return (
                                                    <Radar
                                                        key={studentId}
                                                        name={student.name}
                                                        dataKey={student.name}
                                                        stroke={GOOGLE_COLORS[idx % GOOGLE_COLORS.length]}
                                                        fill={GOOGLE_COLORS[idx % GOOGLE_COLORS.length]}
                                                        fillOpacity={0.2}
                                                        strokeWidth={2}
                                                    />
                                                );
                                            })}
                                            <Legend />
                                            <Tooltip
                                                contentStyle={{
                                                    background: 'var(--md-sys-color-surface)',
                                                    border: '1px solid var(--md-sys-color-outline)',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                                                }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Quick Stats Table */}
                                <div className="mt-6 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--md-sys-color-outline)]">
                                                <th className="text-left py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]">Metric</th>
                                                {comparisonStudents.map(id => {
                                                    const s = data.students.find(st => st.id === id);
                                                    return <th key={id} className="text-center py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]">{s?.name}</th>;
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-[var(--md-sys-color-outline)]">
                                                <td className="py-3 px-2 text-[var(--md-sys-color-on-surface-variant)]">Avg Score</td>
                                                {comparisonStudents.map(id => {
                                                    const s = data.students.find(st => st.id === id);
                                                    const avg = s ? (Object.values(s.competencies).reduce((a, b) => a + b, 0) / Object.values(s.competencies).length).toFixed(2) : 'â€”';
                                                    return <td key={id} className="text-center py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]">{avg}</td>;
                                                })}
                                            </tr>
                                            <tr className="border-b border-[var(--md-sys-color-outline)]">
                                                <td className="py-3 px-2 text-[var(--md-sys-color-on-surface-variant)]">Attendance</td>
                                                {comparisonStudents.map(id => {
                                                    const s = data.students.find(st => st.id === id);
                                                    return <td key={id} className="text-center py-3 px-2 font-bold text-[var(--md-sys-color-on-surface)]">{s?.attendancePct || 0}%</td>;
                                                })}
                                            </tr>
                                            <tr>
                                                <td className="py-3 px-2 text-[var(--md-sys-color-on-surface-variant)]">Subject</td>
                                                {comparisonStudents.map(id => {
                                                    const s = data.students.find(st => st.id === id);
                                                    return <td key={id} className="text-center py-3 px-2 text-[var(--md-sys-color-on-surface)]">{s?.subject}</td>;
                                                })}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </ChartCard>
                        )}

                        {comparisonStudents.length < 2 && (
                            <div className="flex flex-col items-center justify-center py-16 text-[var(--md-sys-color-on-surface-variant)]">
                                <GitCompare size={48} className="mb-4 opacity-30" />
                                <p className="font-bold">Select at least 2 students to compare</p>
                                <p className="text-sm">Click on student names above to add them</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};
export default Analytics;
