import React, { useState } from 'react';
import { FileText, Plus, AlertCircle, MessageSquare, Clock, CalendarCheck, CalendarX, Activity } from 'lucide-react';
import { Student } from '../../types';
import clsx from 'clsx';

interface AttendanceTabProps {
    student: Student;
    onAddNote?: (note: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({ student, onAddNote }) => {
    const [noteInput, setNoteInput] = useState("");

    const handleAddNoteClick = () => {
        if (!noteInput.trim() || !onAddNote) return;
        onAddNote(noteInput);
        setNoteInput("");
    };

    const presentCount = student.attendanceHistory.filter(h => h.status === 'present').length;
    const absentCount = student.attendanceHistory.filter(h => h.status === 'absent').length;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in relative z-10">
            {/* Left Column: Timeline / Logs */}
            <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-[var(--md-sys-color-outline)] flex flex-col h-[600px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-fuchsia-500 opacity-80" />

                <h3 className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity size={16} /> Behavior & Interaction Timeline
                </h3>

                {/* Input Area */}
                <div className="flex gap-3 mb-8 bg-[var(--md-sys-color-surface-variant)]/50 p-2 rounded-xl border border-[var(--md-sys-color-outline)] focus-within:ring-2 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 transition-all backdrop-blur-sm shadow-sm relative z-10">
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none placeholder-[var(--md-sys-color-secondary)]"
                        placeholder="Log a new behavior or note..."
                        title="Add Note"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNoteClick()}
                    />
                    <button
                        onClick={handleAddNoteClick}
                        aria-label="Add note"
                        title="Add Note"
                        className="bg-violet-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-violet-700 transition-all shadow-md shadow-violet-500/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Log Entry
                    </button>
                </div>

                {/* Timeline Flow */}
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar relative pl-2">
                    {/* Vertical line through timeline */}
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--md-sys-color-outline)] via-[var(--md-sys-color-outline)] to-transparent" />

                    {student.notes.length > 0 ? (
                        <div className="space-y-6 pb-4">
                            {student.notes.map((note, i) => (
                                <div key={i} className="relative flex gap-4 group">
                                    {/* Timeline Marker */}
                                    <div className="relative z-10 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 border-2 border-[var(--md-sys-color-surface)] flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-sm mt-1 ring-4 ring-[var(--md-sys-color-surface)] flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <MessageSquare size={14} />
                                    </div>

                                    {/* Content Card */}
                                    <div className="flex-1 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] p-4 rounded-2xl shadow-sm group-hover:border-violet-200 dark:group-hover:border-violet-800/50 group-hover:shadow-md transition-all relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500/20 group-hover:bg-violet-500 transition-colors" />

                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-full">
                                                Instructor Note
                                            </div>
                                            <span className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] flex items-center gap-1">
                                                <Clock size={10} /> {new Date().toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed">{note}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[var(--md-sys-color-secondary)] relative z-10">
                            <div className="w-16 h-16 bg-[var(--md-sys-color-surface-variant)]/50 rounded-2xl flex items-center justify-center mb-4 opacity-70">
                                <MessageSquare size={24} />
                            </div>
                            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)]">No timeline events</p>
                            <p className="text-xs mt-1">Start by adding an entry above.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Attendance Stats */}
            <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-[var(--md-sys-color-outline)] h-[600px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-sky-500 opacity-80" />

                    <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <CalendarCheck size={16} /> Record Summary
                    </h3>

                    <div className="flex flex-col gap-4">
                        {/* Overall Attendance Metric */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                            <div className="text-4xl md:text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                                {Math.round(student.attendancePct)}%
                            </div>
                            <p className="text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-widest">Overall Attendance</p>
                        </div>

                        {/* Present Count */}
                        <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/60 border border-[var(--md-sys-color-outline)] rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--md-sys-color-secondary)]">Total Present</p>
                                <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-1">{presentCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner border border-emerald-200 dark:border-emerald-800/50">
                                <CalendarCheck size={20} />
                            </div>
                        </div>

                        {/* Absent Count */}
                        <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/60 border border-[var(--md-sys-color-outline)] rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--md-sys-color-secondary)] flex items-center gap-1.5 focus">
                                    Total Absent {absentCount > 3 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                </p>
                                <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] mt-1">{absentCount}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-inner border border-rose-200 dark:border-rose-800/50">
                                <CalendarX size={20} />
                            </div>
                        </div>

                        {/* Notice */}
                        {absentCount > 3 && (
                            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/20 rounded-xl flex gap-3 text-rose-700 dark:text-rose-400">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider mb-1">Warning flag</p>
                                    <p className="text-xs font-medium opacity-90">This student has missed more than 3 classes. Consider scheduling a meeting with the guardian.</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};
