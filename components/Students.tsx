import React, { useState, useRef, useEffect } from 'react';
import { AppData, Student, StudentGroup } from '../types';
import { getLevelShortLabel, getLevelsForGroup, getStudentGroups } from '../constants/educationLevels';
import {
    Users, Search, Plus, Camera, Mail, Phone, Calendar, MapPin,
    User, ChevronRight, Filter, Grid3X3, List, Edit3, Save, X, Trash2,
    Zap, Monitor, TrendingUp, BarChart3, GraduationCap, UserPlus, BookOpen, Building2, School, Globe, MessageSquare, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';
import EditStudentModal from './EditStudentModal';
import AddStudentModal from './AddStudentModal';
import VirtualList from './VirtualList';
import { useTheme } from '../contexts/ThemeContext';
import { getSubjectEmoji, getSubjectIconBg, getSubjectPill } from '../utils/subjectUtils';
import { Student3DCluster } from './Student3DCluster';

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
    const { preferences } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState<string>('All');
    const [groupFilter, setGroupFilter] = useState<'All' | StudentGroup>('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | '3d'>('grid');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
        initialSelectedId ? data.students.find(s => s.id === initialSelectedId) || null : null
    );
    const [isEditing, setIsEditing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const { showToast } = useToast();
    const { user } = useAuth();

    const [listHeight, setListHeight] = useState(500);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const calculated = window.innerHeight - rect.top - 24;
                setListHeight(Math.max(calculated, 300));
            }
        };
        setTimeout(updateHeight, 50);
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, [viewMode, data.students]);

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

    return (
        <div className="h-full flex flex-col animate-fade-in pb-6 relative overflow-x-hidden">
            {/* Tech grid mesh background */}
            <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] -z-10" />

            <div className="flex-1 flex flex-col h-full">
                {/* Modern Roster Header */}
                <div className="relative mb-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 to-violet-50/50 dark:from-slate-900/60 dark:to-indigo-950/20 border border-indigo-100/50 dark:border-indigo-500/10 overflow-hidden p-6 md:p-8 backdrop-blur-md shadow-lg shadow-slate-100/10 dark:shadow-none">
                  {/* Subtle kinetic linear animation */}
                  <div className="absolute inset-0 opacity-10 dark:opacity-20 mix-blend-overlay pointer-events-none">
                      <motion.div 
                        animate={{ x: ['-100%', '100%'] }} 
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full h-[2px] top-0" 
                      />
                  </div>

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-indigo-600 text-white dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-500/20">
                             <Users size={22} />
                          </div>
                          <div>
                             <h1 className="text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                                Student Roster
                             </h1>
                             <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-0.5">
                                {data.students.length} students enrolled • {filteredStudents.length} filtered
                             </p>
                          </div>
                      </div>
                      {user?.role !== 'viewer' && (
                          <button
                              onClick={() => setShowAddModal(true)}
                              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 w-fit"
                          >
                              <UserPlus size={16} />
                              Add New Student
                          </button>
                      )}
                  </div>
                </div>

                {/* Filters Bar */}
                <div className="glass-panel p-3.5 sm:p-4 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white/40 dark:bg-slate-900/30 border-white/20 dark:border-white/5 backdrop-blur-xl shadow-sm">
                    {/* Search Field */}
                    <div className="relative flex-1 input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/60 dark:bg-slate-950/45">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Filter by name, cohort, or email..."
                            className="w-full pl-11 pr-4 py-2.5 bg-transparent rounded-xl text-xs focus:outline-none transition-all text-[var(--md-sys-color-on-surface)] placeholder-slate-400 font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Subject Filter Pills */}
                        <div className="flex bg-[var(--md-sys-color-surface-variant)]/60 dark:bg-slate-950/30 rounded-xl p-1 border border-[var(--md-sys-color-outline)] overflow-x-auto custom-scrollbar flex-shrink-0">
                            {['All', ...(preferences.customSubjects || ['Solar', 'ICT'])].map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSubjectFilter(sub)}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 active:scale-95",
                                        subjectFilter === sub
                                            ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                                            : "text-slate-500 hover:text-[var(--md-sys-color-on-surface)]"
                                    )}
                                >
                                    {sub !== 'All' && <span className="text-[10px]">{getSubjectEmoji(sub)}</span>}
                                    {sub}
                                </button>
                            ))}
                        </div>

                        {/* Group Filter Pills */}
                        {getStudentGroups(preferences.institutionType).length > 1 && (
                            <div className="flex bg-[var(--md-sys-color-surface-variant)]/60 dark:bg-slate-950/30 rounded-xl p-1 border border-[var(--md-sys-color-outline)] overflow-x-auto custom-scrollbar flex-shrink-0">
                                {['All', ...getStudentGroups(preferences.institutionType)].map(grp => (
                                    <button
                                        key={grp}
                                        onClick={() => setGroupFilter(grp as any)}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap active:scale-95",
                                            groupFilter === grp
                                                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
                                                : "text-slate-500 hover:text-[var(--md-sys-color-on-surface)]"
                                        )}
                                    >
                                        {grp === 'Campus' && <Building2 size={12} />}
                                        {grp === 'Academy' && <School size={12} />}
                                        {grp === 'CBC' && <BookOpen size={12} />}
                                        {grp === 'High School' && <GraduationCap size={12} />}
                                        <span className="ml-1">{grp}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Roster View Toggle Buttons */}
                        <div className="flex bg-[var(--md-sys-color-surface-variant)]/60 dark:bg-slate-950/30 rounded-xl p-1 border border-[var(--md-sys-color-outline)]">
                            <button
                                onClick={() => setViewMode('grid')}
                                aria-label="Grid view"
                                title="Grid view"
                                className={clsx(
                                    "p-1.5 rounded-lg transition-all active:scale-90",
                                    viewMode === 'grid' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <Grid3X3 size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-label="List view"
                                title="List view"
                                className={clsx(
                                    "p-1.5 rounded-lg transition-all active:scale-90",
                                    viewMode === 'list' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('3d')}
                                aria-label="3D Cluster view"
                                title="3D Cluster view"
                                className={clsx(
                                    "p-1.5 rounded-lg transition-all active:scale-90 flex items-center gap-1 px-2.5",
                                    viewMode === '3d' ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold text-[10px] uppercase tracking-wider" : "text-slate-400 hover:text-slate-200 font-bold text-[10px] uppercase tracking-wider"
                                )}
                            >
                                <Globe size={13} className={clsx(viewMode === '3d' && "animate-spin-slow")} />
                                3D Cluster
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div ref={containerRef} className={clsx(
                    "flex-1 custom-scrollbar",
                    viewMode === 'list' ? "overflow-hidden" : "overflow-y-auto"
                )}>
                    {viewMode === '3d' ? (
                        <div className="w-full h-full relative" style={{ minHeight: '480px' }}>
                          <Student3DCluster
                             students={filteredStudents}
                             selectedStudentId={selectedStudent?.id}
                             onSelectStudent={(id) => setSelectedStudent(data.students.find(s => s.id === id) || null)}
                             subjectFilter={subjectFilter}
                          />
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {filteredStudents.map((student, index) => {
                                    const avg = getStudentAvg(student);
                                    const isAtRisk = avg < 2.5 || student.attendancePct < 80;
                                    const isSelected = selectedStudent?.id === student.id;

                                    return (
                                        <motion.button
                                            key={student.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: index * 0.02 }}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedStudent(student)}
                                            className={clsx(
                                                "glass-card p-5 text-left transition-all relative overflow-hidden group hover:shadow-xl hover:border-indigo-400/50 bg-white/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60",
                                                isSelected
                                                    ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-lg shadow-indigo-500/5"
                                                    : ""
                                            )}
                                        >
                                            {/* Glowing border hover */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                                            {/* At risk / Caution tag */}
                                            {isAtRisk && (
                                                <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 text-[8px] font-bold text-rose-500 uppercase tracking-widest">
                                                   <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping" />
                                                   At Risk
                                                </div>
                                            )}

                                            {/* Photo */}
                                            <div className="relative mx-auto mb-4 w-20">
                                                {student.photo ? (
                                                    <img
                                                        src={student.photo}
                                                        alt={student.name}
                                                        className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white/50 dark:border-slate-800/50"
                                                    />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-150 to-violet-200 dark:from-indigo-950 dark:to-violet-900/30 flex items-center justify-center shadow-md border border-indigo-500/10">
                                                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                            {student.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={clsx(
                                                    "absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-md border-2 border-white dark:border-slate-900",
                                                    getSubjectIconBg(student.subject)
                                                )}>
                                                    <span>{getSubjectEmoji(student.subject)}</span>
                                                </div>
                                            </div>

                                            {/* Group Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider backdrop-blur-sm border",
                                                    student.studentGroup === 'Campus' ? "bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/50" :
                                                        student.studentGroup === 'Academy' ? "bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50" :
                                                            student.studentGroup === 'CBC' ? "bg-sky-50/80 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50" :
                                                                "bg-rose-50/80 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
                                                )}>
                                                    {student.studentGroup}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)] text-center truncate leading-snug">{student.name}</h3>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1 font-semibold">{getLevelShortLabel(student.studentGroup, String(student.grade))} • {preferences.terminology?.cohortLabel || 'Lot'} {student.lot}</p>

                                            {/* Stats Ring preview */}
                                            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/60">
                                                <div className="text-center">
                                                    <p className={clsx(
                                                        "text-base font-black",
                                                        student.attendancePct >= 85 ? "text-emerald-500" :
                                                            student.attendancePct >= 70 ? "text-orange-500" : "text-rose-500"
                                                    )}>
                                                        {student.attendancePct}%
                                                    </p>
                                                    <p className="text-[9px] text-slate-450 dark:text-slate-400 uppercase font-black tracking-wide mt-0.5">Presence</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-base font-black text-indigo-500 dark:text-indigo-400">{avg.toFixed(1)}</p>
                                                    <p className="text-[9px] text-slate-450 dark:text-slate-400 uppercase font-black tracking-wide mt-0.5">Rating</p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    ) : (
                        // List View
                        <VirtualList
                            items={filteredStudents}
                            itemHeight={88}
                            height={listHeight}
                            keyExtractor={(student) => student.id.toString()}
                            className="custom-scrollbar"
                            renderItem={(student) => {
                                const avg = getStudentAvg(student);
                                const isSelected = selectedStudent?.id === student.id;

                                return (
                                    <div style={{ paddingBottom: '8px', height: '100%' }}>
                                        <button
                                            onClick={() => setSelectedStudent(student)}
                                            className={clsx(
                                                "w-full h-full glass-panel px-4 py-3.5 text-left flex items-center gap-4 transition-all active:scale-[0.99] bg-white/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60 hover:border-indigo-400/40",
                                                isSelected
                                                    ? "border-indigo-500 dark:border-indigo-400 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20"
                                                    : ""
                                            )}
                                        >
                                            {student.photo ? (
                                                <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200/40 dark:border-slate-700/40 shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-indigo-500/10">
                                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{student.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[var(--md-sys-color-on-surface)] truncate">{student.name}</h3>
                                                <p className="text-[11px] text-slate-550 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5 font-medium">
                                                    <span className={clsx(
                                                        "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                                        student.studentGroup === 'Campus' ? "bg-indigo-50/80 text-indigo-750 dark:bg-indigo-950/50 dark:text-indigo-300" :
                                                            student.studentGroup === 'Academy' ? "bg-emerald-50/80 text-emerald-755 dark:bg-emerald-950/50 dark:text-emerald-300" :
                                                                student.studentGroup === 'CBC' ? "bg-sky-50/80 text-sky-750 dark:bg-sky-950/50 dark:text-sky-300" :
                                                                    "bg-rose-50/80 text-rose-750 dark:bg-rose-950/50 dark:text-rose-300"
                                                    )}>
                                                        {student.studentGroup}
                                                    </span>
                                                    • {student.subject} • {getLevelShortLabel(student.studentGroup, String(student.grade))} • {preferences.terminology?.cohortLabel || 'Lot'} {student.lot}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-5 text-xs font-bold">
                                                <span className={clsx(
                                                    "font-bold",
                                                    student.attendancePct >= 85 ? "text-emerald-500" : "text-orange-500"
                                                )}>
                                                    {student.attendancePct}%
                                                </span>
                                                <span className="font-black text-indigo-600 dark:text-indigo-400">{avg.toFixed(1)}/4.0</span>
                                                <ChevronRight size={18} className="text-slate-400" />
                                            </div>
                                        </button>
                                    </div>
                                );
                            }}
                        />
                    )}

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-[var(--md-sys-color-surface-variant)] dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200/30 dark:border-slate-800/30">
                                <Users size={32} className="text-slate-400" />
                            </div>
                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">No students found</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or query</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Profile Drawer - Redesigned to be Glassmorphic with Sally AI preview */}
            <AnimatePresence>
                {selectedStudent && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setSelectedStudent(null)}
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                            className="fixed top-0 right-0 bottom-0 w-full max-w-md glass-panel !rounded-none !rounded-l-[32px] shadow-2xl z-50 flex flex-col overflow-hidden border-l border-white/10 !backdrop-blur-2xl bg-slate-900/90 text-white"
                        >
                            {/* Detail Header - ID Card Style */}
                            <div className="p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900/30 border-b border-white/5 relative overflow-hidden group">
                                {/* Cyber matrix grids */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>

                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110 duration-700">
                                    <GraduationCap size={140} />
                                </div>

                                <button
                                    onClick={() => setSelectedStudent(null)}
                                    aria-label="Close profile"
                                    title="Close profile"
                                    className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
                                >
                                    <X size={20} className="text-slate-400 hover:text-white" />
                                </button>

                                <div className="flex flex-col items-center relative z-0">
                                    {/* Institution Brand */}
                                    <div className="text-center mb-6 w-full border-b border-dashed border-white/10 pb-4">
                                        <h2 className="text-[11px] font-black tracking-widest text-indigo-400 uppercase">
                                            {preferences.institutionBranch ? `${preferences.institutionBranch} Branch` : 'PRISM Institute'}
                                        </h2>
                                        <p className="text-[9px] text-slate-500 tracking-wider font-bold">OFFICIAL EVALUATION INDEX</p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                                        {/* Photo Section */}
                                        <div className="flex-shrink-0">
                                            <div className="relative w-28 h-36 bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg">
                                                {selectedStudent.photo ? (
                                                    <img
                                                        src={selectedStudent.photo}
                                                        alt={selectedStudent.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                                        <span className="text-4xl font-black text-slate-600">{selectedStudent.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-3 text-center space-y-2">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm inline-block",
                                                    getSubjectPill(selectedStudent.subject).darkBg,
                                                    getSubjectPill(selectedStudent.subject).darkText,
                                                    getSubjectPill(selectedStudent.subject).darkBorder
                                                )}>
                                                    {getSubjectEmoji(selectedStudent.subject)} {selectedStudent.subject}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 space-y-3 pt-1 text-center sm:text-left">
                                            <div>
                                                <h1 className="text-lg font-black text-white uppercase leading-tight font-space">
                                                    {selectedStudent.name}
                                                </h1>
                                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Adm ID:</span>
                                                    <span className="text-[10px] text-indigo-300 font-bold">{selectedStudent.admissionNumber || 'N/A'}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-400">
                                                {preferences.enabledFields?.nitaNumber && (
                                                    <div>
                                                        <span className="block text-[8px] text-slate-500 uppercase font-bold">NITA ID</span>
                                                        <span className="font-mono font-bold text-slate-350">{selectedStudent.nitaNumber || 'Pending'}</span>
                                                    </div>
                                                )}
                                                {preferences.enabledFields?.kcseGrade && (
                                                    <div>
                                                        <span className="block text-[8px] text-slate-500 uppercase font-bold">KCSE</span>
                                                        <span className="font-mono font-bold text-slate-350">{selectedStudent.kcseGrade || '-'}</span>
                                                    </div>
                                                )}
                                                {preferences.enabledFields?.epraLicenseStatus && (
                                                    <div>
                                                        <span className="block text-[8px] text-slate-500 uppercase font-bold">EPRA Status</span>
                                                        <span className="font-bold text-emerald-400">{selectedStudent.epraLicenseStatus || 'None'}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="block text-[8px] text-slate-500 uppercase font-bold">{preferences.terminology?.cohortLabel || 'Cohort'}</span>
                                                    <span className="font-bold text-slate-350">{selectedStudent.lot}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Details Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                                {/* Quick Sally AI Briefing card */}
                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 space-y-2 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl" />
                                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Sparkles size={12} className="animate-pulse" /> Sally AI Snapshot
                                  </h4>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {selectedStudent.name} demonstrates a stable academic footing with a GPA of <strong>{getStudentAvg(selectedStudent).toFixed(1)}/4.0</strong>. Attendance index checks out at <strong>{selectedStudent.attendancePct}%</strong>.
                                  </p>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact Index</h4>
                                    <div className="space-y-1.5 text-xs text-slate-300">
                                        <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-white/5">
                                            <Mail size={15} className="text-slate-500" />
                                            <span>{selectedStudent.email || 'No email registered'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-950/30 rounded-xl border border-white/5">
                                            <Phone size={15} className="text-slate-500" />
                                            <span>{selectedStudent.phone || 'No phone registered'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="space-y-2.5">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Performance Dashboard</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center">
                                            <p className={clsx(
                                                "text-2xl font-black",
                                                selectedStudent.attendancePct >= 85 ? "text-emerald-400" : "text-orange-400"
                                            )}>
                                                {selectedStudent.attendancePct}%
                                            </p>
                                            <p className="text-[9px] text-emerald-450 uppercase font-black tracking-wide mt-0.5">Presence</p>
                                        </div>
                                        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-center">
                                            <p className="text-2xl font-black text-indigo-400">{getStudentAvg(selectedStudent).toFixed(1)}</p>
                                            <p className="text-[9px] text-indigo-450 uppercase font-black tracking-wide mt-0.5">GPA Index</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="p-4 border-t border-white/5 bg-slate-950/50 backdrop-blur-md space-y-3 pb-safe z-10 relative">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onNavigate('students', selectedStudent.id)}
                                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-bold text-xs transition-colors flex flex-col items-center justify-center gap-1 border border-slate-700/60 active:scale-95 shadow-inner"
                                    >
                                        <User size={16} />
                                        Full Profile Dossier
                                    </button>
                                    <button
                                        onClick={handleViewAnalytics}
                                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold text-xs transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-500/20 active:scale-95 border border-indigo-500/10"
                                    >
                                        <BarChart3 size={16} />
                                        Deep Insights Engine
                                    </button>
                                </div>

                                {user?.role !== 'viewer' && (
                                    <div className="flex gap-2 pt-3 mt-1 border-t border-white/5 border-dashed">
                                        <button
                                            onClick={handleStartEdit}
                                            className="flex-1 py-2 bg-transparent text-slate-400 hover:text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 hover:bg-white/5"
                                        >
                                            <Edit3 size={13} />
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
                                                className="flex-1 py-2 bg-transparent text-rose-500 hover:text-rose-400 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 hover:bg-rose-500/5"
                                            >
                                                <Trash2 size={13} />
                                                Delete Record
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modals */}
            <EditStudentModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                student={selectedStudent}
                onSave={handleSaveEdit}
            />

            <AddStudentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={(student) => {
                    onAddStudent(student);
                    showToast('Student added successfully!', 'success');
                }}
            />
        </div>
    );
};

export default Students;
