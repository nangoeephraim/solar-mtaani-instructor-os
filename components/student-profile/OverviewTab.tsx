
import React, { useMemo, useState } from 'react';
import { Award, FileText, Plus, Activity } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Student } from '../../types';

interface OverviewTabProps {
    student: Student;
    classAvgStudents: Student[];
    onAddNote: (note: string) => void;
    studentAverage: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    student,
    classAvgStudents,
    onAddNote,
    studentAverage
}) => {
    const [noteInput, setNoteInput] = useState("");

    const radarData = useMemo(() => {
        return Object.entries(student.competencies).map(([key, value]) => ({
            subject: key.charAt(0).toUpperCase() + key.slice(1),
            student: value,
            classAvg: classAvgStudents.length > 0
                ? classAvgStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classAvgStudents.length
                : 0,
            fullMark: 4
        }));
    }, [student.competencies, classAvgStudents]);

    const progressData = useMemo(() => [
        { month: 'Sep', score: 2.1 },
        { month: 'Oct', score: 2.4 },
        { month: 'Nov', score: 2.8 },
        { month: 'Dec', score: 3.0 },
        { month: 'Jan', score: studentAverage }
    ], [studentAverage]);

    const handleAddNoteClick = () => {
        if (!noteInput.trim()) return;
        onAddNote(noteInput);
        setNoteInput("");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Competency Radar */}
            <div className="glass-card p-5 rounded-xl border border-[var(--md-sys-color-outline)]">
                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                    <Award className="text-[var(--md-sys-color-primary)]" size={18} />
                    Competency Profile
                </h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                            <Radar name="Student" dataKey="student" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                            <Radar name="Class Avg" dataKey="classAvg" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeDasharray="5 5" />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Student</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 opacity-50"></span> Class Avg</span>
                </div>
            </div>

            {/* Instructor Notes */}
            <div className="glass-card p-5 rounded-xl border border-[var(--md-sys-color-outline)] flex flex-col">
                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                    <FileText className="text-[var(--md-sys-color-primary)]" size={18} />
                    Instructor Notes
                </h3>
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        className="flex-1 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-lg px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]"
                        placeholder="Add a note..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNoteClick()}
                    />
                    <button
                        onClick={handleAddNoteClick}
                        aria-label="Add note"
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 max-h-48 custom-scrollbar">
                    {student.notes.length > 0 ? (
                        student.notes.map((note, i) => (
                            <div key={i} className="bg-[var(--md-sys-color-secondary-container)] border border-[var(--md-sys-color-outline)] p-3 rounded-lg text-sm text-[var(--md-sys-color-on-secondary-container)]">
                                {note}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-[var(--md-sys-color-secondary)]">
                            <FileText size={24} className="mb-2 opacity-40" />
                            <p className="text-xs">No notes yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Timeline */}
            <div className="glass-card p-5 rounded-xl border border-[var(--md-sys-color-outline)] lg:col-span-2">
                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2 mb-4">
                    <Activity className="text-[var(--md-sys-color-primary)]" size={18} />
                    Progress Timeline
                </h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, fill: '#3b82f6' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
