
import React, { useMemo } from 'react';
import { Calendar, Mail, Phone } from 'lucide-react';
import clsx from 'clsx';
import { Student } from '../../types';

interface AttendanceTabProps {
    student: Student;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ student }) => {
    // Attendance Calendar Data (last 30 days simulation)
    const attendanceCalendar = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const record = student.attendanceHistory.find(h => h.date === dateStr);
            days.push({
                date: dateStr,
                day: date.getDate(),
                status: record?.status || 'none',
                weekday: date.getDay()
            });
        }
        return days;
    }, [student.attendanceHistory]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Attendance Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                    <span className="block text-3xl font-bold text-green-600">
                        {student.attendanceHistory.filter(h => h.status === 'present').length}
                    </span>
                    <span className="text-xs font-bold text-green-700 uppercase">Present</span>
                </div>
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                    <span className="block text-3xl font-bold text-red-500">
                        {student.attendanceHistory.filter(h => h.status === 'absent').length}
                    </span>
                    <span className="text-xs font-bold text-red-700 uppercase">Absent</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <span className="block text-3xl font-bold text-blue-600">
                        {student.attendancePct}%
                    </span>
                    <span className="text-xs font-bold text-blue-700 uppercase">Rate</span>
                </div>
            </div>

            {/* Attendance Calendar Heatmap */}
            <div className="glass-card p-5 rounded-xl border border-gray-100">
                <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Calendar className="text-blue-500" size={18} />
                    Last 30 Days
                </h3>
                <div className="grid grid-cols-7 gap-1.5">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-gray-400 pb-1">{d}</div>
                    ))}
                    {attendanceCalendar.map((day, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all",
                                day.status === 'present' && "bg-green-500 text-white",
                                day.status === 'absent' && "bg-red-400 text-white",
                                day.status === 'none' && "bg-gray-100 text-gray-400"
                            )}
                            title={`${day.date}: ${day.status}`}
                        >
                            {day.day}
                        </div>
                    ))}
                </div>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500"></span> Present</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-red-400"></span> Absent</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-gray-200"></span> No Record</span>
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-wrap gap-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span>student@prism.org</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <span>+254 700 000 000</span>
                </div>
            </div>
        </div>
    );
};
