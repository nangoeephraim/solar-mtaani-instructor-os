import React, { useState, useRef } from 'react';
import { AppData, Student } from '../types';
import {
    Users, Search, Plus, Camera, Mail, Phone, Calendar, MapPin,
    User, ChevronRight, Filter, Grid3X3, List, Edit3, Save, X, Trash2,
    Zap, Monitor, TrendingUp, BarChart3, GraduationCap, UserPlus
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { useAuth } from '../contexts/AuthContext';

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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(
        initialSelectedId ? data.students.find(s => s.id === initialSelectedId) || null : null
    );
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Student>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast } = useToast();
    const { user } = useAuth();

    const filteredStudents = data.students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.lot.includes(searchTerm) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubject = subjectFilter === 'All' || s.subject === subjectFilter;
        return matchesSearch && matchesSubject;
    });

    const getStudentAvg = (student: Student) => {
        const vals = Object.values(student.competencies);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedStudent) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setEditForm(prev => ({ ...prev, photo: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveEdit = () => {
        if (selectedStudent) {
            const updated = { ...selectedStudent, ...editForm };
            onUpdateStudent(updated, true);
            setSelectedStudent(updated);
            setIsEditing(false);
            setEditForm({});
        }
    };

    const handleStartEdit = () => {
        if (selectedStudent) {
            setEditForm(selectedStudent);
            setIsEditing(true);
        }
    };

    const handleViewAnalytics = () => {
        if (selectedStudent) {
            onNavigate('student-analytics', selectedStudent.id);
        }
    };

    // New student form state
    const [newStudent, setNewStudent] = useState<Partial<Student>>({
        name: '',
        grade: 5,
        lot: '',
        subject: 'Solar',
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
            name: '', grade: 5, lot: '', subject: 'Solar', email: '', phone: '', guardianName: '', guardianPhone: '',
            nitaNumber: '', admissionNumber: '', kcseGrade: '', epraLicenseStatus: 'None', assessment: { units: {}, termStats: [] }
        });
    };

    return (
        <div className="h-full flex gap-6 animate-fade-in pb-6">
            {/* Left Panel - Student Grid/List */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <motion.div
                    className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm p-6 mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <motion.div
                                className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/30"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                <Users size={28} className="text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)]">Students</h1>
                                <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm">{data.students.length} students enrolled</p>
                            </div>
                        </div>
                        {user?.role !== 'viewer' && (
                            <motion.button
                                onClick={() => setShowAddModal(true)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <UserPlus size={18} />
                                Add Student
                            </motion.button>
                        )}
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-outline)]" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, lot, or email..."
                                className="w-full pl-11 pr-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Subject Filter Pills */}
                        <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-full p-1 border border-[var(--md-sys-color-outline)]">
                            {(['All', 'Solar', 'ICT'] as const).map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSubjectFilter(sub)}
                                    className={clsx(
                                        "px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5",
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

                        {/* View Toggle */}
                        <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-xl p-1 border border-[var(--md-sys-color-outline)]">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === 'grid' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-violet-600" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                )}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === 'list' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-violet-600" : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                                )}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Students Grid/List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                                                    ? "border-violet-500 shadow-lg shadow-violet-500/20"
                                                    : "border-[var(--md-sys-color-outline)] hover:border-violet-200 hover:shadow-md"
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

                                            {/* Info */}
                                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)] text-center truncate">{student.name}</h3>
                                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] text-center mt-1">Grade {student.grade} • Lot {student.lot}</p>

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
                                                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">{student.subject} • Grade {student.grade} • Lot {student.lot}</p>
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

            {/* Right Panel - Student Details */}
            <AnimatePresence>
                {selectedStudent && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        className="w-96 bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline)] shadow-sm flex flex-col overflow-hidden"
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

                                <div className="flex gap-6 w-full">
                                    {/* Photo Section */}
                                    <div className="flex-shrink-0">
                                        <div className="relative w-32 h-40 bg-gray-200 rounded-lg overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                                            {(isEditing ? editForm.photo : selectedStudent.photo) ? (
                                                <img
                                                    src={isEditing ? editForm.photo : selectedStudent.photo}
                                                    alt={selectedStudent.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                                    <span className="text-4xl font-black text-slate-400 dark:text-slate-500">{selectedStudent.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            {isEditing && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-md text-violet-600 hover:bg-violet-50"
                                                >
                                                    <Camera size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="mt-3 text-center">
                                            <span className={clsx(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                selectedStudent.subject === 'Solar'
                                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                    : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800"
                                            )}>
                                                {selectedStudent.subject}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 space-y-3 pt-1">
                                        <div>
                                            {isEditing ? (
                                                <input
                                                    value={editForm.name || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                    className="text-xl font-bold w-full bg-white/50 border border-gray-300 rounded px-2 py-1"
                                                />
                                            ) : (
                                                <h1 className="text-xl font-black text-[var(--md-sys-color-on-surface)] uppercase leading-tight font-google">
                                                    {selectedStudent.name}
                                                </h1>
                                            )}
                                            <p className="text-xs text-[var(--md-sys-color-secondary)] uppercase tracking-wide mt-1">
                                                Adm: <span className="text-[var(--md-sys-color-on-surface)] font-bold">{selectedStudent.admissionNumber || 'N/A'}</span>
                                            </p>
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
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={editForm.email || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="Email address"
                                                className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                            />
                                        ) : (
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.email || 'No email'}</span>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                        <Phone size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editForm.phone || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="Phone number"
                                                className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                            />
                                        ) : (
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.phone || 'No phone'}</span>
                                        )}
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                        <Calendar size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.dateOfBirth || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)]"
                                            />
                                        ) : (
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.dateOfBirth || 'No DOB'}</span>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                        <MapPin size={16} className="text-[var(--md-sys-color-on-surface-variant)]" />
                                        {isEditing ? (
                                            <input
                                                value={editForm.address || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Address"
                                                className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                            />
                                        ) : (
                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.address || 'No address'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Guardian Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Guardian Information</h4>

                                <div className="p-4 bg-[var(--md-sys-color-surface-variant)] rounded-xl border border-[var(--md-sys-color-outline)] space-y-3">
                                    <div>
                                        <label className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold">Name</label>
                                        {isEditing ? (
                                            <input
                                                value={editForm.guardianName || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, guardianName: e.target.value }))}
                                                placeholder="Guardian name"
                                                className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianName || 'Not specified'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold">Phone</label>
                                        {isEditing ? (
                                            <input
                                                value={editForm.guardianPhone || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                                                placeholder="Guardian phone"
                                                className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianPhone || 'Not specified'}</p>
                                        )}
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
                        <div className="p-4 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] space-y-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setIsEditing(false); setEditForm({}); }}
                                        className="flex-1 py-3 bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors border border-[var(--md-sys-color-outline)]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Save size={16} />
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleViewAnalytics}
                                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        <BarChart3 size={16} />
                                        View Full Analytics
                                    </button>

                                    {user?.role !== 'viewer' && (
                                        <button
                                            onClick={handleStartEdit}
                                            className="w-full py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={16} />
                                            Edit Profile
                                        </button>
                                    )}

                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                                    onDeleteStudent(selectedStudent.id);
                                                    setSelectedStudent(null);
                                                    showToast('Student deleted successfully', 'success');
                                                }
                                            }}
                                            className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Delete Student
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 bg-gradient-to-r from-violet-600 to-purple-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <UserPlus size={20} className="text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Add New Student</h3>
                                    </div>
                                    <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                        <X size={20} className="text-white" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
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
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Grade</label>
                                        <select
                                            value={newStudent.grade}
                                            onChange={e => setNewStudent(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                                            className="w-full mt-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                        >
                                            {[5, 6, 7, 8].map(g => <option key={g} value={g}>Grade {g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Subject</label>
                                    <div className="flex gap-3 mt-2">
                                        {(['Solar', 'ICT'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setNewStudent(prev => ({ ...prev, subject: s }))}
                                                className={clsx(
                                                    "flex-1 py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                                    newStudent.subject === s
                                                        ? s === 'Solar' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" : "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                                        : "border-[var(--md-sys-color-outline)] hover:border-violet-200 text-[var(--md-sys-color-on-surface-variant)]"
                                                )}
                                            >
                                                {s === 'Solar' ? <Zap size={16} /> : <Monitor size={16} />}
                                                {s}
                                            </button>
                                        ))}
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
                                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                                >
                                    Add Student
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Students;
