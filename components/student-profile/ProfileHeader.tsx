
import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, TrendingUp, TrendingDown, Zap, Monitor } from 'lucide-react';
import clsx from 'clsx';
import { Student } from '../../types';

interface ProfileHeaderProps {
    student: Student;
    studentAverage: number;
    performanceVsClass: number;
    onDeleteRequest: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    student,
    studentAverage,
    performanceVsClass,
    onDeleteRequest
}) => {
    return (
        <div className="bg-gradient-to-r from-[var(--md-sys-color-surface)] to-[var(--md-sys-color-surface-variant)] p-6 border-b border-[var(--md-sys-color-outline)]">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex items-center gap-5">
                    <motion.div
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/30"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        {student.name.charAt(0)}
                    </motion.div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={clsx(
                                "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                                student.subject === 'Solar'
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                            )}>
                                {student.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                {student.subject}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                                Grade {student.grade}
                            </span>
                        </div>
                        <h1 className="text-2xl font-google font-bold text-gray-900">{student.name}</h1>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-3">
                            <span>Lot {student.lot}</span>
                            <span>•</span>
                            <span>ID #{student.id.toString().padStart(4, '0')}</span>
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-3 flex-wrap">
                    <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm text-center min-w-[90px]">
                        <span className={clsx(
                            "block text-2xl font-bold",
                            student.attendancePct >= 85 ? "text-green-600" :
                                student.attendancePct >= 70 ? "text-orange-500" : "text-red-500"
                        )}>
                            {student.attendancePct}%
                        </span>
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Attendance</span>
                    </div>
                    <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm text-center min-w-[90px]">
                        <span className="block text-2xl font-bold text-[var(--md-sys-color-primary)]">
                            {studentAverage.toFixed(1)}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Avg Score</span>
                    </div>
                    <div className="bg-[var(--md-sys-color-surface)] p-4 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm text-center min-w-[90px]">
                        <div className="flex items-center justify-center gap-1">
                            {performanceVsClass >= 0 ? (
                                <TrendingUp size={18} className="text-green-500" />
                            ) : (
                                <TrendingDown size={18} className="text-red-500" />
                            )}
                            <span className={clsx(
                                "text-xl font-bold",
                                performanceVsClass >= 0 ? "text-green-600" : "text-red-500"
                            )}>
                                {performanceVsClass >= 0 ? '+' : ''}{performanceVsClass.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">vs Class</span>
                    </div>
                    <button
                        onClick={onDeleteRequest}
                        className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-100 transition-colors"
                        title="Delete Student"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
