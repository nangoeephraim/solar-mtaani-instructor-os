import React, { useState, useRef } from 'react';
import { AppData, Student } from '../types';
import {
    Users, Search, Plus, Camera, Mail, Phone, Calendar, MapPin,
    User, ChevronRight, Filter, Grid3X3, List, Edit3, Save, X,
    Zap, Monitor, TrendingUp, BarChart3, GraduationCap, UserPlus
} from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';

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
    const [newStudent, setNewStudent] = useState({
        name: '',
        grade: 5,
        lot: '',
        subject: 'Solar' as 'Solar' | 'ICT',
        email: '',
        phone: '',
        guardianName: '',
        guardianPhone: ''
    });

    const handleAddNewStudent = () => {
        if (!newStudent.name || !newStudent.lot) {
            showToast('Please fill in name and lot number', 'error');
            return;
        }
        onAddStudent({
            ...newStudent,
            competencies: {},
            attendancePct: 100,
            attendanceHistory: [],
            notes: []
        });
        setShowAddModal(false);
        setNewStudent({ name: '', grade: 5, lot: '', subject: 'Solar', email: '', phone: '', guardianName: '', guardianPhone: '' });
    };

    return (
        <div className="h-full flex gap-6 animate-fade-in pb-6">
            {/* Left Panel - Student Grid/List */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <motion.div
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
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
                                <h1 className="text-2xl font-google font-bold text-gray-900">Students</h1>
                                <p className="text-gray-500 text-sm">{data.students.length} students enrolled</p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => setShowAddModal(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <UserPlus size={18} />
                            Add Student
                        </motion.button>
                    </div>

                    {/* Filters Bar */}
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, lot, or email..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Subject Filter Pills */}
                        <div className="flex bg-gray-100 rounded-full p-1">
                            {(['All', 'Solar', 'ICT'] as const).map(sub => (
                                <button
                                    key={sub}
                                    onClick={() => setSubjectFilter(sub)}
                                    className={clsx(
                                        "px-4 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5",
                                        subjectFilter === sub
                                            ? "bg-white shadow-sm text-gray-900"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    {sub === 'Solar' && <Zap size={12} />}
                                    {sub === 'ICT' && <Monitor size={12} />}
                                    {sub}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === 'grid' ? "bg-white shadow-sm text-violet-600" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx(
                                    "p-2 rounded-lg transition-all",
                                    viewMode === 'list' ? "bg-white shadow-sm text-violet-600" : "text-gray-400 hover:text-gray-600"
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
                                                "bg-white rounded-2xl border-2 p-5 text-left transition-all relative overflow-hidden group",
                                                isSelected
                                                    ? "border-violet-500 shadow-lg shadow-violet-500/20"
                                                    : "border-gray-100 hover:border-violet-200 hover:shadow-md"
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
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-md">
                                                        <span className="text-2xl font-bold text-violet-600">
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
                                            <h3 className="font-bold text-gray-900 text-center truncate">{student.name}</h3>
                                            <p className="text-xs text-gray-500 text-center mt-1">Grade {student.grade} • Lot {student.lot}</p>

                                            {/* Stats */}
                                            <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
                                                <div className="text-center">
                                                    <p className={clsx(
                                                        "text-lg font-bold",
                                                        student.attendancePct >= 85 ? "text-green-600" :
                                                            student.attendancePct >= 70 ? "text-orange-500" : "text-red-500"
                                                    )}>
                                                        {student.attendancePct}%
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Attend</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-violet-600">{avg.toFixed(1)}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Avg</p>
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
                                                "w-full bg-white rounded-xl border-2 p-4 text-left flex items-center gap-4 transition-all",
                                                isSelected
                                                    ? "border-violet-500 shadow-md"
                                                    : "border-gray-100 hover:border-violet-200"
                                            )}
                                        >
                                            {student.photo ? (
                                                <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-xl object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-violet-600">{student.name.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 truncate">{student.name}</h3>
                                                <p className="text-xs text-gray-500">{student.subject} • Grade {student.grade} • Lot {student.lot}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className={clsx(
                                                    "font-bold",
                                                    student.attendancePct >= 85 ? "text-green-600" : "text-orange-500"
                                                )}>
                                                    {student.attendancePct}%
                                                </span>
                                                <span className="font-bold text-violet-600">{avg.toFixed(1)}</span>
                                                <ChevronRight size={18} className="text-gray-300" />
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Users size={32} className="text-gray-400" />
                            </div>
                            <h3 className="font-bold text-gray-600">No students found</h3>
                            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
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
                        className="w-96 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden"
                    >
                        {/* Detail Header */}
                        <div className="p-6 bg-gradient-to-br from-violet-50 to-purple-50 border-b border-gray-100 relative">
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>

                            {/* Photo with Upload */}
                            <div className="relative mx-auto w-24 h-24 mb-4">
                                {(isEditing ? editForm.photo : selectedStudent.photo) ? (
                                    <img
                                        src={isEditing ? editForm.photo : selectedStudent.photo}
                                        alt={selectedStudent.name}
                                        className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <span className="text-3xl font-bold text-white">{selectedStudent.name.charAt(0)}</span>
                                    </div>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
                                        >
                                            <Camera size={16} className="text-violet-600" />
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </>
                                )}
                            </div>

                            {isEditing ? (
                                <input
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="text-xl font-bold text-center w-full bg-white rounded-lg px-3 py-2 border border-gray-200 focus:ring-2 focus:ring-violet-500"
                                />
                            ) : (
                                <h2 className="text-xl font-google font-bold text-gray-900 text-center">{selectedStudent.name}</h2>
                            )}

                            <div className="flex justify-center gap-2 mt-3">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                                    selectedStudent.subject === 'Solar' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {selectedStudent.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                    {selectedStudent.subject}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                                    Grade {selectedStudent.grade}
                                </span>
                            </div>
                        </div>

                        {/* Details Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Information</h4>

                                <div className="space-y-2">
                                    {/* Email */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Mail size={16} className="text-gray-400" />
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                value={editForm.email || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                placeholder="Email address"
                                                className="flex-1 bg-transparent text-sm focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-700">{selectedStudent.email || 'No email'}</span>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Phone size={16} className="text-gray-400" />
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editForm.phone || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                placeholder="Phone number"
                                                className="flex-1 bg-transparent text-sm focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-700">{selectedStudent.phone || 'No phone'}</span>
                                        )}
                                    </div>

                                    {/* Date of Birth */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Calendar size={16} className="text-gray-400" />
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.dateOfBirth || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                className="flex-1 bg-transparent text-sm focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-700">{selectedStudent.dateOfBirth || 'No DOB'}</span>
                                        )}
                                    </div>

                                    {/* Address */}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <MapPin size={16} className="text-gray-400" />
                                        {isEditing ? (
                                            <input
                                                value={editForm.address || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Address"
                                                className="flex-1 bg-transparent text-sm focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-700">{selectedStudent.address || 'No address'}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Guardian Info */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Guardian Information</h4>

                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 space-y-3">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold">Name</label>
                                        {isEditing ? (
                                            <input
                                                value={editForm.guardianName || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, guardianName: e.target.value }))}
                                                placeholder="Guardian name"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-violet-500"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">{selectedStudent.guardianName || 'Not specified'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold">Phone</label>
                                        {isEditing ? (
                                            <input
                                                value={editForm.guardianPhone || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                                                placeholder="Guardian phone"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-violet-500"
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">{selectedStudent.guardianPhone || 'Not specified'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Performance Summary</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 text-center">
                                        <p className={clsx(
                                            "text-2xl font-bold",
                                            selectedStudent.attendancePct >= 85 ? "text-green-600" : "text-orange-500"
                                        )}>
                                            {selectedStudent.attendancePct}%
                                        </p>
                                        <p className="text-[10px] text-green-700 font-bold uppercase">Attendance</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 text-center">
                                        <p className="text-2xl font-bold text-violet-600">{getStudentAvg(selectedStudent).toFixed(1)}</p>
                                        <p className="text-[10px] text-violet-700 font-bold uppercase">Avg Score</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setIsEditing(false); setEditForm({}); }}
                                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 transition-colors"
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
                                    <button
                                        onClick={handleStartEdit}
                                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Edit3 size={16} />
                                        Edit Profile
                                    </button>
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
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
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
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
                                    <input
                                        value={newStudent.name}
                                        onChange={e => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                        placeholder="Enter student name"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Lot Number *</label>
                                        <input
                                            value={newStudent.lot}
                                            onChange={e => setNewStudent(prev => ({ ...prev, lot: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                                            placeholder="e.g., L001"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Grade</label>
                                        <select
                                            value={newStudent.grade}
                                            onChange={e => setNewStudent(prev => ({ ...prev, grade: parseInt(e.target.value) }))}
                                            className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                                        >
                                            {[5, 6, 7, 8].map(g => <option key={g} value={g}>Grade {g}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                                    <div className="flex gap-3 mt-2">
                                        {(['Solar', 'ICT'] as const).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setNewStudent(prev => ({ ...prev, subject: s }))}
                                                className={clsx(
                                                    "flex-1 py-3 rounded-xl border-2 text-sm font-bold flex items-center justify-center gap-2 transition-all",
                                                    newStudent.subject === s
                                                        ? s === 'Solar' ? "border-orange-500 bg-orange-50 text-orange-700" : "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-gray-200 hover:border-gray-300"
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
                                        <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                                        <input
                                            type="email"
                                            value={newStudent.email}
                                            onChange={e => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                                        <input
                                            type="tel"
                                            value={newStudent.phone}
                                            onChange={e => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100">
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
