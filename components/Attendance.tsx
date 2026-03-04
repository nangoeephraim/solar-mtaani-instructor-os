import React, { useState, useMemo, useEffect } from 'react';
import { AppData, ScheduleSlot, Student } from '../types';
import { getLevelShortLabel } from '../constants/educationLevels';
import { Calendar, Clock, Users, Check, X, ChevronRight, Zap, Monitor, UserCheck, UserX, Search, Filter, History, CheckCircle, XCircle, AlertCircle, Eye, ArrowLeft, User } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface AttendanceProps {
    data: AppData;
    onUpdateStudent: (student: Student, notify?: boolean) => void;
    onNavigate?: (view: string, studentId?: number) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Attendance: React.FC<AttendanceProps> = ({ data, onUpdateStudent, onNavigate }) => {
    const [selectedClass, setSelectedClass] = useState<ScheduleSlot | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
    const [mobileShowSheet, setMobileShowSheet] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const currentHour = today.getHours();

    const selectedDayOfWeek = selectedDate.getDay();
    const selectedDateStr = selectedDate.toISOString().split('T')[0];

    // Classes for the selected date — handle overrides and exclude cancelled
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

    // Get date string directly
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
                // Find current or next class for today
                const current = displayClasses.find(s => {
                    const slotHour = parseInt(s.startTime.split(':')[0]);
                    return slotHour >= currentHour;
                }) || displayClasses[0];
                setSelectedClass(current);
            } else {
                // For past/future dates, select the first class
                setSelectedClass(displayClasses[0]);
            }
        } else {
            setSelectedClass(null);
        }
    }, [displayClasses, isToday, currentHour]);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        setSelectedDate(newDate);
    };

    // Mobile class select handler
    const handleMobileClassSelect = (slot: ScheduleSlot) => {
        setSelectedClass(slot);
        setMobileShowSheet(true);
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in pb-6 font-sans">

            {/* ── MOBILE: Class Selector Strip (visible only on small screens when sheet hidden) ── */}
            {!mobileShowSheet && (
                <div className="md:hidden flex flex-col gap-3">
                    {/* Date Selector Mobile */}
                    <div className="flex items-center justify-between bg-[var(--md-sys-color-surface)] p-2 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm">
                        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all" title="Previous Day">
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex-1 relative">
                            <input type="date" aria-label="Select Attendance Date" value={selectedDateStr} onChange={(e) => { if (e.target.value) setSelectedDate(new Date(e.target.value)); }} className="w-full bg-transparent text-center text-sm font-bold text-[var(--md-sys-color-on-surface)] cursor-pointer focus:outline-none py-1" />
                        </div>
                        <button onClick={() => changeDate(1)} disabled={isToday} className={clsx("p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all", isToday && "opacity-30 cursor-not-allowed")} title="Next Day">
                            <ChevronRightIcon size={18} />
                        </button>
                    </div>

                    {/* Class Cards */}
                    {displayClasses.length > 0 ? (
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            {displayClasses.map((slot) => {
                                const isActive = selectedClass?.id === slot.id;
                                return (
                                    <button key={slot.id} onClick={() => handleMobileClassSelect(slot)} className={clsx(
                                        "flex-shrink-0 px-4 py-3 rounded-xl text-left border-2 transition-all min-w-[140px]",
                                        isActive ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm" : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-blue-300"
                                    )}>
                                        <p className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">{getLevelShortLabel(slot.studentGroup || 'Academy', String(slot.grade))}</p>
                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5 flex items-center gap-1">
                                            <Clock size={10} /> {slot.startTime} • {slot.subject}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-[var(--md-sys-color-secondary)] bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline)]">
                            <Calendar size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-medium">No classes scheduled</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── MOBILE: Back button when viewing sheet ── */}
            {mobileShowSheet && (
                <button onClick={() => setMobileShowSheet(false)} className="md:hidden flex items-center gap-2 px-3 py-2 text-sm font-bold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors self-start">
                    <ArrowLeft size={16} /> Back to Classes
                </button>
            )}

            {/* ── DESKTOP: Left Panel (hidden on mobile) ── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden md:flex w-80 flex-shrink-0 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-[var(--md-sys-color-outline)]">
                    <div className="flex items-center gap-3 mb-4">
                        <motion.div
                            className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-green-500/30"
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <UserCheck size={22} />
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-google font-bold text-[var(--md-sys-color-on-surface)]">Attendance</h2>
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
                                {today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>

                    {/* Date Selector */}
                    <div className="flex items-center justify-between bg-[var(--md-sys-color-surface-variant)] p-1 rounded-xl border border-[var(--md-sys-color-outline)]">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-[var(--md-sys-color-on-surface)] transition-all"
                            title="Previous Day"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex-1 relative">
                            <input
                                type="date"
                                aria-label="Select Attendance Date"
                                value={selectedDateStr}
                                onChange={(e) => {
                                    if (e.target.value) setSelectedDate(new Date(e.target.value));
                                }}
                                className="w-full bg-transparent text-center text-sm font-bold text-[var(--md-sys-color-on-surface)] cursor-pointer focus:outline-none py-1"
                            />
                        </div>

                        <button
                            onClick={() => changeDate(1)}
                            className={clsx(
                                "p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-[var(--md-sys-color-on-surface)] transition-all",
                                isToday && "opacity-30 cursor-not-allowed"
                            )}
                            title="Next Day"
                            disabled={isToday}
                        >
                            <ChevronRightIcon size={16} />
                        </button>
                    </div>
                </div>

                {/* Class List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div key={selectedDateStr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                            {displayClasses.length > 0 ? displayClasses.map((slot, idx) => {
                                const slotHour = parseInt(slot.startTime.split(':')[0]);
                                const isActive = isToday && slotHour <= currentHour && slotHour + Math.floor(slot.durationMinutes / 60) > currentHour;
                                const isPast = !isToday || (slotHour + Math.floor(slot.durationMinutes / 60) <= currentHour);

                                return (
                                    <motion.button
                                        key={slot.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedClass(slot)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl text-left transition-all border-l-4",
                                            selectedClass?.id === slot.id
                                                ? "bg-blue-50 dark:bg-blue-900/20 border-l-blue-600 shadow-sm"
                                                : "bg-[var(--md-sys-color-surface-variant)] border-l-transparent hover:bg-[var(--md-sys-color-surface)]",
                                            slot.subject === 'Solar' ? 'hover:border-l-orange-500' : 'hover:border-l-blue-500'
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {slot.subject === 'Solar' ? <Zap size={14} className="text-orange-500" /> : <Monitor size={14} className="text-blue-500" />}
                                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]">{slot.subject}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isActive && <span className="text-[9px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">LIVE</span>}
                                                {isPast && slot.status !== 'Completed' && <span className="text-[9px] font-bold bg-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] px-1.5 py-0.5 rounded-full">PAST</span>}
                                                {slot.status === 'Completed' && <CheckCircle size={14} className="text-green-500" />}
                                            </div>
                                        </div>
                                        <p className="font-bold text-[var(--md-sys-color-on-surface)]">{getLevelShortLabel(slot.studentGroup || 'Academy', String(slot.grade))}</p>
                                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-1">
                                            <Clock size={10} /> {slot.startTime} • {slot.durationMinutes}min
                                        </p>
                                    </motion.button>
                                );
                            }) : (
                                <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                    <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No classes scheduled</p>
                                    <p className="text-xs mt-1">Select another date</p>
                                </div>
                            )}
                        </motion.div>

                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Right Panel: Attendance Sheet (always visible on desktop, toggle on mobile) */}
            <AnimatePresence>
                {selectedClass ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={clsx(
                            "flex-1 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm flex flex-col overflow-hidden",
                            !mobileShowSheet && "hidden md:flex"
                        )}
                    >
                        {/* Header */}
                        <div className={clsx(
                            "p-6 text-white relative overflow-hidden",
                            selectedClass.subject === 'Solar' ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-gradient-to-br from-blue-600 to-indigo-600"
                        )}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                            <div className="relative z-10">
                                {/* Action Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                                            <Users size={20} className="text-blue-500" />
                                            {getLevelShortLabel(selectedClass.studentGroup || 'Academy', String(selectedClass.grade))} - {selectedClass.subject}
                                        </h3>
                                        <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">
                                            {getSlotDate()} • {selectedClass.startTime} • {selectedClass.durationMinutes}min
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--md-sys-color-surface-variant)] border-b border-[var(--md-sys-color-outline)]">
                                    <motion.div
                                        className="text-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring" }}
                                    >
                                        <p className="text-2xl font-black text-green-600 dark:text-green-400">{attendanceStats.present}</p>
                                        <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Present</p>
                                    </motion.div>
                                    <motion.div
                                        className="text-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.15, type: "spring" }}
                                    >
                                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{attendanceStats.absent}</p>
                                        <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Absent</p>
                                    </motion.div>
                                    <motion.div
                                        className="text-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                    >
                                        <p className="text-2xl font-black text-[var(--md-sys-color-on-surface-variant)]">{attendanceStats.unmarked}</p>
                                        <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Unmarked</p>
                                    </motion.div>
                                </div>

                                {/* Toolbar */}
                                <div className="p-4 border-b border-[var(--md-sys-color-outline)] flex flex-wrap gap-3 items-center">
                                    {/* Search */}
                                    <div className="flex-1 relative min-w-[200px]">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
                                        <input
                                            type="text"
                                            placeholder="Search students..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                        />
                                    </div>

                                    {/* Filter */}
                                    <div className="flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-lg">
                                        {(['all', 'present', 'absent', 'unmarked'] as const).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => setFilterStatus(status)}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-md text-xs font-bold transition-all capitalize",
                                                    filterStatus === status ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                                )}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Batch Actions */}
                                    {isToday && user?.role !== 'viewer' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleBatchAttendance('present')}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-1.5 shadow-sm"
                                            >
                                                <Check size={14} /> All Present
                                            </button>
                                            <button
                                                onClick={() => handleBatchAttendance('absent')}
                                                className="px-4 py-2 bg-[var(--md-sys-color-surface)] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
                                            >
                                                <X size={14} /> All Absent
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Student List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                                        const status = getAttendanceStatus(student, selectedClass);
                                        return (
                                            <motion.div
                                                key={student.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className={clsx(
                                                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                                                    status === 'present' ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30" :
                                                        status === 'absent' ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30" :
                                                            "bg-[var(--md-sys-color-surface-variant)] border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-outline)]"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg",
                                                        status === 'present' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                                            status === 'absent' ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                                                                "bg-[var(--md-sys-color-surface)] dark:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]"
                                                    )}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-[var(--md-sys-color-on-surface)]">{student.name}</p>
                                                            {student.attendancePct < 80 && (
                                                                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title={`Low attendance warning (${student.attendancePct}%)`}>
                                                                    <AlertCircle size={10} /> At Risk
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-0.5">Lot {student.lot} • {student.attendancePct}% overall</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    {/* Status Badge (for Past Classes without Edit Access) */}
                                                    {!isToday && user?.role === 'viewer' ? (
                                                        <div className={clsx(
                                                            "flex items-center justify-center w-24 h-8 rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-sm border",
                                                            status === 'present' ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" :
                                                                status === 'absent' ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800" :
                                                                    "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)]"
                                                        )}>
                                                            {status === 'present' && <><CheckCircle size={12} className="mr-1" /> Present</>}
                                                            {status === 'absent' && <><XCircle size={12} className="mr-1" /> Absent</>}
                                                            {status === 'unmarked' && <><AlertCircle size={12} className="mr-1" /> Unmarked</>}
                                                        </div>
                                                    ) : (
                                                        /* Action Buttons (For any Date if Instructor/Admin) */
                                                        <div className="flex gap-2">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleAttendance(student, 'present')}
                                                                className={clsx(
                                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-bold border",
                                                                    status === 'present'
                                                                        ? "bg-green-500 text-white shadow-md border-green-600"
                                                                        : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)] hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 hover:border-green-200"
                                                                )}
                                                            >
                                                                <Check size={14} strokeWidth={3} />
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleAttendance(student, 'absent')}
                                                                className={clsx(
                                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-bold border",
                                                                    status === 'absent'
                                                                        ? "bg-red-500 text-white shadow-md border-red-600"
                                                                        : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200"
                                                                )}
                                                            >
                                                                <X size={14} strokeWidth={3} />
                                                            </motion.button>
                                                        </div>
                                                    )}

                                                    {/* Cross-Tab Navigation Actions */}
                                                    {onNavigate && (
                                                        <div className="flex items-center gap-1.5 pl-4 border-l border-[var(--md-sys-color-outline)]">
                                                            <button
                                                                onClick={() => onNavigate('students', student.id)}
                                                                className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-blue-600 transition-colors"
                                                                title="View Full Profile"
                                                            >
                                                                <User size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => onNavigate('student-analytics', student.id)}
                                                                className="p-1.5 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface)] hover:text-violet-600 transition-colors"
                                                                title="View Deep Analytics"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    }) : (
                                        <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                            <Users size={40} className="mx-auto mb-3 opacity-50" />
                                            <p className="font-medium">No students found</p>
                                            <p className="text-xs mt-1">Try adjusting your search or filter</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hidden md:flex flex-1 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm items-center justify-center"
                    >
                        <div className="text-center text-[var(--md-sys-color-on-surface-variant)]">
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            >
                                <UserCheck size={40} className="text-green-500" />
                            </motion.div>
                            <p className="font-bold text-[var(--md-sys-color-on-surface)]">Select a Class</p>
                            <p className="text-sm mt-1">Choose from the list to mark or view attendance</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Attendance;
