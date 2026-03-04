import React, { useState, useCallback } from 'react';
import { Student, Subject, StudentGroup } from '../types';
import { X, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { studentSchema, validateWithSchema } from '../schemas/validation';
import { STUDENT_GROUPS, getLevelsForGroup, getDefaultLevel } from '../constants/educationLevels';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (student: Omit<Student, 'id'>) => void;
}

interface FieldErrors {
    [key: string]: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState<string>('L3');
    const [lot, setLot] = useState('2025');
    const [subject, setSubject] = useState<Subject>('Solar');
    const [studentGroup, setStudentGroup] = useState<StudentGroup>('Academy');
    const [errors, setErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getDefaultCompetencies = (subject: Subject) => {
        if (subject === 'Solar') {
            return { safety: 1, tools: 1, principles: 1, installation: 1, maintenance: 1 };
        }
        return { hardware: 1, software: 1, typing: 1, formatting: 1, data: 1 };
    };

    // Real-time validation for touched fields
    const validateField = useCallback((field: string, value: unknown) => {
        const partialData = { [field]: value };
        const result = studentSchema.partial().safeParse(partialData);

        if (!result.success) {
            const fieldError = result.error.issues.find(e => e.path[0] === field);
            return fieldError?.message || '';
        }
        return '';
    }, []);

    const handleBlur = (field: string, value: unknown) => {
        setTouched(prev => new Set(prev).add(field));
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = {
            name: name.trim(),
            grade,
            lot,
            subject,
        };

        const result = validateWithSchema(studentSchema.pick({
            name: true,
            grade: true,
            lot: true,
            subject: true
        }), formData);

        if (result.success === false) {
            setErrors(result.errors);
            setIsSubmitting(false);
            return;
        }

        const newStudent: Omit<Student, 'id'> = {
            name: name.trim(),
            grade,
            lot,
            subject,
            studentGroup: studentGroup,
            competencies: getDefaultCompetencies(subject),
            attendancePct: 100,
            attendanceHistory: [],
            notes: [],
            assessment: { units: {}, termStats: [] }
        };

        onAdd(newStudent);
        handleClose();
        setIsSubmitting(false);
    };

    const handleClose = () => {
        setGrade('L3');
        setLot('2025');
        setSubject('Solar');
        setStudentGroup('Academy');
        setErrors({});
        setTouched(new Set());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-b border-[var(--md-sys-color-outline)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-xl text-[var(--md-sys-color-primary)]">
                                <UserPlus size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Add New Student</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl transition-colors text-[var(--md-sys-color-on-surface-variant)]"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {Object.keys(errors).length > 0 && (
                        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-1">
                            {Object.entries(errors).filter(([_, msg]) => msg).map(([field, error]) => (
                                <p key={field} className="text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter student's full name"
                            className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-transparent transition-all placeholder-[var(--md-sys-color-secondary)]"
                            autoFocus
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                            Program / Trade *
                        </label>
                        <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-xl p-1">
                            {(['Solar', 'ICT'] as const).map(sub => (
                                <button
                                    key={sub}
                                    type="button"
                                    onClick={() => setSubject(sub)}
                                    className={clsx(
                                        "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                                        subject === sub
                                            ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow"
                                            : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                                    )}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Student Group */}
                    <div>
                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                            Student Group
                        </label>
                        <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-xl p-1">
                            {STUDENT_GROUPS.map(grp => (
                                <button
                                    key={grp}
                                    type="button"
                                    onClick={() => { setStudentGroup(grp); setGrade(getDefaultLevel(grp)); }}
                                    className={clsx(
                                        "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all",
                                        studentGroup === grp
                                            ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow"
                                            : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                                    )}
                                >
                                    {grp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Level & Lot */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                Education Level
                            </label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                            >
                                {getLevelsForGroup(studentGroup).map(lvl => (
                                    <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                Lot / Cohort
                            </label>
                            <select
                                value={lot}
                                onChange={(e) => setLot(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                            >
                                {['2024', '2025', '2026'].map(l => (
                                    <option key={l} value={l}>{l}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 px-4 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] rounded-xl font-bold text-sm hover:opacity-80 transition-opacity"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            <UserPlus size={16} />
                            Add Student
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;
