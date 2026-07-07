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

// Simple SVG Sparkline component for academic trend preview
const MiniSparkline = ({ data, color }: { data: number[], color: string }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 4); // assuming max rating is 4
    const min = 0;
    const range = max - min || 1;
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 40;
        const y = 20 - ((val - min) / range) * 20;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width="40" height="20" className="overflow-visible select-none">
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
        <div className="w-full md:w-80 lg:w-96 flex flex-col glass-panel overflow-hidden h-full border-none bg-transparent">
            <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/40 dark:bg-slate-900/10 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-space font-bold text-lg text-[var(--md-sys-color-on-surface)] tracking-wide">Roster List</h2>
                    <button
                        onClick={onAddStudent}
                        className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/25 text-indigo-600 rounded-xl transition-all flex items-center justify-center border border-indigo-500/15 active:scale-95 shadow-sm"
                        title="Add Student"
                    >
                        <User size={15} />
                    </button>
                </div>

                {/* Subject Filter Toggle */}
                <div className="flex bg-slate-200/40 dark:bg-slate-950/20 p-1 rounded-xl mb-3 border border-slate-200/50 dark:border-slate-850/50 backdrop-blur-sm overflow-x-auto custom-scrollbar gap-1">
                    {(['All', ...activeSubjects]).map(sub => (
                        <button
                            key={sub}
                            onClick={() => onFilterChange(sub)}
                            className={clsx(
                                "flex-shrink-0 py-1 px-2.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-300 flex items-center justify-center gap-1 active:scale-95",
                                subjectFilter === sub 
                                    ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 border border-slate-200/30 dark:border-slate-700/30" 
                                    : "text-slate-500 hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                        >
                            {sub !== 'All' && <span className="text-[10px]">{getSubjectEmoji(sub)}</span>}
                            {sub}
                        </button>
                    ))}
                </div>

                <div className="relative input-glow rounded-xl border border-slate-200 dark:border-slate-800 transition-all bg-slate-200/40 dark:bg-slate-950/45">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                    <input
                        type="text"
                        placeholder="Search roster..."
                        className="w-full pl-9 pr-4 py-2 bg-transparent text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none placeholder-slate-400 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
                {filteredStudents.map(student => {
                    const avg = getStudentAvg(student);
                    const isAtRisk = avg < 2.5 || student.attendancePct < 80;
                    const compValues = Object.values(student.competencies).slice(0, 6);

                    return (
                        <div key={student.id} className="relative group">
                            <button
                                onClick={() => onSelectStudent(student.id)}
                                className={clsx(
                                    "w-full text-left p-3 rounded-2xl transition-all duration-300 flex items-center gap-3 border relative overflow-hidden active:scale-[0.99]",
                                    selectedStudentId === student.id
                                        ? "bg-indigo-50/80 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-850/80 shadow-md scale-[1.01]"
                                        : "bg-white/40 dark:bg-slate-900/10 border-slate-200/40 dark:border-slate-800/40 hover:border-indigo-200/30 dark:hover:border-indigo-800/30 hover:bg-white/60 dark:hover:bg-slate-900/20 hover:shadow-sm"
                                )}
                            >
                                {/* Selection Indicator Line */}
                                {selectedStudentId === student.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-l-2xl" />
                                )}

                                <div className="relative">
                                    {student.photo ? (
                                        <img src={student.photo} alt={student.name} className="w-11 h-11 rounded-xl object-cover shadow-sm border border-slate-200/30 dark:border-slate-800/30" />
                                    ) : (
                                        <div className={clsx(
                                            "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shadow-sm border border-white/5",
                                            selectedStudentId === student.id
                                                ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
                                                : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400"
                                        )}>
                                            {student.name.charAt(0)}
                                        </div>
                                    )}
                                    {isAtRisk && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" title="Needs attention" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pr-6 transition-opacity duration-200 group-hover:opacity-0">
                                    <h4 className={clsx(
                                        "font-bold text-xs truncate leading-tight",
                                        selectedStudentId === student.id ? "text-indigo-900 dark:text-indigo-300" : "text-[var(--md-sys-color-on-surface)]"
                                    )}>{student.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5 font-semibold">
                                        <span className={clsx(
                                            "text-[8px] font-black uppercase tracking-wider",
                                            getSubjectTextColor(student.subject)
                                        )}>
                                            {student.subject}
                                        </span>
                                        <span className="text-slate-300 dark:text-slate-700">•</span>
                                        <span className="text-[9px] text-slate-450 dark:text-slate-400">Lot {student.lot}</span>
                                    </div>

                                    {/* Mini Sparkline and rating preview */}
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <MiniSparkline data={compValues} color={isAtRisk ? "#f43f5e" : "#10b981"} />
                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{avg.toFixed(1)}/4.0</span>
                                    </div>
                                </div>
                            </button>

                            {/* Quick Contact Actions on Hover */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
                                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-750 text-slate-500 hover:text-indigo-500 transition-all active:scale-90" title="Message">
                                    <MessageSquare size={12} />
                                </button>
                                <button className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-750 text-slate-500 hover:text-indigo-500 transition-all active:scale-90" title="Call Guardian">
                                    <Phone size={12} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredStudents.length === 0 && (
                    <div className="text-center py-12 text-slate-450 dark:text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-slate-200/20 dark:border-slate-800/20">
                            <Search size={22} className="text-slate-400" />
                        </div>
                        <p className="text-xs font-bold">No students found</p>
                        <p className="text-[10px] mt-0.5 max-w-[180px] mx-auto text-slate-500">Try adjusting your filters or search term.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
export default StudentList;
