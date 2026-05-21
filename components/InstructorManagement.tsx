import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, X, BookOpen, GraduationCap, Briefcase, UserCheck, UserX, Trash2, ChevronDown, Save } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import PageHeader from './PageHeader';
import WordRotator from './WordRotator';
import {
    InstructorProfile,
    ClassAssignment,
    InstructorWorkload,
    getAllInstructors,
    getInstructorWorkloads,
    getAllClassAssignments,
    assignInstructorToClass,
    unassignInstructorFromClass,
    updateInstructorProfile,
} from '../services/instructorService';
import { STUDENT_GROUPS, getLevelsForGroup } from '../constants/educationLevels';
import type { StudentGroup } from '../types';

const InstructorManagement: React.FC = () => {
    const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
    const [workloads, setWorkloads] = useState<InstructorWorkload[]>([]);
    const [assignments, setAssignments] = useState<ClassAssignment[]>([]);
    const [selectedInstructor, setSelectedInstructor] = useState<InstructorProfile | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    // Assignment form state
    const [assignForm, setAssignForm] = useState({
        grade: '',
        subject: 'Solar' as 'Solar' | 'ICT',
        studentGroup: 'Academy' as StudentGroup,
        term: 1 as 1 | 2 | 3,
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        const [ins, wl, asgn] = await Promise.all([
            getAllInstructors(),
            getInstructorWorkloads(),
            getAllClassAssignments(),
        ]);
        setInstructors(ins);
        setWorkloads(wl);
        setAssignments(asgn);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAssignClass = async () => {
        if (!selectedInstructor || !assignForm.grade) return;

        const success = await assignInstructorToClass(
            selectedInstructor.id,
            assignForm.grade,
            assignForm.subject,
            assignForm.studentGroup,
            assignForm.term
        );

        if (success) {
            showToast(`Assigned ${selectedInstructor.fullName} to ${assignForm.grade} ${assignForm.subject}`, 'success');
            setShowAssignModal(false);
            loadData();
        } else {
            showToast('Failed to assign class', 'error');
        }
    };

    const handleUnassign = async (assignmentId: string) => {
        const success = await unassignInstructorFromClass(assignmentId);
        if (success) {
            showToast('Class unassigned', 'success');
            loadData();
        }
    };

    const handleToggleActive = async (instructor: InstructorProfile) => {
        const success = await updateInstructorProfile(instructor.id, { isActive: !instructor.isActive });
        if (success) {
            showToast(`${instructor.fullName} ${instructor.isActive ? 'deactivated' : 'activated'}`, 'success');
            loadData();
        }
    };

    const levels = getLevelsForGroup(assignForm.studentGroup);

    const instructorAssignments = (instructorId: string) =>
        assignments.filter(a => a.instructorId === instructorId);

    const getWorkload = (instructorId: string) =>
        workloads.find(w => w.instructorId === instructorId);

    return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-10">
            {/* Premium Translucent Floating Glass Header Panel */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="relative rounded-3xl overflow-hidden bg-[var(--md-sys-color-surface)]/70 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                {/* Background glow effects */}
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-violet-500 opacity-10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-20 -bottom-20 w-48 h-48 bg-purple-500 opacity-5 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center gap-4">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                        whileTap={{ scale: 0.95 }}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 text-violet-600 dark:text-violet-400 shadow-sm"
                    >
                        <Users size={28} />
                    </motion.div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight leading-none">
                            Instructor Management
                        </h1>
                        <div className="text-xs sm:text-sm font-semibold text-[var(--md-sys-color-secondary)] mt-2 flex items-center min-h-[18px]">
                            <span className="mr-1.5 select-none">Configure system access and</span>
                            <WordRotator 
                                words={[
                                    "Assign class workloads...",
                                    "Update profile credentials...",
                                    "Review active curriculum...",
                                    "Authorize school access..."
                                ]} 
                                intervalMs={3500} 
                                className="text-violet-600 dark:text-violet-400 font-bold"
                            />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <span className="px-4 py-2 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl font-bold text-xs shadow-sm">
                        {instructors.length} Instructor{instructors.length !== 1 ? 's' : ''} Registered
                    </span>
                </div>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Instructor List */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="glass-panel p-5 bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md">
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-4">
                                Instructors
                            </label>
                            <div className="space-y-2.5 max-h-[50vh] md:max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                                {instructors.map(ins => {
                                    const wl = getWorkload(ins.id);
                                    const isSelected = selectedInstructor?.id === ins.id;
                                    return (
                                        <button
                                            key={ins.id}
                                            onClick={() => setSelectedInstructor(ins)}
                                            className={clsx(
                                                "w-full text-left p-4 rounded-2xl border transition-all duration-305 active:scale-[0.98] hover:scale-[1.01] flex flex-col gap-2.5",
                                                isSelected
                                                    ? "bg-gradient-to-br from-violet-600/90 to-purple-600/90 border-transparent text-white shadow-lg shadow-violet-500/20"
                                                    : "bg-[var(--md-sys-color-surface)]/50 border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]/60 hover:border-violet-500/40"
                                            )}
                                        >
                                            <div className="w-full flex items-center justify-between">
                                                <div>
                                                    <p className={clsx("font-bold text-sm leading-tight", isSelected ? "text-white" : "text-[var(--md-sys-color-on-surface)]")}>{ins.fullName}</p>
                                                    <p className={clsx("text-[10px] mt-0.5 leading-none", isSelected ? "text-violet-200" : "text-[var(--md-sys-color-secondary)]")}>{ins.email || 'No email'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ins.isActive ? (
                                                        <span className={clsx("px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide",
                                                            isSelected ? "bg-white/20 text-white" : "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                                        )}>Active</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400">Inactive</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full flex items-center gap-3 text-[10px] border-t pt-2 border-[var(--md-sys-color-outline)]/20">
                                                <span className={clsx("flex items-center gap-1 font-semibold", isSelected ? "text-violet-100" : "text-[var(--md-sys-color-secondary)]")}>
                                                    <BookOpen size={11} /> {ins.subject}
                                                </span>
                                                <span className={clsx("flex items-center gap-1 font-semibold", isSelected ? "text-violet-100" : "text-[var(--md-sys-color-secondary)]")}>
                                                    <Briefcase size={11} /> {wl?.totalAssignments || 0} classes
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {instructors.length === 0 && (
                                    <div className="text-center py-8 text-[var(--md-sys-color-secondary)] text-sm">
                                        <Users size={32} className="mx-auto mb-2 opacity-40 text-violet-500" />
                                        <p className="font-semibold">No instructors registered yet.</p>
                                        <p className="text-xs mt-1">Instructors are auto-created when users sign up.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Instructor Detail + Assignments */}
                    <div className="lg:col-span-8">
                        {selectedInstructor ? (
                            <div className="space-y-6">
                                {/* Profile Card */}
                                <div className="glass-panel p-6 bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-xl font-google shadow-inner">
                                                {selectedInstructor.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] leading-tight">{selectedInstructor.fullName}</h2>
                                                <p className="text-sm text-[var(--md-sys-color-secondary)]">{selectedInstructor.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleActive(selectedInstructor)}
                                                className={clsx(
                                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 border",
                                                    selectedInstructor.isActive
                                                        ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40"
                                                        : "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40"
                                                )}
                                                title={selectedInstructor.isActive ? "Deactivate" : "Activate"}
                                            >
                                                {selectedInstructor.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                                {selectedInstructor.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {(() => {
                                            const wl = getWorkload(selectedInstructor.id);
                                            return (
                                                <>
                                                    <div className="glass-card bg-violet-500/5 hover:bg-violet-500/10 border-violet-500/15 hover:border-violet-500/35 rounded-2xl p-4 text-center group">
                                                        <p className="text-3xl font-black text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300">{wl?.totalAssignments || 0}</p>
                                                        <p className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider mt-1.5">Classes</p>
                                                    </div>
                                                    <div className="glass-card bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/15 hover:border-blue-500/35 rounded-2xl p-4 text-center group">
                                                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">{wl?.uniqueGrades || 0}</p>
                                                        <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mt-1.5">Grades</p>
                                                    </div>
                                                    <div className="glass-card bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/15 hover:border-emerald-500/35 rounded-2xl p-4 text-center group">
                                                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">{(wl?.assignedSubjects || []).length}</p>
                                                        <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mt-1.5">Subjects</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Class Assignments */}
                                <div className="glass-panel p-6 bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] shadow-md">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                                            Class Assignments
                                        </h3>
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-md shadow-violet-500/10 active:scale-95 transition-all"
                                        >
                                            <Plus size={14} /> Assign Class
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {instructorAssignments(selectedInstructor.id).map(asgn => (
                                            <div
                                                key={asgn.id}
                                                className="flex items-center justify-between p-4 rounded-2xl bg-[var(--md-sys-color-surface-variant)]/50 hover:bg-[var(--md-sys-color-surface-variant)]/85 border border-[var(--md-sys-color-outline-variant)] hover:border-violet-500/20 hover:shadow-sm transition-all duration-300"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                                        <GraduationCap size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                                                            {asgn.grade} — {asgn.subject}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5">
                                                            {asgn.studentGroup || 'All groups'} • Term {asgn.term || 1}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnassign(asgn.id)}
                                                    className="p-2 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
                                                    title="Remove assignment"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {instructorAssignments(selectedInstructor.id).length === 0 && (
                                            <div className="text-center py-10 text-[var(--md-sys-color-secondary)] text-sm border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-2xl">
                                                No classes assigned yet. Click "Assign Class" to get started.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-6 rounded-2xl bg-[var(--md-sys-color-surface)]/60 dark:bg-[var(--md-sys-color-surface)]/20 backdrop-blur-md border border-[var(--md-sys-color-outline-variant)] flex items-center justify-center h-96">
                                <div className="text-center text-[var(--md-sys-color-secondary)] px-4">
                                    <Users size={48} className="mx-auto mb-3 opacity-30 text-violet-500" />
                                    <p className="font-bold font-google text-lg text-[var(--md-sys-color-on-surface)]">Select an instructor</p>
                                    <p className="text-xs mt-1.5 max-w-sm">Select an instructor from the list to view their workload summary, manage curriculum subjects, and assign grades.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assign Class Modal */}
            <AnimatePresence>
                {showAssignModal && selectedInstructor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 15, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 15, opacity: 0 }}
                            transition={{ type: 'spring', duration: 0.35 }}
                            className="glass-card bg-[var(--md-sys-color-surface)]/90 dark:bg-[var(--md-sys-color-surface)]/45 backdrop-blur-2xl rounded-3xl p-6 w-full max-w-md border border-[var(--md-sys-color-outline)] shadow-2xl relative overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Accent decorative background blur circle inside modal */}
                            <div className="absolute -right-20 -top-20 w-40 h-40 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

                            <div className="flex items-center justify-between mb-6 relative z-10">
                                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                                    Assign Class to {selectedInstructor.fullName}
                                </h3>
                                <button 
                                    onClick={() => setShowAssignModal(false)} 
                                    className="p-2 rounded-xl text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-5 relative z-10">
                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5">Subject</label>
                                    <div className="flex bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl p-1 border border-[var(--md-sys-color-outline)]">
                                        {(['Solar', 'ICT'] as const).map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => setAssignForm(f => ({ ...f, subject: sub }))}
                                                className={clsx(
                                                    "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95",
                                                    assignForm.subject === sub
                                                        ? "glass-card bg-[var(--md-sys-color-surface)] text-violet-600 dark:text-violet-400 shadow-sm border border-violet-500/20"
                                                        : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                                                )}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Student Group */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5">Student Group</label>
                                    <div className="input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]">
                                        <select
                                            value={assignForm.studentGroup}
                                            onChange={e => setAssignForm(f => ({ ...f, studentGroup: e.target.value as StudentGroup, grade: '' }))}
                                            className="w-full px-3 py-2.5 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] cursor-pointer"
                                            title="Select student group"
                                        >
                                            {STUDENT_GROUPS.map(g => (
                                                <option key={g} value={g} className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Grade/Level */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5">Grade / Level</label>
                                    <div className="flex flex-wrap gap-2">
                                        {levels.map(lvl => (
                                            <button
                                                key={lvl.id}
                                                onClick={() => setAssignForm(f => ({ ...f, grade: lvl.id }))}
                                                className={clsx(
                                                    "px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border",
                                                    assignForm.grade === lvl.id
                                                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 border-transparent text-white shadow-md shadow-violet-500/20"
                                                        : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400"
                                                )}
                                            >
                                                {lvl.shortLabel}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Term */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1.5">Term</label>
                                    <div className="flex bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl p-1 border border-[var(--md-sys-color-outline)]">
                                        {([1, 2, 3] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setAssignForm(f => ({ ...f, term: t }))}
                                                className={clsx(
                                                    "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 active:scale-95",
                                                    assignForm.term === t
                                                        ? "glass-card bg-[var(--md-sys-color-surface)] text-violet-600 dark:text-violet-400 shadow-sm border border-violet-500/20"
                                                        : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                                                )}
                                            >
                                                Term {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleAssignClass}
                                    disabled={!assignForm.grade}
                                    className={clsx(
                                        "w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg mt-2",
                                        assignForm.grade
                                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-95 shadow-violet-500/20"
                                            : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    <Save size={16} /> Assign Class
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstructorManagement;
