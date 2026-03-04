import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, TrendingUp, TrendingDown, Zap, Monitor, Bell, Award, Calendar, BookOpen, Edit3 } from 'lucide-react';
import clsx from 'clsx';
import { Student } from '../../types';
import { getLevelShortLabel } from '../../constants/educationLevels';
import { QuickAlertModal } from './QuickAlertModal';

interface ProfileHeaderProps {
    student: Student;
    studentAverage: number;
    performanceVsClass: number;
    onDeleteRequest: () => void;
    onEditRequest?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    student,
    studentAverage,
    performanceVsClass,
    onDeleteRequest,
    onEditRequest
}) => {
    const [showAlertModal, setShowAlertModal] = React.useState(false);

    return (
        <div className="relative w-full overflow-hidden bg-[var(--md-sys-color-surface)]">
            {/* Banner Background */}
            <div className="h-32 md:h-48 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                <motion.div
                    animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
                    transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent mix-blend-overlay"
                />
            </div>

            {/* Content Container */}
            <div className="px-6 pb-6 relative">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-20">

                    {/* Avatar */}
                    <motion.div
                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-[var(--md-sys-color-surface)] shadow-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex-shrink-0 z-10 flex items-center justify-center relative group"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <span className="text-5xl md:text-6xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-sm">{student.name.charAt(0)}</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>

                    {/* Metadata & Actions Box */}
                    <div className="flex-1 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2 md:pt-0">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h1 className="text-3xl md:text-4xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight leading-none mb-2 font-google">
                                {student.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5",
                                    student.subject === 'Solar'
                                        ? "bg-amber-100/50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                                        : "bg-sky-100/50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/50"
                                )}>
                                    {student.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                    {student.subject}
                                </span>
                                <span className={clsx(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                                    student.studentGroup === 'Campus' ? "bg-indigo-100/50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50" :
                                        student.studentGroup === 'Academy' ? "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50" :
                                            student.studentGroup === 'CBC' ? "bg-cyan-100/50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50" :
                                                "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50"
                                )}>
                                    {student.studentGroup}
                                </span>
                                <span className="text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] px-2 border-l-2 border-[var(--md-sys-color-outline)]">
                                    {getLevelShortLabel(student.studentGroup, String(student.grade))}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-[var(--md-sys-color-on-surface-variant)]">
                                <span className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-variant)] px-2 py-1 rounded-md border border-[var(--md-sys-color-outline)]"><span className="text-[var(--md-sys-color-secondary)]">ID</span> #{student.id.toString().padStart(4, '0')}</span>
                                <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-[var(--md-sys-color-secondary)]" /> Lot {student.lot}</span>
                            </div>
                        </motion.div>

                        <motion.div
                            className="flex gap-2 w-full md:w-auto mt-4 md:mt-0"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <button
                                onClick={() => setShowAlertModal(true)}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm transition-all border border-indigo-100 dark:border-indigo-500/20"
                            >
                                <Bell size={16} /> <span className="md:hidden lg:inline">Alert Flow</span>
                            </button>
                            {onEditRequest && (
                                <button
                                    onClick={onEditRequest}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm transition-all border border-emerald-100 dark:border-emerald-500/20 md:w-auto"
                                >
                                    <Edit3 size={16} /> <span className="md:hidden lg:inline">Edit</span>
                                </button>
                            )}
                            <button
                                onClick={onDeleteRequest}
                                className="flex items-center justify-center px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm transition-all border border-rose-100 dark:border-rose-500/20 md:w-12 lg:w-auto"
                                title="Remove Profile"
                            >
                                <Trash2 size={16} />
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Performance KPIs - Glass Panel Look */}
                <motion.div
                    className="grid grid-cols-3 gap-4 mt-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="bg-[var(--md-sys-color-surface-variant)]/50 backdrop-blur-md p-4 rounded-2xl border border-[var(--md-sys-color-outline)] relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                        <div className="flex items-center gap-2 text-[var(--md-sys-color-secondary)] mb-1">
                            <Award size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Avg Score</span>
                        </div>
                        <span className="block text-2xl md:text-3xl font-black text-[var(--md-sys-color-on-surface)]">
                            {studentAverage.toFixed(1)}<span className="text-base text-[var(--md-sys-color-secondary)] font-medium">/ 4</span>
                        </span>
                    </div>

                    <div className="bg-[var(--md-sys-color-surface-variant)]/50 backdrop-blur-md p-4 rounded-2xl border border-[var(--md-sys-color-outline)] relative overflow-hidden group">
                        <div className={clsx(
                            "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500",
                            student.attendancePct >= 85 ? "bg-emerald-500/10" : student.attendancePct >= 70 ? "bg-amber-500/10" : "bg-rose-500/10"
                        )} />
                        <div className="flex items-center gap-2 text-[var(--md-sys-color-secondary)] mb-1">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Attendance</span>
                        </div>
                        <span className={clsx(
                            "block text-2xl md:text-3xl font-black",
                            student.attendancePct >= 85 ? "text-emerald-600 dark:text-emerald-400" :
                                student.attendancePct >= 70 ? "text-amber-500 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"
                        )}>
                            {student.attendancePct}%
                        </span>
                    </div>

                    <div className="bg-[var(--md-sys-color-surface-variant)]/50 backdrop-blur-md p-4 rounded-2xl border border-[var(--md-sys-color-outline)] relative overflow-hidden group">
                        <div className={clsx(
                            "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500",
                            performanceVsClass >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                        )} />
                        <div className="flex items-center gap-2 text-[var(--md-sys-color-secondary)] mb-1">
                            {performanceVsClass >= 0 ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-rose-500" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest">Vs Class</span>
                        </div>
                        <span className={clsx(
                            "block text-2xl md:text-3xl font-black",
                            performanceVsClass >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                        )}>
                            {performanceVsClass > 0 && '+'}{performanceVsClass.toFixed(1)}
                        </span>
                    </div>
                </motion.div>
            </div >

            <QuickAlertModal
                isOpen={showAlertModal}
                onClose={() => setShowAlertModal(false)}
                student={student}
            />
        </div >
    );
};
