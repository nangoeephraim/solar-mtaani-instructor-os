import React, { useMemo } from 'react';
import { User, Search, Zap, Monitor, Phone, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import { Student } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { getSubjectEmoji, getSubjectTextColor } from '../../utils/subjectUtils';

interface StudentListProps {
    students: Student[];
    selectedStudentId: number;
    onSelectStudent: (id: number) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    subjectFilter: string;
    onFilterChange: (filter: string) => void;
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
    const { preferences } = useTheme();
    const activeSubjects = preferences.customSubjects && preferences.customSubjects.length > 0
        ? preferences.customSubjects
        : ['Solar', 'ICT'];

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
        <div className="w-full md:w-80 lg:w-96 flex flex-col glass-panel overflow-hidden h-full">
            <div className="p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-google font-bold text-xl text-[var(--md-sys-color-on-surface)]">Student Roster</h2>
                    <button
                        onClick={onAddStudent}
                        className="p-2.5 bg-indigo-50/80 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center justify-center shadow-sm dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 border border-indigo-100/50 dark:border-indigo-500/20 active:scale-95"
                        title="Add Student"
                    >
                        <User size={18} />
                    </button>
                </div>

                {/* Subject Filter Toggle */}
                <div className="flex bg-[var(--md-sys-color-surface-variant)]/40 p-1.5 rounded-2xl mb-3 border border-[var(--md-sys-color-outline)]/40 backdrop-blur-sm overflow-x-auto custom-scrollbar gap-1">
                    {(['All', ...activeSubjects]).map(sub => (
                        <button
                            key={sub}
                            onClick={() => onFilterChange(sub)}
                            className={clsx(
                                "flex-shrink-0 py-1.5 px-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 active:scale-95",
                                subjectFilter === sub 
                                    ? "bg-[var(--md-sys-color-surface)] shadow-md text-[var(--md-sys-color-primary)] border border-[var(--md-sys-color-outline)]" 
                                    : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]/20"
                            )}
                        >
                            {sub !== 'All' && <span className="text-[11px]">{getSubjectEmoji(sub)}</span>}
                            {sub}
                        </button>
                    ))}
                </div>

                <div className="relative input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/40">
                    <Search className="absolute left-3 top-2.5 text-[var(--md-sys-color-secondary)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search roster..."
                        className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none placeholder-[var(--md-sys-color-secondary)] transition-all"
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
                                    "w-full text-left p-3 rounded-xl transition-all duration-300 flex items-center gap-3 border relative overflow-hidden active:scale-[0.99]",
                                    selectedStudentId === student.id
                                        ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-850 shadow-md scale-[1.01]"
                                        : "bg-[var(--md-sys-color-surface)]/40 border-[var(--md-sys-color-outline)]/40 hover:border-indigo-200/50 dark:hover:border-indigo-800/40 hover:bg-[var(--md-sys-color-surface)]/70 hover:shadow-sm"
                                )}
                            >
                                {/* Selection Indicator */}
                                {selectedStudentId === student.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-l-xl" />
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
                                            getSubjectTextColor(student.subject)
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-all active:scale-90" title="Message">
                                    <MessageSquare size={14} />
                                </button>
                                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-all active:scale-90" title="Call Guardian">
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

