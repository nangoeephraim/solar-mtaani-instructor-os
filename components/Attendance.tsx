import React, { useState, useMemo, useEffect } from 'react';
import { AppData, ScheduleSlot, Student } from '../types';
import { getLevelShortLabel } from '../constants/educationLevels';
import { Calendar, Clock, Users, Check, X, UserCheck, Search, Eye, ArrowLeft, User, Sparkles, AlertCircle, CheckCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, BarChart3, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getSubjectGradient, getSubjectBorderHover, getSubjectEmoji, getSubjectIconBg } from '../utils/subjectUtils';
import { SallyAttendanceCopilot } from './SallyAttendanceCopilot';

interface AttendanceProps {
    data: AppData;
    onUpdateStudent: (student: Student, notify?: boolean) => void;
    onNavigate?: (view: string, studentId?: number) => void;
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const Attendance: React.FC<AttendanceProps> = ({ data, onUpdateStudent, onNavigate }) => {
    const { preferences } = useTheme();
    const [selectedClass, setSelectedClass] = useState<ScheduleSlot | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
    const [mobileShowSheet, setMobileShowSheet] = useState(false);
    const [mobileShowSally, setMobileShowSally] = useState(false); // Mobile Sally draw
    const { showToast } = useToast();
    const { user } = useAuth();

    const today = new Date();
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();

    const selectedDayOfWeek = selectedDate.getDay();

    // Classes for the selected date
    const displayClasses = useMemo(() => {
        const recurring = data.schedule.filter(s => s.dayOfWeek === selectedDayOfWeek && !s.overrideDate);
        const overrides = data.schedule.filter(s => s.overrideDate === selectedDateStr);
        const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
        return [
            ...recurring.filter(r => !replacedIds.has(r.id)),
            ...overrides
        ].filter(s => s.status !== 'Cancelled')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [data.schedule, selectedDayOfWeek, selectedDateStr]);

    // Students in selected class
    const studentsInClass = useMemo(() => {
        if (!selectedClass) return [];
        return data.students.filter(s => s.grade === selectedClass.grade && s.subject === selectedClass.subject);
    }, [selectedClass, data.students]);

    // Direct string date
    const getSlotDate = () => selectedDateStr;

    // Get attendance status for a student in a class
    const getAttendanceStatus = (student: Student, slot: ScheduleSlot): 'present' | 'absent' | 'unmarked' => {
        const date = getSlotDate();
        const record = student.attendanceHistory.find(h => h.slotId === slot.id && h.date === date);
        return record?.status || 'unmarked';
    };

    // Attendance stats for selected class
    const attendanceStats = useMemo(() => {
        if (!selectedClass) return { present: 0, absent: 0, unmarked: 0 };
        let present = 0, absent = 0, unmarked = 0;
        studentsInClass.forEach(student => {
            const status = getAttendanceStatus(student, selectedClass);
            if (status === 'present') present++;
            else if (status === 'absent') absent++;
            else unmarked++;
        });
        return { present, absent, unmarked };
    }, [selectedClass, studentsInClass]);

    // Handle individual attendance
    const handleAttendance = (student: Student, status: 'present' | 'absent') => {
        if (!selectedClass) return;
        const date = getSlotDate();
        const existingIndex = student.attendanceHistory.findIndex(h => h.slotId === selectedClass.id && h.date === date);
        let newHistory = [...student.attendanceHistory];
        const record = { date, slotId: selectedClass.id, status };

        if (existingIndex >= 0) {
            newHistory[existingIndex] = record;
        } else {
            newHistory.push(record);
        }

        const presentCount = newHistory.filter(h => h.status === 'present').length;
        const newPct = newHistory.length > 0 ? Math.round((presentCount / newHistory.length) * 100) : 100;
        onUpdateStudent({ ...student, attendanceHistory: newHistory, attendancePct: newPct });
    };

    // Handle batch attendance
    const handleBatchAttendance = (status: 'present' | 'absent') => {
        studentsInClass.forEach(student => handleAttendance(student, status));
        showToast(`All students marked ${status}`, 'success');
    };

    // Filter students
    const filteredStudents = useMemo(() => {
        let students = studentsInClass;

        if (searchQuery) {
            students = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (filterStatus !== 'all' && selectedClass) {
            students = students.filter(s => getAttendanceStatus(s, selectedClass) === filterStatus);
        }

        return students;
    }, [studentsInClass, searchQuery, filterStatus, selectedClass]);

    // Auto-select first class when date changes
    useEffect(() => {
        if (displayClasses.length > 0) {
            if (isToday) {
                const current = displayClasses.find(s => {
                    const slotHour = parseInt(s.startTime.split(':')[0]);
                    return slotHour >= currentHour;
                }) || displayClasses[0];
                setSelectedClass(current);
            } else {
                setSelectedClass(displayClasses[0]);
            }
        } else {
            setSelectedClass(null);
        }
    }, [displayClasses, isToday, currentHour]);

    // Day picker date generator (sliding range of 7 days around selectedDate)
    const dayRange = useMemo(() => {
        const range = [];
        for (let i = -3; i <= 3; i++) {
            const d = new Date();
            d.setDate(today.getDate() + i);
            range.push(d);
        }
        return range;
    }, [selectedDateStr]); // updates slightly on date changes

    const selectDay = (date: Date) => {
        setSelectedDate(date);
    };

    const handleMobileClassSelect = (slot: ScheduleSlot) => {
        setSelectedClass(slot);
        setMobileShowSheet(true);
    };

    return (
        <div className="h-full flex flex-col lg:flex-row gap-5 lg:gap-6 animate-fade-in pb-6 font-sans overflow-hidden">
            
            {/* ── COLUMN 1: Session Selector (Left Panel) ── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={clsx(
                    "w-full lg:w-80 flex-shrink-0 flex flex-col overflow-hidden relative z-10 gap-4",
                    mobileShowSheet && "hidden lg:flex"
                )}
            >
                {/* Horizontal Sliding Day Picker Carousel */}
                <div className="glassmorphic-card-premium p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className="font-google font-bold text-xs tracking-wider uppercase text-[var(--md-sys-color-secondary)]">Calendar Timeline</span>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => {
                                    const prev = new Date(selectedDate);
                                    prev.setDate(prev.getDate() - 1);
                                    setSelectedDate(prev);
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    const next = new Date(selectedDate);
                                    next.setDate(next.getDate() + 1);
                                    setSelectedDate(next);
                                }}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Sliding Horizontal list */}
                    <div className="flex justify-between gap-1 overflow-x-auto pb-1 custom-scrollbar">
                        {dayRange.map((day, idx) => {
                            const active = day.toDateString() === selectedDate.toDateString();
                            const current = day.toDateString() === today.toDateString();
                            return (
                                <button
                                    key={idx}
                                    onClick={() => selectDay(day)}
                                    className={clsx(
                                        "flex-1 min-w-[40px] py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all duration-300 relative group",
                                        active 
                                            ? "bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/20 scale-105" 
                                            : "bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-[var(--md-sys-color-on-surface-variant)] hover:border-indigo-300 dark:hover:border-indigo-900"
                                    )}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-wider opacity-85">
                                        {DAYS_SHORT[day.getDay()]}
                                    </span>
                                    <span className="text-xs font-extrabold mt-0.5">
                                        {day.getDate()}
                                    </span>
                                    {current && !active && (
                                        <span className="absolute bottom-1 w-1 h-1 bg-indigo-500 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-center">
                        <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Class list */}
                <div className="glassmorphic-card-premium flex-1 flex flex-col overflow-hidden min-h-[220px]">
                    <div className="p-4 border-b border-[var(--md-sys-color-outline)] bg-white/5 backdrop-blur-md">
                        <h3 className="font-google font-bold text-xs tracking-wider uppercase text-[var(--md-sys-color-secondary)]">Daily Sessions</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {displayClasses.length > 0 ? (
                                displayClasses.map((slot, idx) => {
                                    const slotHour = parseInt(slot.startTime.split(':')[0]);
                                    const isLive = isToday && slotHour <= currentHour && slotHour + Math.floor(slot.durationMinutes / 60) > currentHour;
                                    const isPast = !isToday || (slotHour + Math.floor(slot.durationMinutes / 60) <= currentHour);

                                    return (
                                        <motion.button
                                            key={slot.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => {
                                                setSelectedClass(slot);
                                                if (window.innerWidth < 1024) {
                                                    setMobileShowSheet(true);
                                                }
                                            }}
                                            className={clsx(
                                                "w-full p-4 rounded-xl text-left border-2 transition-all relative overflow-hidden group hover:scale-[1.01]",
                                                selectedClass?.id === slot.id
                                                    ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 shadow-sm"
                                                    : "bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900",
                                                getSubjectBorderHover(slot.subject || '')
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={clsx("w-5 h-5 rounded flex items-center justify-center text-white text-xs", getSubjectIconBg(slot.subject || ''))}>
                                                        {getSubjectEmoji(slot.subject || '')}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">{slot.subject}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {isLive && <span className="text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">LIVE</span>}
                                                    {isPast && slot.status !== 'Completed' && <span className="text-[8px] font-black bg-slate-200 dark:bg-slate-800 text-[var(--md-sys-color-on-surface-variant)] px-1.5 py-0.5 rounded-full">PAST</span>}
                                                    {slot.status === 'Completed' && <CheckCircle size={12} className="text-emerald-500" />}
                                                </div>
                                            </div>
                                            <p className="font-google font-bold text-sm text-[var(--md-sys-color-on-surface)]">
                                                {getLevelShortLabel(slot.studentGroup || 'Academy', String(slot.grade))}
                                            </p>
                                            <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-1 font-medium">
                                                <Clock size={10} /> {slot.startTime} • {slot.durationMinutes}m
                                            </p>
                                        </motion.button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    <Calendar size={36} className="mx-auto mb-2 opacity-50 text-indigo-500" />
                                    <p className="font-bold text-xs">No classes scheduled</p>
                                    <p className="text-[10px] mt-0.5">Select another date above</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* ── COLUMN 2: Attendance Grid (Center Panel) ── */}
            <div className={clsx(
                "flex-1 flex flex-col overflow-hidden relative z-10 gap-4",
                !mobileShowSheet && "hidden lg:flex"
            )}>
                {/* Back button for mobile */}
                {mobileShowSheet && (
                    <button
                        onClick={() => {
                            setMobileShowSheet(false);
                            setMobileShowSally(false);
                        }}
                        className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold self-start transition-all"
                    >
                        <ArrowLeft size={14} /> Back to Timetable
                    </button>
                )}

                {selectedClass ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex-1 flex flex-col overflow-hidden glassmorphic-card-premium"
                    >
                        {/* Session Header Card */}
                        <div className={clsx(
                            "p-5 text-white relative overflow-hidden flex-shrink-0",
                            getSubjectGradient(selectedClass.subject || '')
                        )}>
                            <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-google font-bold text-white flex items-center gap-2">
                                        <Users size={18} className="text-white/90" />
                                        {getLevelShortLabel(selectedClass.studentGroup || 'Academy', String(selectedClass.grade))} - {selectedClass.subject}
                                    </h3>
                                    <p className="text-xs text-white/80 mt-1 flex items-center gap-2">
                                        <span>{selectedDateStr}</span>
                                        <span>•</span>
                                        <span>{selectedClass.startTime}</span>
                                        <span>•</span>
                                        <span>{selectedClass.durationMinutes} min</span>
                                    </p>
                                </div>
                                
                                {/* Mobile Sally Toggle button */}
                                <button
                                    onClick={() => setMobileShowSally(!mobileShowSally)}
                                    className="lg:hidden p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md shadow-sm border border-white/10 transition-all flex items-center gap-1.5 text-xs font-bold"
                                >
                                    <Sparkles size={14} /> Sally AI
                                </button>
                            </div>
                        </div>

                        {/* Attendance Statistics Indicator row */}
                        <div className="grid grid-cols-3 gap-3 p-4 border-b border-[var(--md-sys-color-outline)] bg-slate-50/50 dark:bg-slate-900/30">
                            <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-xl font-black text-emerald-500">{attendanceStats.present}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Present</p>
                            </div>
                            <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-xl font-black text-red-500">{attendanceStats.absent}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Absent</p>
                            </div>
                            <div className="text-center p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                                <p className="text-xl font-black text-slate-400 dark:text-slate-500">{attendanceStats.unmarked}</p>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">Unmarked</p>
                            </div>
                        </div>

                        {/* Roster Controls Board */}
                        <div className="p-4 border-b border-[var(--md-sys-color-outline)] flex flex-wrap gap-3 items-center justify-between">
                            {/* Search */}
                            <div className="flex-1 min-w-[180px] relative">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search student name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-[var(--md-sys-color-on-surface)]"
                                />
                            </div>

                            {/* Filters group */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl">
                                {(['all', 'present', 'absent', 'unmarked'] as const).map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={clsx(
                                            "px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all capitalize",
                                            filterStatus === status 
                                                ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700" 
                                                : "text-[var(--md-sys-color-on-surface-variant)] hover:text-indigo-500"
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            {/* Batch operations */}
                            {isToday && user?.role !== 'viewer' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleBatchAttendance('present')}
                                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                        <Check size={12} /> All Present
                                    </button>
                                    <button
                                        onClick={() => handleBatchAttendance('absent')}
                                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm"
                                    >
                                        <X size={12} /> All Absent
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Student Grid cards container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                            <AnimatePresence>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student, idx) => {
                                        const status = getAttendanceStatus(student, selectedClass);
                                        return (
                                            <motion.div
                                                key={student.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className={clsx(
                                                    "flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 gap-3 relative group overflow-hidden",
                                                    status === 'present' 
                                                        ? "bg-emerald-50/20 dark:bg-emerald-950/5 border-emerald-200 dark:border-emerald-900/30" 
                                                        : status === 'absent' 
                                                            ? "bg-red-50/20 dark:bg-red-950/5 border-red-200 dark:border-red-900/30" 
                                                            : "bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900 hover:shadow-md"
                                                )}
                                            >
                                                {/* Left status glow edge */}
                                                <div className={clsx(
                                                    "absolute left-0 top-0 bottom-0 w-1 transition-all",
                                                    status === 'present' ? 'bg-emerald-500' : status === 'absent' ? 'bg-red-500' : 'bg-transparent'
                                                )} />

                                                {/* Student credentials block */}
                                                <div className="flex items-center gap-3">
                                                    {/* Custom indicator avatar */}
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-xl font-google font-extrabold text-sm flex items-center justify-center transition-colors shadow-sm",
                                                        status === 'present' 
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                                                            : status === 'absent' 
                                                                ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" 
                                                                : "bg-slate-100 dark:bg-slate-800 text-[var(--md-sys-color-on-surface-variant)]"
                                                    )}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-xs text-[var(--md-sys-color-on-surface)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                {student.name}
                                                            </span>
                                                            {student.attendancePct < 80 && (
                                                                <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20" title={`Attendance at risk: ${student.attendancePct}%`}>
                                                                    <AlertCircle size={8} /> At Risk
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-semibold mt-0.5">
                                                            {preferences.terminology?.cohortLabel || 'Lot'} {student.lot} • {student.attendancePct}% attendance
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Controls and navigation */}
                                                <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                                                    
                                                    {/* Mark options */}
                                                    {!isToday && user?.role === 'viewer' ? (
                                                        <div className={clsx(
                                                            "flex items-center justify-center w-24 h-7 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                                                            status === 'present' 
                                                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 border-emerald-200" 
                                                                : status === 'absent' 
                                                                    ? "bg-red-100 dark:bg-red-900/40 text-red-600 border-red-200" 
                                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                                                        )}>
                                                            {status === 'present' && <><CheckCircle2 size={10} className="mr-1" /> Present</>}
                                                            {status === 'absent' && <><XCircle size={10} className="mr-1" /> Absent</>}
                                                            {status === 'unmarked' && 'Unmarked'}
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                onClick={() => handleAttendance(student, 'present')}
                                                                className={clsx(
                                                                    "p-1.5 rounded-lg border transition-all duration-300",
                                                                    status === 'present'
                                                                        ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                                                                        : "bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border-slate-200 hover:border-emerald-200 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-emerald-950/20"
                                                                )}
                                                                title="Mark Present"
                                                            >
                                                                <Check size={14} strokeWidth={2.5} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleAttendance(student, 'absent')}
                                                                className={clsx(
                                                                    "p-1.5 rounded-lg border transition-all duration-300",
                                                                    status === 'absent'
                                                                        ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20"
                                                                        : "bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border-slate-200 hover:border-red-200 dark:bg-slate-900 dark:border-slate-850 dark:hover:bg-red-950/20"
                                                                )}
                                                                title="Mark Absent"
                                                            >
                                                                <X size={14} strokeWidth={2.5} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Navigation quick links */}
                                                    {onNavigate && (
                                                        <div className="flex items-center gap-1 pl-3 border-l border-slate-200 dark:border-slate-800">
                                                            <button
                                                                onClick={() => onNavigate('students', student.id)}
                                                                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600 transition-colors"
                                                                title="View Student Profile"
                                                            >
                                                                <User size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => onNavigate('student-analytics', student.id)}
                                                                className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-purple-600 transition-colors"
                                                                title="View Student Analytics"
                                                            >
                                                                <Eye size={12} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <Users size={36} className="mx-auto mb-2 opacity-50 text-indigo-500" />
                                        <p className="font-bold text-xs">No students found</p>
                                        <p className="text-[10px] mt-0.5">Try clearing filters or search strings</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 glassmorphic-card-premium">
                        <motion.div
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                            className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center mb-4 text-indigo-500 shadow-md shadow-indigo-500/10"
                        >
                            <UserCheck size={32} />
                        </motion.div>
                        <h3 className="font-google font-bold text-base text-[var(--md-sys-color-on-surface)]">Select class to begin</h3>
                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-[240px] leading-relaxed">
                            Pick an active class session from the daily timetable list on the left to mark attendance or run insights.
                        </p>
                    </div>
                )}
            </div>

            {/* ── COLUMN 3: Embedded Sally AI (Right Panel) ── */}
            {/* Desktop column: always visible if class is selected */}
            <div className="hidden lg:block">
                <SallyAttendanceCopilot
                    students={studentsInClass}
                    selectedClass={selectedClass}
                    selectedDateStr={selectedDateStr}
                    onMarkAttendance={handleAttendance}
                    onMarkAll={handleBatchAttendance}
                    attendanceStats={attendanceStats}
                />
            </div>

            {/* Mobile Sheet drawer */}
            <AnimatePresence>
                {mobileShowSheet && mobileShowSally && (
                    <motion.div
                        initial={{ opacity: 0, y: 150 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 150 }}
                        className="lg:hidden fixed inset-x-0 bottom-0 top-16 bg-white dark:bg-slate-900 z-50 p-4 border-t border-slate-200 dark:border-slate-800 rounded-t-[24px] flex flex-col"
                    >
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                            <span className="font-google font-bold text-sm text-[var(--md-sys-color-on-surface)]">Sally AI mobile drawer</span>
                            <button
                                onClick={() => setMobileShowSally(false)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold"
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden flex">
                            <SallyAttendanceCopilot
                                students={studentsInClass}
                                selectedClass={selectedClass}
                                selectedDateStr={selectedDateStr}
                                onMarkAttendance={handleAttendance}
                                onMarkAll={handleBatchAttendance}
                                attendanceStats={attendanceStats}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Attendance;
