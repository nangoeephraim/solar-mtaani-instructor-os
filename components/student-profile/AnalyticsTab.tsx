import React, { useMemo } from 'react';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Student } from '../../types';
import clsx from 'clsx';

interface AnalyticsTabProps {
    student: Student;
    classAvgStudents?: Student[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ student }) => {
    // Generate mocked term history for CRM feel
    const termHistory = useMemo(() => [
        { term: 'Term 3, 2023', gpa: 3.1, status: 'Completed', date: 'Dec 2023' },
        { term: 'Term 1, 2024', gpa: 3.4, status: 'Completed', date: 'Apr 2024' },
        { term: 'Term 2, 2024', gpa: 3.6, status: 'In Progress', date: 'Current' },
    ], []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            <div className="lg:col-span-2 space-y-6">
                {/* Academic Record */}
                <div className="glass-card p-6 rounded-2xl border border-[var(--md-sys-color-outline)]">
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-5 flex items-center gap-2">
                        <BookOpen size={16} /> Term History
                    </h3>
                    <div className="space-y-3">
                        {termHistory.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface)] transition-colors rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm">
                                <div>
                                    <p className="font-bold text-[var(--md-sys-color-on-surface)] text-sm">{t.term}</p>
                                    <p className="text-xs text-[var(--md-sys-color-secondary)] mt-0.5">{t.date}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">GPA</p>
                                        <p className="font-bold text-[var(--md-sys-color-on-surface)] mt-0.5">{t.gpa.toFixed(1)}/4.0</p>
                                    </div>
                                    <div className={clsx(
                                        "px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm",
                                        t.status === 'Completed'
                                            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                                    )}>
                                        {t.status === 'Completed' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                        {t.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Current Units Summary */}
                <div className="glass-card p-6 rounded-2xl border border-[var(--md-sys-color-outline)]">
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-5 flex items-center gap-2">
                        <CheckCircle size={16} /> Current Units
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(student.competencies).map(([key, value]) => (
                            <div key={key} className="bg-[var(--md-sys-color-surface-variant)] p-3 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm">
                                <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">{key}</p>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Score: {value}/4.0</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline)]">
                                        {Math.round((value / 4) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-[var(--md-sys-color-surface)] h-2 rounded-full overflow-hidden border border-[var(--md-sys-color-outline)]/50">
                                    <div className="bg-gradient-to-r from-violet-500 to-purple-500 h-full rounded-full" style={{ width: `${(value / 4) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
