import React from 'react';
import { Mail, Phone, Calendar, MapPin, User, Shield, Building, Award, Book } from 'lucide-react';
import { Student } from '../../types';
import clsx from 'clsx';
import { useTheme } from '../../contexts/ThemeContext';
import { getLevelShortLabel } from '../../constants/educationLevels';

interface OverviewTabProps {
    student: Student;
    classAvgStudents?: Student[];
    onAddNote?: (note: string) => void;
    studentAverage?: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ student }) => {
    const { preferences } = useTheme();
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in relative z-10 text-[var(--md-sys-color-on-surface)]">
            {/* Left Column - Contact & Guardian */}
            <div className="lg:col-span-5 space-y-6">
                {/* Contact Details */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white/40 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/60">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />

                    <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <User size={15} /> Contact Details
                    </h3>

                    <div className="space-y-3.5">
                        <div className="group/item flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-xl transition-all duration-300 cursor-default hover:translate-x-1 border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/40">
                            <div className="p-2.5 bg-blue-50 text-blue-650 dark:bg-blue-950/40 dark:text-blue-450 rounded-xl group-hover/item:scale-105 transition-transform shadow-sm border border-blue-100/50 dark:border-blue-900/30">
                                <Mail size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Email Address</p>
                                <p className="text-xs font-semibold mt-0.5 truncate">{student.email || 'No email registered'}</p>
                            </div>
                        </div>

                        <div className="group/item flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-xl transition-all duration-300 cursor-default hover:translate-x-1 border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/40">
                            <div className="p-2.5 bg-emerald-50 text-emerald-655 dark:bg-emerald-950/40 dark:text-emerald-450 rounded-xl group-hover/item:scale-105 transition-transform shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
                                <Phone size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Phone Number</p>
                                <p className="text-xs font-semibold mt-0.5 truncate">{student.phone || 'No phone registered'}</p>
                            </div>
                        </div>

                        <div className="group/item flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-900/30 rounded-xl transition-all duration-300 cursor-default hover:translate-x-1 border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/40">
                            <div className="p-2.5 bg-amber-50 text-amber-655 dark:bg-amber-950/40 dark:text-amber-450 rounded-xl group-hover/item:scale-105 transition-transform shadow-sm border border-amber-100/50 dark:border-amber-900/30">
                                <MapPin size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Home Address</p>
                                <p className="text-xs font-semibold mt-0.5 truncate">{student.address || 'No address registered'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency / Guardian Info */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white/40 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/60">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500 opacity-80" />

                    <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Shield size={15} /> Guardian Details
                    </h3>

                    <div className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 bg-slate-50/20 dark:bg-slate-950/20 backdrop-blur-sm shadow-inner">
                        <div>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5"><User size={12} className="text-rose-400" /> Primary Guardian</p>
                            <p className="text-sm font-bold mt-1">{student.guardianName || 'Not specified'}</p>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-slate-200/10 via-slate-200 dark:via-slate-800 to-slate-200/10 my-2" />

                        <div>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5"><Phone size={12} className="text-rose-400" /> Phone Contact</p>
                            <p className="text-xs font-bold mt-1">{student.guardianPhone || 'Not specified'}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-50/25 dark:bg-slate-950/15 rounded-xl border border-slate-250/30 dark:border-slate-800/30 hover:bg-slate-50/40 dark:hover:bg-slate-900/30 transition-colors duration-300 text-xs">
                        <p className="font-bold text-slate-450 dark:text-slate-500 uppercase flex items-center gap-1.5"><Calendar size={13} className="text-indigo-400" /> Date of Birth</p>
                        <p className="font-bold">{student.dateOfBirth || 'Unknown'}</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Registration & Academic Summary */}
            <div className="lg:col-span-7 space-y-6">
                {/* Registration Details */}
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 bg-white/40 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/60">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />

                    <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Building size={15} /> Registrations
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden group hover:scale-[1.01] hover:-translate-y-0.5 duration-300 bg-white/60 dark:bg-slate-950/20">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Admission ID</p>
                            <p className="text-base font-black mt-1 text-slate-850 dark:text-white">{student.admissionNumber || 'Pending'}</p>
                        </div>

                        <div className="glass-card p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden group hover:scale-[1.01] hover:-translate-y-0.5 duration-300 bg-white/60 dark:bg-slate-950/20">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">NITA License</p>
                            <p className="text-base font-black mt-1 truncate text-slate-850 dark:text-white">{student.nitaNumber || 'Pending'}</p>
                        </div>

                        <div className="glass-card p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden group hover:scale-[1.01] hover:-translate-y-0.5 duration-300 bg-white/60 dark:bg-slate-950/20">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-amber-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">EPRA Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx(
                                    "w-1.5 h-1.5 rounded-full",
                                    (student.epraLicenseStatus === 'T1' || student.epraLicenseStatus === 'T2' || student.epraLicenseStatus === 'T3') ? 'bg-emerald-500' : 'bg-slate-400'
                                )} />
                                <p className="text-sm font-bold text-slate-850 dark:text-white">{student.epraLicenseStatus || 'None'}</p>
                            </div>
                        </div>

                        <div className="glass-card p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 relative overflow-hidden group hover:scale-[1.01] hover:-translate-y-0.5 duration-300 bg-white/60 dark:bg-slate-950/20">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">KCSE Grade</p>
                            <p className="text-base font-black mt-1 text-slate-850 dark:text-white">{student.kcseGrade || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Program Summary */}
                <div className="glass-card p-6 rounded-2xl bg-gradient-to-br from-white/40 to-indigo-50/10 dark:from-slate-900/10 dark:to-indigo-950/5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/50 dark:border-slate-800/60">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />

                    <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Book size={15} /> Program Overview
                    </h3>

                    <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/40 dark:border-slate-800/40 backdrop-blur-sm shadow-sm hover:scale-[1.005] duration-300">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                            <Award size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-850 dark:text-white">Active enrolment in {student.subject} Program</p>
                            <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 font-semibold">
                                {preferences.terminology?.cohortLabel || 'Lot'} {student.lot} • {student.studentGroup} • {preferences.terminology?.classLabel || 'Level'} {getLevelShortLabel(student.studentGroup, String(student.grade))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default OverviewTab;
