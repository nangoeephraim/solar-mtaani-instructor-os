
import React, { useMemo } from 'react';
import { Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { Student } from '../../types';

interface AnalyticsTabProps {
    student: Student;
    classAvgStudents: Student[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ student, classAvgStudents }) => {
    const comparisonData = useMemo(() => {
        return Object.entries(student.competencies).map(([key, value]) => {
            const classAvgForSkill = classAvgStudents.length > 0
                ? classAvgStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classAvgStudents.length
                : 0;
            return {
                skill: key.substring(0, 10),
                student: value,
                class: parseFloat(classAvgForSkill.toFixed(1))
            };
        });
    }, [student.competencies, classAvgStudents]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Comparative Analysis */}
            <div className="glass-card p-5 rounded-xl border border-gray-100">
                <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Target className="text-blue-500" size={18} />
                    Competency vs Class Average
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis type="category" dataKey="skill" tick={{ fill: '#6b7280', fontSize: 11 }} width={80} />
                            <Tooltip
                                contentStyle={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Bar dataKey="student" name="Student" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="class" name="Class Avg" fill="#10b981" radius={[0, 4, 4, 0]} opacity={0.6} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500"></span> {student.name}</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 opacity-60"></span> Class Average</span>
                </div>
            </div>

            {/* Skill Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(student.competencies).map(([key, value]) => {
                    const classAvgForSkill = classAvgStudents.length > 0
                        ? classAvgStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classAvgStudents.length
                        : 0;
                    const diff = value - classAvgForSkill;
                    return (
                        <div key={key} className="bg-white p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{key}</p>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-gray-900">{value}</span>
                                <span className={clsx(
                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                    diff >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                                </span>
                            </div>
                            <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    // eslint-disable-next-line react/forbid-dom-props
                                    style={{ width: `${(value / 4) * 100}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
