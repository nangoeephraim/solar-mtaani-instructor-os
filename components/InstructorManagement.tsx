import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, X, BookOpen, GraduationCap, Briefcase, UserCheck, UserX, Trash2, ChevronDown, Save } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import PageHeader from './PageHeader';
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
            <PageHeader
                title="Instructor Management"
                subtitle="Manage instructors and class assignments"
                icon={Users}
                color="bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-500/20"
                action={
                    <div className="text-sm font-medium text-white/80">
                        {instructors.length} Instructor{instructors.length !== 1 ? 's' : ''} registered
                    </div>
                }
            />

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Instructor List */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="glass-panel p-4 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]">
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-3">
                                Instructors
                            </label>
                            <div className="space-y-2 max-h-[50vh] md:max-h-[600px] overflow-y-auto custom-scrollbar">
                                {instructors.map(ins => {
                                    const wl = getWorkload(ins.id);
                                    return (
                                        <button
                                            key={ins.id}
                                            onClick={() => setSelectedInstructor(ins)}
                                            className={clsx(
                                                "w-full text-left p-4 rounded-xl border transition-all",
                                                selectedInstructor?.id === ins.id
                                                    ? "bg-violet-600 border-violet-600 text-white shadow-md"
                                                    : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-violet-300"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm">{ins.fullName}</p>
                                                    <p className="text-[10px] opacity-80">{ins.email || 'No email'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ins.isActive ? (
                                                        <span className={clsx("px-2 py-0.5 rounded-full text-[9px] font-bold",
                                                            selectedInstructor?.id === ins.id ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                                                        )}>Active</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">Inactive</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2 text-[10px] opacity-80">
                                                <span className="flex items-center gap-1"><BookOpen size={10} /> {ins.subject}</span>
                                                <span className="flex items-center gap-1"><Briefcase size={10} /> {wl?.totalAssignments || 0} classes</span>
                                            </div>
                                        </button>
                                    );
                                })}
                                {instructors.length === 0 && (
                                    <div className="text-center py-8 text-[var(--md-sys-color-secondary)] text-sm">
                                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                                        <p>No instructors registered yet.</p>
                                        <p className="text-xs mt-1">Instructors are auto-created when users sign up.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Instructor Detail + Assignments */}
                    <div className="lg:col-span-8">
                        {selectedInstructor ? (
                            <div className="space-y-4">
                                {/* Profile Card */}
                                <div className="glass-panel p-6 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">{selectedInstructor.fullName}</h2>
                                            <p className="text-sm text-[var(--md-sys-color-secondary)]">{selectedInstructor.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggleActive(selectedInstructor)}
                                                className={clsx(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                    selectedInstructor.isActive
                                                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                        : "bg-green-100 text-green-700 hover:bg-green-200"
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
                                                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                                                        <p className="text-2xl font-bold text-violet-600">{wl?.totalAssignments || 0}</p>
                                                        <p className="text-[10px] font-medium text-violet-500 uppercase">Classes</p>
                                                    </div>
                                                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                                                        <p className="text-2xl font-bold text-blue-600">{wl?.uniqueGrades || 0}</p>
                                                        <p className="text-[10px] font-medium text-blue-500 uppercase">Grades</p>
                                                    </div>
                                                    <div className="bg-green-50 rounded-xl p-3 text-center">
                                                        <p className="text-2xl font-bold text-green-600">{(wl?.assignedSubjects || []).length}</p>
                                                        <p className="text-[10px] font-medium text-green-500 uppercase">Subjects</p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Class Assignments */}
                                <div className="glass-panel p-6 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] uppercase tracking-wider">
                                            Class Assignments
                                        </h3>
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-all"
                                        >
                                            <Plus size={14} /> Assign Class
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {instructorAssignments(selectedInstructor.id).map(asgn => (
                                            <div
                                                key={asgn.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                                                        <GraduationCap size={18} className="text-violet-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                                                            {asgn.grade} — {asgn.subject}
                                                        </p>
                                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)]">
                                                            {asgn.studentGroup || 'All groups'} • Term {asgn.term || 1}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnassign(asgn.id)}
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-100 transition-all"
                                                    title="Remove assignment"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {instructorAssignments(selectedInstructor.id).length === 0 && (
                                            <div className="text-center py-6 text-[var(--md-sys-color-secondary)] text-sm">
                                                No classes assigned yet. Click "Assign Class" to get started.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-6 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] flex items-center justify-center h-96">
                                <div className="text-center text-[var(--md-sys-color-secondary)]">
                                    <Users size={48} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">Select an instructor to view details</p>
                                    <p className="text-xs mt-1">Or create new instructors by inviting users to sign up</p>
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--md-sys-color-surface)] rounded-2xl p-6 w-full max-w-md border border-[var(--md-sys-color-outline)] shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                                    Assign Class to {selectedInstructor.fullName}
                                </h3>
                                <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)]">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Subject</label>
                                    <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1">
                                        {(['Solar', 'ICT'] as const).map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => setAssignForm(f => ({ ...f, subject: sub }))}
                                                className={clsx(
                                                    "flex-1 py-2 rounded-md text-xs font-bold transition-all",
                                                    assignForm.subject === sub ? "bg-white shadow text-violet-600" : "text-gray-500"
                                                )}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Student Group */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Student Group</label>
                                    <select
                                        value={assignForm.studentGroup}
                                        onChange={e => setAssignForm(f => ({ ...f, studentGroup: e.target.value as StudentGroup, grade: '' }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] text-sm"
                                        title="Select student group"
                                    >
                                        {STUDENT_GROUPS.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Grade/Level */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Grade / Level</label>
                                    <div className="flex flex-wrap gap-2">
                                        {levels.map(lvl => (
                                            <button
                                                key={lvl.id}
                                                onClick={() => setAssignForm(f => ({ ...f, grade: lvl.id }))}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                                    assignForm.grade === lvl.id
                                                        ? "bg-violet-600 border-violet-600 text-white"
                                                        : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-violet-300"
                                                )}
                                            >
                                                {lvl.shortLabel}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Term */}
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Term</label>
                                    <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1">
                                        {([1, 2, 3] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setAssignForm(f => ({ ...f, term: t }))}
                                                className={clsx(
                                                    "flex-1 py-2 rounded-md text-xs font-bold transition-all",
                                                    assignForm.term === t ? "bg-white shadow text-violet-600" : "text-gray-500"
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
                                        "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                        assignForm.grade
                                            ? "bg-violet-600 text-white hover:bg-violet-700 shadow-lg"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
