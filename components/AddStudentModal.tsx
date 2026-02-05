import React, { useState } from 'react';
import { Student, Subject } from '../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (student: Omit<Student, 'id'>) => void;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState<number>(5);
    const [lot, setLot] = useState('2025');
    const [subject, setSubject] = useState<Subject>('Solar');
    const [errors, setErrors] = useState<string[]>([]);

    const getDefaultCompetencies = (subject: Subject) => {
        if (subject === 'Solar') {
            return { safety: 1, tools: 1, principles: 1, installation: 1, maintenance: 1 };
        }
        return { hardware: 1, software: 1, typing: 1, formatting: 1, data: 1 };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: string[] = [];
        if (!name.trim()) newErrors.push('Name is required');
        if (name.trim().length < 2) newErrors.push('Name must be at least 2 characters');

        if (newErrors.length > 0) {
            setErrors(newErrors);
            return;
        }

        const newStudent: Omit<Student, 'id'> = {
            name: name.trim(),
            grade,
            lot,
            subject,
            competencies: getDefaultCompetencies(subject),
            attendancePct: 100,
            attendanceHistory: [],
            notes: []
        };

        onAdd(newStudent);
        handleClose();
    };

    const handleClose = () => {
        setName('');
        setGrade(5);
        setLot('2025');
        setSubject('Solar');
        setErrors([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500 rounded-xl">
                                <UserPlus size={20} />
                            </div>
                            <h2 className="text-xl font-bold">Add New Student</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {errors.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-1">
                            {errors.map((error, i) => (
                                <p key={i} className="text-rose-700 text-sm flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter student's full name"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Program / Trade *
                        </label>
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            {(['Solar', 'ICT'] as const).map(sub => (
                                <button
                                    key={sub}
                                    type="button"
                                    onClick={() => setSubject(sub)}
                                    className={clsx(
                                        "flex-1 py-3 text-sm font-bold rounded-lg transition-all",
                                        subject === sub
                                            ? (sub === 'Solar' ? "bg-orange-500 text-white shadow" : "bg-blue-500 text-white shadow")
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {sub}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grade & Lot */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Grade Level
                            </label>
                            <select
                                value={grade}
                                onChange={(e) => setGrade(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
                            >
                                {[5, 6, 7, 8, 9].map(g => (
                                    <option key={g} value={g}>Grade {g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                Lot / Cohort
                            </label>
                            <select
                                value={lot}
                                onChange={(e) => setLot(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-400"
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
                            className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
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
