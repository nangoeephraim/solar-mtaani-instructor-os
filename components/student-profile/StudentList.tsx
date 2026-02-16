
import React, { useMemo } from 'react';
import { User, Search, ChevronRight, Zap, Monitor } from 'lucide-react';
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
        <div className="w-full md:w-80 lg:w-96 flex flex-col glass-panel overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline)] h-full">
            <div className="p-4 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-google font-bold text-xl text-[var(--md-sys-color-on-surface)]">Student Roster</h2>
                    <button
                        onClick={onAddStudent}
                        className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <User size={16} /> {/* Changed to User icon since Plus is imported but unused in original snippet if carefully checked or generic */}
                        Add
                    </button>
                </div>

                {/* Subject Filter Toggle */}
                <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-full p-1 mb-3">
                    {(['All', 'Solar', 'ICT'] as const).map(sub => (
                        <button
                            key={sub}
                            onClick={() => onFilterChange(sub)}
                            className={clsx(
                                "flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1",
                                subjectFilter === sub ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
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
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border-transparent rounded-full text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:bg-[var(--md-sys-color-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] placeholder-[var(--md-sys-color-secondary)] transition-all"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {filteredStudents.map(student => {
                    const avg = getStudentAvg(student);
                    const isAtRisk = avg < 2.5 || student.attendancePct < 80;
                    return (
                        <button
                            key={student.id}
                            onClick={() => onSelectStudent(student.id)}
                            className={clsx(
                                "w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group border",
                                selectedStudentId === student.id
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                                    : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm text-gray-700"
                            )}
                        >
                            <div className={clsx(
                                "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                                selectedStudentId === student.id
                                    ? "bg-white/20 text-white"
                                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            )}>
                                {student.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm leading-tight truncate">{student.name}</h4>
                                <p className={clsx("text-xs mt-0.5 flex items-center gap-1",
                                    selectedStudentId === student.id ? "text-blue-100" : "text-gray-500"
                                )}>
                                    {student.subject === 'Solar' ? <Zap size={10} /> : <Monitor size={10} />}
                                    {student.subject} • Grade {student.grade}
                                </p>
                            </div>
                            {isAtRisk && selectedStudentId !== student.id && (
                                <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Needs attention" />
                            )}
                            <ChevronRight size={16} className={clsx(
                                "flex-shrink-0 transition-transform",
                                selectedStudentId === student.id ? "" : "text-[var(--md-sys-color-outline)] group-hover:text-[var(--md-sys-color-secondary)]"
                            )} />
                        </button>
                    );
                })}
                {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-[var(--md-sys-color-secondary)]">
                        <User size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No students found</p>
                    </div>
                )}
            </div>
        </div>
    );
};
