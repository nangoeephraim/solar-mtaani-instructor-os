import React, { useMemo } from 'react';
import { User, Search, ChevronRight, Zap, Monitor, Mail, Phone, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { Student } from '../../types';

interface StudentListProps {
    students: Student[];
    selectedStudentId: number;
    onSelectStudent: (id: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    subjectFilter: 'All' | 'Solar' | 'ICT';
    onFilterChange: (filter: 'All' | 'Solar' | 'ICT') => void;
    onAddStudent: () => void;
}

// Simple SVG Sparkline component
const MiniSparkline = ({ data, color }: { data: number[], color: string }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 4); // assuming max is 4 or the max value
    const min = 0;
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 40; // width 40
        const y = 20 - ((val - min) / range) * 20; // height 20
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="40" height="20" className="overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
};

export const StudentList: React.FC<StudentListProps> = ({
    students,
    selectedStudentId,
    onSelectStudent,
    searchTerm,
    onSearchChange,
    subjectFilter,
    onFilterChange,
    onAddStudent
}) => {
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.lot.includes(searchTerm);
            const matchesSubject = subjectFilter === 'All' || s.subject === subjectFilter;
            return matchesSearch && matchesSubject;
        });
    }, [students, searchTerm, subjectFilter]);

    const getStudentAvg = (student: Student) => {
        const vals = Object.values(student.competencies);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    return (
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[var(--md-sys-color-surface)]/80 backdrop-blur-xl overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] h-full shadow-sm">
            <div className="p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-google font-bold text-xl text-[var(--md-sys-color-on-surface)]">Student Roster</h2>
                    <button
                        onClick={onAddStudent}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20"
                        title="Add Student"
                    >
                        <User size={18} />
                    </button>
                </div>

                {/* Subject Filter Toggle */}
                <div className="flex bg-[var(--md-sys-color-surface-variant)]/50 p-1 rounded-xl mb-3 border border-[var(--md-sys-color-outline)]/50 backdrop-blur-sm">
                    {(['All', 'Solar', 'ICT'] as const).map(sub => (
                        <button
                            key={sub}
                            onClick={() => onFilterChange(sub)}
                            className={clsx(
                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                                subjectFilter === sub ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                        >
                            {sub === 'Solar' && <Zap size={12} />}
                            {sub === 'ICT' && <Monitor size={12} />}
                            {sub}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-[var(--md-sys-color-secondary)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search roster..."
                        className="w-full pl-10 pr-4 py-2 bg-[var(--md-sys-color-surface-variant)]/50 border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-[var(--md-sys-color-surface)] placeholder-[var(--md-sys-color-secondary)] transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {filteredStudents.map(student => {
                    const avg = getStudentAvg(student);
                    const isAtRisk = avg < 2.5 || student.attendancePct < 80;
                    const compValues = Object.values(student.competencies).slice(0, 6); // Mock history data from current competencies for sparkline

                    return (
                        <div key={student.id} className="relative group">
                            <button
                                onClick={() => onSelectStudent(student.id)}
                                className={clsx(
                                    "w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center gap-3 border relative overflow-hidden",
                                    selectedStudentId === student.id
                                        ? "bg-indigo-50/80 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm"
                                        : "bg-[var(--md-sys-color-surface)] border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                                )}
                            >
                                {/* Selection Indicator */}
                                {selectedStudentId === student.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-l-xl" />
                                )}

                                <div className="relative">
                                    {student.photo ? (
                                        <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                                    ) : (
                                        <div className={clsx(
                                            "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border border-white/20",
                                            selectedStudentId === student.id
                                                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                                                : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-500 dark:text-slate-400"
                                        )}>
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                    {isAtRisk && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-[var(--md-sys-color-surface)]" title="Needs attention" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pr-8 transition-opacity duration-200 group-hover:opacity-0">
                                    <h4 className={clsx(
                                        "font-bold text-sm leading-tight truncate",
                                        selectedStudentId === student.id ? "text-indigo-900 dark:text-indigo-100" : "text-[var(--md-sys-color-on-surface)]"
                                    )}>{student.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            student.subject === 'Solar' ? "text-amber-500" : "text-sky-500"
                                        )}>
                                            {student.subject}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-600">•</span>
                                        <span className="text-[10px] text-[var(--md-sys-color-secondary)]">Lot {student.lot}</span>
                                    </div>

                                    {/* Mini Sparkline showing quick performance context */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <MiniSparkline data={compValues} color={isAtRisk ? "#f43f5e" : "#10b981"} />
                                        <span className="text-[10px] font-bold text-[var(--md-sys-color-secondary)]">{avg.toFixed(1)}</span>
                                    </div>
                                </div>
                            </button>

                            {/* Quick Actions (Hover State) */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-colors" title="Message">
                                    <MessageSquare size={14} />
                                </button>
                                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-colors" title="Call Guardian">
                                    <Phone size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredStudents.length === 0 && (
                    <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                        <div className="w-16 h-16 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Search size={24} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium">No students found</p>
                        <p className="text-xs mt-1 max-w-[200px] mx-auto">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
