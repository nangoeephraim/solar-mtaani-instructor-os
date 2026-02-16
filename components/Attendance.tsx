import React, { useState, useMemo, useEffect } from 'react';
import { AppData, ScheduleSlot, Student } from '../types';
import { Calendar, Clock, Users, Check, X, ChevronRight, Zap, Monitor, UserCheck, UserX, Search, Filter, History, CheckCircle, XCircle, AlertCircle, Eye, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceProps {
    data: AppData;
    onUpdateStudent: (student: Student, notify?: boolean) => void;
    onNavigate?: (view: string) => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Attendance: React.FC<AttendanceProps> = ({ data, onUpdateStudent, onNavigate }) => {
    const [selectedClass, setSelectedClass] = useState<ScheduleSlot | null>(null);
    const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'present' | 'absent' | 'unmarked'>('all');
    const { showToast } = useToast();
    const { user } = useAuth();

    const today = new Date();
    const currentDay = today.getDay();
    const currentHour = today.getHours();

    // Today's classes — handle overrides and exclude cancelled
    const todaysClasses = useMemo(() => {
        const todayStr = today.toISOString().split('T')[0];
        const recurring = data.schedule.filter(s => s.dayOfWeek === currentDay && !s.overrideDate);
        const overrides = data.schedule.filter(s => s.overrideDate === todayStr);
        const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
        return [
            ...recurring.filter(r => !replacedIds.has(r.id)),
            ...overrides
        ].filter(s => s.status !== 'Cancelled')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [data.schedule, currentDay]);

    // Completed classes (for history)
    const completedClasses = useMemo(() =>
        data.schedule.filter(s => s.status === 'Completed'),
        [data.schedule]
    );

    // Students in selected class
    const studentsInClass = useMemo(() => {
        if (!selectedClass) return [];
        return data.students.filter(s => s.grade === selectedClass.grade && s.subject === selectedClass.subject);
    }, [selectedClass, data.students]);

    // Get date for a slot
    const getSlotDate = (slot: ScheduleSlot) => {
        const date = new Date();
        const diff = slot.dayOfWeek - date.getDay();
        date.setDate(date.getDate() + diff);
        return date.toISOString().split('T')[0];
    };

    // Get attendance status for a student in a class
    const getAttendanceStatus = (student: Student, slot: ScheduleSlot): 'present' | 'absent' | 'unmarked' => {
        const date = getSlotDate(slot);
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
        const date = getSlotDate(selectedClass);
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

    // Auto-select first class
    useEffect(() => {
        if (viewMode === 'today' && todaysClasses.length > 0 && !selectedClass) {
            // Find current or next class
            const current = todaysClasses.find(s => {
                const slotHour = parseInt(s.startTime.split(':')[0]);
                return slotHour >= currentHour;
            }) || todaysClasses[0];
            setSelectedClass(current);
        }
    }, [viewMode, todaysClasses, selectedClass, currentHour]);

    return (
        <div className="h-full flex gap-6 animate-fade-in pb-6 font-sans">
            {/* Left Panel: Class List */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-80 flex-shrink-0 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm flex flex-col overflow-hidden"
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

                    {/* View Toggle */}
                    <div className="flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-full border border-[var(--md-sys-color-outline)]">
                        <button
                            onClick={() => { setViewMode('today'); setSelectedClass(null); }}
                            className={clsx(
                                "flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                viewMode === 'today' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                        >
                            <Calendar size={14} />
                            Today
                        </button>
                        <button
                            onClick={() => { setViewMode('history'); setSelectedClass(null); }}
                            className={clsx(
                                "flex-1 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                                viewMode === 'history' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                        >
                            <History size={14} />
                            History
                        </button>
                    </div>
                </div>

                {/* Class List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {viewMode === 'today' ? (
                            <motion.div key="today" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                {todaysClasses.length > 0 ? todaysClasses.map((slot, idx) => {
                                    const slotHour = parseInt(slot.startTime.split(':')[0]);
                                    const isActive = slotHour <= currentHour && slotHour + Math.floor(slot.durationMinutes / 60) > currentHour;
                                    const isPast = slotHour + Math.floor(slot.durationMinutes / 60) <= currentHour;

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
                                            <p className="font-bold text-[var(--md-sys-color-on-surface)]">Grade {slot.grade}</p>
                                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-1">
                                                <Clock size={10} /> {slot.startTime} • {slot.durationMinutes}min
                                            </p>
                                        </motion.button>
                                    );
                                }) : (
                                    <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                        <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No classes today</p>
                                        <p className="text-xs mt-1">Check the schedule</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                                {completedClasses.length > 0 ? completedClasses.map((slot, idx) => (
                                    <motion.button
                                        key={slot.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => setSelectedClass(slot)}
                                        className={clsx(
                                            "w-full p-4 rounded-xl text-left transition-all border-l-4",
                                            selectedClass?.id === slot.id
                                                ? "bg-green-50 dark:bg-green-900/20 border-l-green-600 shadow-sm"
                                                : "bg-[var(--md-sys-color-surface-variant)] border-l-transparent hover:bg-[var(--md-sys-color-surface)]"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {slot.subject === 'Solar' ? <Zap size={14} className="text-orange-500" /> : <Monitor size={14} className="text-blue-500" />}
                                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-secondary)]">{slot.subject}</span>
                                            </div>
                                            <CheckCircle size={14} className="text-green-500" />
                                        </div>
                                        <p className="font-bold text-[var(--md-sys-color-on-surface)]">Grade {slot.grade}</p>
                                        <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1 mt-1">
                                            {DAYS[slot.dayOfWeek]} • {slot.startTime}
                                        </p>
                                    </motion.button>
                                )) : (
                                    <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                        <History size={40} className="mx-auto mb-3 opacity-50" />
                                        <p className="font-medium">No completed classes</p>
                                        <p className="text-xs mt-1">Mark classes as complete to see history</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Right Panel: Attendance Sheet */}
            <AnimatePresence>
                {selectedClass ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className={clsx(
                            "p-6 text-white relative overflow-hidden",
                            selectedClass.subject === 'Solar' ? "bg-gradient-to-br from-orange-500 to-red-500" : "bg-gradient-to-br from-blue-600 to-indigo-600"
                        )}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-1 bg-black/20 rounded-md text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                                        {viewMode === 'today' ? 'Today' : 'Completed'}
                                    </span>
                                    <span className="px-2 py-1 bg-black/20 rounded-md text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                                        {DAYS[selectedClass.dayOfWeek]}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-google font-bold">Grade {selectedClass.grade} {selectedClass.subject}</h3>
                                <p className="text-white/80 text-sm font-medium flex items-center gap-2 mt-1">
                                    <Clock size={14} /> {selectedClass.startTime} • {selectedClass.durationMinutes} Minutes
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
                            {viewMode === 'today' && user?.role !== 'viewer' && (
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
                                                <p className="font-bold text-[var(--md-sys-color-on-surface)]">{student.name}</p>
                                                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">Lot {student.lot} • {student.attendancePct}% overall</p>
                                            </div>
                                        </div>

                                        {viewMode === 'today' && user?.role !== 'viewer' ? (
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleAttendance(student, 'present')}
                                                    className={clsx(
                                                        "p-3 rounded-xl transition-all",
                                                        status === 'present'
                                                            ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                                            : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-green-100 hover:text-green-600"
                                                    )}
                                                >
                                                    <Check size={18} strokeWidth={3} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => handleAttendance(student, 'absent')}
                                                    className={clsx(
                                                        "p-3 rounded-xl transition-all",
                                                        status === 'absent'
                                                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                                                            : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-red-100 hover:text-red-600"
                                                    )}
                                                >
                                                    <X size={18} strokeWidth={3} />
                                                </motion.button>
                                            </div>
                                        ) : (
                                            <div className={clsx(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold",
                                                status === 'present' ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                                    status === 'absent' ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                                                        "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
                                            )}>
                                                {status === 'present' && <><CheckCircle size={12} /> Present</>}
                                                {status === 'absent' && <><XCircle size={12} /> Absent</>}
                                                {status === 'unmarked' && <><AlertCircle size={12} /> Unmarked</>}
                                            </div>
                                        )}
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
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm flex items-center justify-center"
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
