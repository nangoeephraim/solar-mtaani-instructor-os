import React, { useMemo } from 'react';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { Student } from '../../types';
import clsx from 'clsx';

interface AnalyticsTabProps {
    student: Student;
    classAvgStudents?: Student[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ student }) => {
    const termHistory = useMemo(() => [
        { term: 'Term 3, 2023', gpa: 3.1, status: 'Completed', date: 'Dec 2023' },
        { term: 'Term 1, 2024', gpa: 3.4, status: 'Completed', date: 'Apr 2024' },
        { term: 'Term 2, 2024', gpa: 3.6, status: 'In Progress', date: 'Current' },
    ], []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-[var(--md-sys-color-on-surface)]">
            <div className="lg:col-span-2 space-y-6">
                {/* Academic Record */}
                <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/10">
                    <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-5 flex items-center gap-2 font-space">
                        <BookOpen size={15} /> Term Records
                    </h3>
                    <div className="space-y-3">
                        {termHistory.map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-900/40 hover:shadow-md transition-all duration-300 rounded-xl border border-slate-200/40 dark:border-slate-800/40 hover:scale-[1.005] active:scale-[0.995]">
                                <div>
                                    <p className="font-bold text-xs">{t.term}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.date}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase">GPA Index</p>
                                        <p className="font-bold text-xs mt-0.5">{t.gpa.toFixed(1)}/4.0</p>
                                    </div>
                                    <div className={clsx(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm",
                                        t.status === 'Completed'
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                            : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                                    )}>
                                        {t.status === 'Completed' ? <CheckCircle size={11} /> : <Clock size={11} />}
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
                <div className="glass-card p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/10">
                    <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-5 flex items-center gap-2 font-space">
                        <CheckCircle size={15} /> Competency Index
                    </h3>
                    <div className="space-y-3.5">
                        {Object.entries(student.competencies).map(([key, value]) => (
                            <div key={key} className="bg-white/40 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all duration-300">
                                <p className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase mb-2 leading-none">{key}</p>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[11px] font-black">Score: {value}/4.0</span>
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 shadow-sm text-indigo-500 border border-slate-200/20 dark:border-slate-850">
                                        {Math.round((value / 4) * 100)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200/50 dark:bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-800/30">
                                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full rounded-full" style={{ width: `${(value / 4) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AnalyticsTab;
