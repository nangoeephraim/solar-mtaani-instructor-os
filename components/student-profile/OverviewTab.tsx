import React from 'react';
import { Mail, Phone, Calendar, MapPin, User, Shield, Building, Award, Book, AlertCircle } from 'lucide-react';
import { Student } from '../../types';
import clsx from 'clsx';

interface OverviewTabProps {
    student: Student;
    classAvgStudents?: Student[];
    onAddNote?: (note: string) => void;
    studentAverage?: number;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ student }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in relative z-10">
            {/* Left Column - Contact & Guardian */}
            <div className="lg:col-span-5 space-y-6">
                {/* Contact Details */}
                <div className="glass-panel p-6 rounded-2xl border border-[var(--md-sys-color-outline)] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80" />

                    <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <User size={16} /> Contact Information
                    </h3>

                    <div className="space-y-4">
                        <div className="group/item flex items-center gap-4 p-3 hover:bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl transition-colors cursor-default">
                            <div className="p-2.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl group-hover/item:scale-110 transition-transform shadow-sm border border-blue-100 dark:border-blue-800/30">
                                <Mail size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Email Address</p>
                                <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">{student.email || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="group/item flex items-center gap-4 p-3 hover:bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl transition-colors cursor-default">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl group-hover/item:scale-110 transition-transform shadow-sm border border-emerald-100 dark:border-emerald-800/30">
                                <Phone size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Phone Number</p>
                                <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">{student.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        <div className="group/item flex items-center gap-4 p-3 hover:bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl transition-colors cursor-default">
                            <div className="p-2.5 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl group-hover/item:scale-110 transition-transform shadow-sm border border-amber-100 dark:border-amber-800/30">
                                <MapPin size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Home Address</p>
                                <p className="text-sm font-semibold text-[var(--md-sys-color-on-surface)] mt-0.5">{student.address || 'Not provided'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Emergency / Guardian Info */}
                <div className="glass-panel p-6 rounded-2xl border border-[var(--md-sys-color-outline)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-orange-500 opacity-80" />

                    <h3 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Shield size={16} /> Guardian & Emergency
                    </h3>

                    <div className="bg-[var(--md-sys-color-surface-variant)]/40 p-5 rounded-2xl border border-[var(--md-sys-color-outline)]/50 space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase flex items-center gap-1.5"><User size={12} className="text-rose-400" /> Primary Guardian</p>
                            <p className="text-base font-bold text-[var(--md-sys-color-on-surface)] mt-1">{student.guardianName || 'Not specified'}</p>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-[var(--md-sys-color-outline)]/10 via-[var(--md-sys-color-outline)] to-[var(--md-sys-color-outline)]/10 my-2" />

                        <div>
                            <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase flex items-center gap-1.5"><Phone size={12} className="text-rose-400" /> Emergency Contact</p>
                            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-1">{student.guardianPhone || 'Not specified'}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-variant)]/30 rounded-xl border border-[var(--md-sys-color-outline)]/40">
                        <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase flex items-center gap-1.5"><Calendar size={12} className="text-indigo-400" /> Date of Birth</p>
                        <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">{student.dateOfBirth || 'Unknown'}</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Registration & Academic Summary */}
            <div className="lg:col-span-7 space-y-6">
                {/* Registration Details */}
                <div className="glass-panel p-6 rounded-2xl border border-[var(--md-sys-color-outline)] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-80" />

                    <h3 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Building size={16} /> Institutional Registration
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-emerald-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Admission Number</p>
                            <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1">{student.admissionNumber || 'Pending'}</p>
                        </div>

                        <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-indigo-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">NITA Registration</p>
                            <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1 truncate">{student.nitaNumber || 'Pending'}</p>
                        </div>

                        <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-amber-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">EPRA Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={clsx(
                                    "w-2 h-2 rounded-full",
                                    student.epraLicenseStatus === 'Valid' ? 'bg-emerald-500' :
                                        student.epraLicenseStatus === 'Expired' ? 'bg-rose-500' : 'bg-slate-300'
                                )} />
                                <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">{student.epraLicenseStatus || 'None'}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--md-sys-color-surface-variant)]/60 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500" />
                            <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase">KCSE Grade</p>
                            <p className="text-lg font-black text-[var(--md-sys-color-on-surface)] mt-1">{student.kcseGrade || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Academic Summary Placeholder */}
                <div className="glass-panel p-6 rounded-2xl border border-[var(--md-sys-color-outline)] bg-gradient-to-br from-[var(--md-sys-color-surface)] to-indigo-50/30 dark:to-indigo-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />

                    <h3 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Book size={16} /> Program Summary
                    </h3>

                    <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-white/40 dark:border-slate-700/50 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">Enrolled in {student.subject} Program</p>
                            <p className="text-xs text-[var(--md-sys-color-secondary)] mt-0.5">Lot {student.lot} • {student.studentGroup} • Grade {student.grade}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
