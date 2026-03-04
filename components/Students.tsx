import React, { useState, useRef } from 'react';
import { AppData, Student, StudentGroup } from '../types';
import { getLevelShortLabel, getLevelsForGroup, getDefaultLevel } from '../constants/educationLevels';
import {
    Users, Search, Plus, Camera, Mail, Phone, Calendar, MapPin,
    User, ChevronRight, Filter, Grid3X3, List, Edit3, Save, X, Trash2,
    Zap, Monitor, TrendingUp, BarChart3, GraduationCap, UserPlus, BookOpen, Building2, School
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';
import EditStudentModal from './EditStudentModal';

interface StudentsProps {
    data: AppData;
    onUpdateStudent: (student: Student, notify?: boolean) => void;
    onAddStudent: (student: Omit<Student, 'id'>) => void;
    onDeleteStudent: (studentId: number) => void;
    onNavigate: (view: string, studentId?: number) => void;
    selectedStudentId?: number;
}

const Students: React.FC<StudentsProps> = ({
    data,
    onUpdateStudent,
    onAddStudent,
    onDeleteStudent,
    onNavigate,
    selectedStudentId: initialSelectedId
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState<'All' | 'Solar' | 'ICT'>('All');
    const [groupFilter, setGroupFilter] = useState<'All' | StudentGroup>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
        initialSelectedId ? data.students.find(s => s.id === initialSelectedId) || null : null
    );
    const [isEditing, setIsEditing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    const filteredStudents = data.students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.lot.includes(searchTerm) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = subjectFilter === 'All' || s.subject === subjectFilter;
        const matchesGroup = groupFilter === 'All' || s.studentGroup === groupFilter;
        return matchesSearch && matchesSubject && matchesGroup;
    });

    const getStudentAvg = (student: Student) => {
        const vals = Object.values(student.competencies);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const handleSaveEdit = (updatedStudent: Student) => {
        onUpdateStudent(updatedStudent, true);
        setSelectedStudent(updatedStudent);
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        setIsEditing(true);
    };

    const handleViewAnalytics = () => {
        if (selectedStudent) {
            onNavigate('student-analytics', selectedStudent.id);
        }
    };

    // New student form state
    const [newStudent, setNewStudent] = useState<Partial<Student>>({
        name: '',
        grade: 'L3',
        lot: '',
        subject: 'Solar',
        studentGroup: 'Academy',
        email: '',
        phone: '',
        guardianName: '',
        guardianPhone: '',
        nitaNumber: '',
        admissionNumber: '',
        kcseGrade: '',
        epraLicenseStatus: 'None',
        assessment: { units: {}, termStats: [] }
    });

    const handleAddNewStudent = () => {
        if (!newStudent.name || !newStudent.lot) {
            showToast('Please fill in name and lot number', 'error');
            return;
        }
        onAddStudent({
            ...newStudent as Student,
            competencies: {},
            attendancePct: 100,
            attendanceHistory: [],
            notes: [],
            assessment: { units: {}, termStats: [] }
        });
        setShowAddModal(false);
        setNewStudent({
            name: '', grade: 'L3', lot: '', subject: 'Solar', studentGroup: 'Academy', email: '', phone: '', guardianName: '', guardianPhone: '',
            nitaNumber: '', admissionNumber: '', kcseGrade: '', epraLicenseStatus: 'None', assessment: { units: {}, termStats: [] }
        });
    };

    return (
        <div className="h-full flex flex-col animate-fade-in pb-6 relative">
            {/* Main Content - Student Grid/List */}
            <div className="flex-1 flex flex-col h-full">
                {/* Distinct Roster Header */}
                <div className="relative mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 overflow-hidden p-6 md:p-8">
                    {/* Subtle animated pattern */}
                    <div className="absolute inset-0 opacity-20 dark:opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-black/50 to-transparent -translate-x-full" />
                    </div>
                    <div className="relative z-10">
                        <PageHeader
                            title="Students"
                            subtitle={`${data.students.length} students enrolled`}
                            icon={Users}
                            action={user?.role !== 'viewer' ? (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                >
                                    <UserPlus size={18} />
                                    Add Student
                                </button>
                            ) : undefined}
                        />
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-3 sm:p-4 mb-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-outline)]" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, lot, or email..."
                            className="w-full pl-11 pr-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                        {/* Subject Filter Pills */}
                        <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1 border border-[var(--md-sys-color-outline)]">
                            {(['All', 'Solar', 'ICT'] as const).map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSubjectFilter(sub)}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5",
                                        subjectFilter === sub
                                            ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]"
                                            : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                    )}
                                >
                                    {sub === 'Solar' && <Zap size={12} />}
                                    {sub === 'ICT' && <Monitor size={12} />}
                                    {sub}
                                </button>
                            ))}
                        </div>

                        {/* Group Filter Pills */}
                        <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1 border border-[var(--md-sys-color-outline)] overflow-x-auto custom-scrollbar flex-shrink-0">
                            {(['All', 'Campus', 'Academy', 'CBC', 'High School'] as const).map(grp => (
                                <button
                                    key={grp}
                                    onClick={() => setGroupFilter(grp as any)}
                                    className={clsx(
                                        "px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0",
                                        groupFilter === grp
                                            ? "bg-[var(--md-sys-color-surface)] shadow-sm text-indigo-600 dark:text-indigo-400"
                                            : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                    )}
                                >
                                    {grp === 'Campus' && <Building2 size={12} />}
                                    {grp === 'Academy' && <School size={12} />}
                                    {grp === 'CBC' && <BookOpen size={12} />}
                                    {grp === 'High School' && <GraduationCap size={12} />}
                                    {grp}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle - hidden on small mobile */}
                        <div className="hidden sm:flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1 border border-[var(--md-sys-color-outline)]">
                            <button
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                title="Grid view"
                                className={clsx(
                                    "p-1.5 rounded-md transition-all",
                                    viewMode === 'grid' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-violet-600" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                )}
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                title="List view"
                                className={clsx(
                                    "p-1.5 rounded-md transition-all",
                                    viewMode === 'list' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-violet-600" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                )}
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Students Grid/List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {filteredStudents.map((student, index) => {
                                    const avg = getStudentAvg(student);
                                    const isAtRisk = avg < 2.5 || student.attendancePct < 80;
                                    const isSelected = selectedStudent?.id === student.id;

                                    return (
                                        <motion.button
                                            key={student.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: index * 0.03 }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedStudent(student)}
                                            className={clsx(
                                                "bg-[var(--md-sys-color-surface)] rounded-2xl border-2 p-5 text-left transition-all relative overflow-hidden group",
                                                isSelected
                                                    ? "border-[var(--md-sys-color-primary)] shadow-lg shadow-[var(--md-sys-color-primary-container)]"
                                                    : "border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:shadow-md"
                                            )}
                                        >
                                            {/* Risk Indicator */}
                                            {isAtRisk && (
                                                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-400" />
                                            )}

                                            {/* Photo */}
                                            <div className="relative mx-auto mb-4">
                                                {student.photo ? (
                                                    <img
                                                        src={student.photo}
                                                        alt={student.name}
                                                        className="w-20 h-20 rounded-2xl object-cover shadow-md"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-md">
                                                        <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                                                            {student.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={clsx(
                                                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md",
                                                    student.subject === 'Solar' ? "bg-orange-500" : "bg-blue-500"
                                                )}>
                                                    {student.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                                </div>
                                            </div>

                                            {/* Group Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm border",
                                                    student.studentGroup === 'Campus' ? "bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800" :
                                                        student.studentGroup === 'Academy' ? "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800" :
                                                            student.studentGroup === 'CBC' ? "bg-sky-100/80 text-sky-700 border-sky-200 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-800" :
                                                                "bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800"
                                                )}>
                                                    {student.studentGroup}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)] text-center truncate">{student.name}</h3>
                                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] text-center mt-1">{getLevelShortLabel(student.studentGroup, String(student.grade))} • Lot {student.lot}</p>

                                            {/* Stats */}
                                            <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-[var(--md-sys-color-outline)]">
                                                <div className="text-center">
                                                    <p className={clsx(
                                                        "text-lg font-bold",
                                                        student.attendancePct >= 85 ? "text-green-600 dark:text-green-400" :
                                                            student.attendancePct >= 70 ? "text-orange-500 dark:text-orange-400" : "text-red-500 dark:text-red-400"
                                                    )}>
                                                        {student.attendancePct}%
                                                    </p>
                                                    <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold">Attend</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{avg.toFixed(1)}</p>
                                                    <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold">Avg</p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        // List View
                        <div className="space-y-2">
                            <AnimatePresence>
                                {filteredStudents.map((student, index) => {
                                    const avg = getStudentAvg(student);
                                    const isSelected = selectedStudent?.id === student.id;

                                    return (
                                        <motion.button
                                            key={student.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            whileHover={{ x: 4 }}
                                            onClick={() => setSelectedStudent(student)}
                                            className={clsx(
                                                "w-full bg-[var(--md-sys-color-surface)] rounded-xl border-2 p-4 text-left flex items-center gap-4 transition-all",
                                                isSelected
                                                    ? "border-violet-500 shadow-md"
                                                    : "border-[var(--md-sys-color-outline)] hover:border-violet-200"
                                            )}
                                        >
                                            {student.photo ? (
                                                <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{student.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] truncate">{student.name}</h3>
                                                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5 flex-wrap">
                                                    <span className={clsx(
                                                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                                        student.studentGroup === 'Campus' ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" :
                                                            student.studentGroup === 'Academy' ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                                student.studentGroup === 'CBC' ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" :
                                                                    "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                                    )}>
                                                        {student.studentGroup}
                                                    </span>
                                                    • {student.subject} • {getLevelShortLabel(student.studentGroup, String(student.grade))} • Lot {student.lot}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className={clsx(
                                                    "font-bold",
                                                    student.attendancePct >= 85 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                                                )}>
                                                    {student.attendancePct}%
                                                </span>
                                                <span className="font-bold text-violet-600 dark:text-violet-400">{avg.toFixed(1)}</span>
                                                <ChevronRight size={18} className="text-[var(--md-sys-color-secondary)]" />
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-[var(--md-sys-color-secondary)]" />
                            </div>
                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">No students found</h3>
                            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mt-1">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Profile Drawer */}
            <AnimatePresence>
                {selectedStudent && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedStudent(null)}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[var(--md-sys-color-surface)] shadow-2xl z-50 flex flex-col overflow-hidden border-l border-[var(--md-sys-color-outline)]"
                        >
                            {/* Detail Header - ID Card Style */}
                            <div className="p-6 bg-gradient-to-br from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-b border-[var(--md-sys-color-outline)] relative overflow-hidden group">
                                {/* Watermark/Pattern - Subtle Tech Texture */}
                                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                                    <Zap size={140} />
                                </div>

                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    aria-label="Close profile"
                                    title="Close profile"
                                    className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
                                >
                                    <X size={20} className="text-[var(--md-sys-color-secondary)]" />
                                </button>

                                <div className="flex flex-col items-center relative z-0">
                                    {/* Organization Header */}
                                    <div className="text-center mb-6 w-full border-b border-dashed border-gray-300 dark:border-gray-700 pb-4">
                                        <h2 className="text-sm font-bold tracking-widest text-[var(--md-sys-color-secondary)] uppercase">PRISM Technical Institute</h2>
                                        <p className="text-[10px] text-[var(--md-sys-color-outline)] tracking-wider">OFFICIAL STUDENT IDENTIFICATION</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                                        {/* Photo Section */}
                                        <div className="flex-shrink-0">
                                            <div className="relative w-32 h-40 bg-gray-200 rounded-lg overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                                                {selectedStudent.photo ? (
                                                    <img
                                                        src={selectedStudent.photo}
                                                        alt={selectedStudent.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                                        <span className="text-4xl font-black text-slate-400 dark:text-slate-500">{selectedStudent.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-3 text-center space-y-2">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                    selectedStudent.subject === 'Solar'
                                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                        : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800"
                                                )}>
                                                    {selectedStudent.subject}
                                                </span>

                                                {/* Group dropdown */}
                                                <span className={clsx(
                                                    "block mx-auto w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm mt-1",
                                                    selectedStudent.studentGroup === 'Campus' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" :
                                                        selectedStudent.studentGroup === 'Academy' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                                                            selectedStudent.studentGroup === 'CBC' ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" :
                                                                "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                                                )}>
                                                    {selectedStudent.studentGroup}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 space-y-3 pt-1">
                                            <div>
                                                <h1 className="text-xl font-black text-[var(--md-sys-color-on-surface)] uppercase leading-tight font-google">
                                                    {selectedStudent.name}
                                                </h1>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-[var(--md-sys-color-secondary)] uppercase tracking-wide">Adm:</span>
                                                    <span className="text-xs text-[var(--md-sys-color-on-surface)] font-bold">{selectedStudent.admissionNumber || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                                <div>
                                                    <span className="block text-[9px] text-[var(--md-sys-color-outline)] uppercase">NITA Reg No.</span>
                                                    <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.nitaNumber || 'Pending'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-[var(--md-sys-color-outline)] uppercase">KCSE Grade</span>
                                                    <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.kcseGrade || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-[var(--md-sys-color-outline)] uppercase">EPRA Status</span>
                                                    <span className={clsx(
                                                        "font-bold",
                                                        selectedStudent.epraLicenseStatus === 'None' ? "text-gray-400" : "text-green-600"
                                                    )}>
                                                        {selectedStudent.epraLicenseStatus || 'None'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="block text-[9px] text-[var(--md-sys-color-outline)] uppercase">Cohort</span>
                                                    <span className="font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.lot}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                {/* Contact Info */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Contact Information</h4>

                                    <div className="space-y-2">
                                        {/* Email */}
                                        <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                            <Mail size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.email || 'No email'}</span>
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                            <Phone size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.phone || 'No phone'}</span>
                                        </div>

                                        {/* Date of Birth */}
                                        <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                            <Calendar size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.dateOfBirth || 'No DOB'}</span>
                                        </div>

                                        {/* Address */}
                                        <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                            <MapPin size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.address || 'No address'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Guardian Info */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Guardian Information</h4>

                                    <div className="p-4 bg-[var(--md-sys-color-surface-variant)] rounded-xl border border-[var(--md-sys-color-outline)] space-y-3">
                                        <div>
                                            <label className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold">Name</label>
                                            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianName || 'Not specified'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold">Phone</label>
                                            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianPhone || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Performance Summary</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                                            <p className={clsx(
                                                "text-2xl font-bold",
                                                selectedStudent.attendancePct >= 85 ? "text-green-600 dark:text-green-400" : "text-orange-500 dark:text-orange-400"
                                            )}>
                                                {selectedStudent.attendancePct}%
                                            </p>
                                            <p className="text-[10px] text-green-700 dark:text-green-400 font-bold uppercase">Attendance</p>
                                        </div>
                                        <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-100 dark:border-violet-900/30 text-center">
                                            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{getStudentAvg(selectedStudent).toFixed(1)}</p>
                                            <p className="text-[10px] text-violet-700 dark:text-violet-400 font-bold uppercase">Avg Score</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-4 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] space-y-3 pb-safe z-10 relative">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onNavigate('students', selectedStudent.id)}
                                        className="w-full py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex flex-col items-center justify-center gap-1 border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md"
                                    >
                                        <User size={18} />
                                        Full Profile
                                    </button>
                                    <button
                                        onClick={handleViewAnalytics}
                                        className="w-full py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg"
                                    >
                                        <BarChart3 size={18} />
                                        Deep Insights
                                    </button>
                                </div>

                                {user?.role !== 'viewer' && (
                                    <div className="flex gap-2 pt-3 mt-1 border-t border-[var(--md-sys-color-outline)] border-dashed">
                                        <button
                                            onClick={handleStartEdit}
                                            className="flex-1 py-2 bg-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-[var(--md-sys-color-surface-variant)]"
                                        >
                                            <Edit3 size={14} />
                                            Quick Edit
                                        </button>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                                        onDeleteStudent(selectedStudent.id);
                                                        setSelectedStudent(null);
                                                        showToast('Student deleted successfully', 'success');
                                                    }
                                                }}
                                                className="flex-1 py-2 bg-transparent text-rose-500 hover:text-rose-700 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* Edit Student Modal */}
            <EditStudentModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                student={selectedStudent}
                onSave={handleSaveEdit}
            />

            {/* Add Student Modal */}

            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-md max-h-[85vh] flex flex-col overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 bg-[var(--md-sys-color-primary)] flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <UserPlus size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Add New Student</h3>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} aria-label="Close modal" title="Close modal" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <X size={20} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Full Name *</label>
                                    <input
                                        value={newStudent.name}
                                        onChange={e => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent text-[var(--md-sys-color-on-surface)]"
                                        placeholder="Enter student name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Lot Number *</label>
                                        <input
                                            value={newStudent.lot}
                                            onChange={e => setNewStudent(prev => ({ ...prev, lot: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                            placeholder="e.g., L001"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Level</label>
                                        <select
                                            value={newStudent.grade}
                                            onChange={e => setNewStudent(prev => ({ ...prev, grade: e.target.value }))}
                                            aria-label="Education Level"
                                            title="Education Level"
                                            className="w-full mt-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                        >
                                            {getLevelsForGroup(newStudent.studentGroup || 'Academy').map(lvl => <option key={lvl.id} value={lvl.id}>{lvl.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Subject</label>
                                        <div className="flex gap-2 mt-2">
                                            {(['Solar', 'ICT'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setNewStudent(prev => ({ ...prev, subject: s }))}
                                                    className={clsx(
                                                        "flex-1 py-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all",
                                                        newStudent.subject === s
                                                            ? s === 'Solar' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" : "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                                            : "border-[var(--md-sys-color-outline)] hover:border-violet-200 text-[var(--md-sys-color-on-surface-variant)]"
                                                    )}
                                                >
                                                    {s === 'Solar' ? <Zap size={14} /> : <Monitor size={14} />}
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Group *</label>
                                        <select
                                            value={newStudent.studentGroup}
                                            onChange={e => setNewStudent(prev => ({ ...prev, studentGroup: e.target.value as any }))}
                                            aria-label="Student Group"
                                            title="Student Group"
                                            className="w-full mt-2 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)] h-[68px]"
                                        >
                                            <option value="Campus">Campus</option>
                                            <option value="Academy">Academy</option>
                                            <option value="CBC">CBC</option>
                                            <option value="High School">High School</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Email</label>
                                        <input
                                            type="email"
                                            value={newStudent.email}
                                            onChange={e => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Phone</label>
                                        <input
                                            type="tel"
                                            value={newStudent.phone}
                                            onChange={e => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>

                                {/* Regulatory Fields */}
                                <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/50 rounded-xl border border-[var(--md-sys-color-outline)] space-y-3">
                                    <h4 className="text-xs font-bold text-[var(--md-sys-color-primary)] uppercase flex items-center gap-2">
                                        <GraduationCap size={14} /> Official Registration
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Admission No.</label>
                                            <input
                                                value={newStudent.admissionNumber || ''}
                                                onChange={e => setNewStudent(prev => ({ ...prev, admissionNumber: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-sm"
                                                placeholder="e.g. ADM2023/001"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">NITA Reg No.</label>
                                            <input
                                                value={newStudent.nitaNumber || ''}
                                                onChange={e => setNewStudent(prev => ({ ...prev, nitaNumber: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-sm"
                                                placeholder="NITA/..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">EPRA License</label>
                                            <select
                                                value={newStudent.epraLicenseStatus || 'None'}
                                                onChange={e => setNewStudent(prev => ({ ...prev, epraLicenseStatus: e.target.value as any }))}
                                                aria-label="EPRA License"
                                                title="EPRA License"
                                                className="w-full mt-1 px-3 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-sm"
                                            >
                                                <option value="None">None</option>
                                                <option value="T1">PV T1</option>
                                                <option value="T2">PV T2</option>
                                                <option value="T3">PV T3</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">KCSE Grade</label>
                                            <input
                                                value={newStudent.kcseGrade || ''}
                                                onChange={e => setNewStudent(prev => ({ ...prev, kcseGrade: e.target.value }))}
                                                className="w-full mt-1 px-3 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg text-sm"
                                                placeholder="e.g. C-"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-[var(--md-sys-color-surface-variant)] border-t border-[var(--md-sys-color-outline)]">
                                <button
                                    onClick={handleAddNewStudent}
                                    className="w-full py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                                >
                                    Add Student
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Students;
