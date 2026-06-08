import React, { useState, useEffect, useRef } from 'react';
import { Student, StudentGroup } from '../types';
import { X, Save, AlertCircle, Camera } from 'lucide-react';
import clsx from 'clsx';
import { studentSchema, validateWithSchema } from '../schemas/validation';
import { getStudentGroups, getLevelsForGroup } from '../constants/educationLevels';
import { useTheme } from '../contexts/ThemeContext';

interface EditStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onSave: (updatedStudent: Student) => void;
}

interface FieldErrors {
    [key: string]: string;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({ isOpen, onClose, student, onSave }) => {
    const { preferences } = useTheme();
    const [editForm, setEditForm] = useState<Partial<Student>>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (student && isOpen) {
            setEditForm(student);
            setErrors({});
        }
    }, [student, isOpen]);

    if (!isOpen || !student) return null;

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setEditForm(prev => ({ ...prev, photo: base64 }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = {
            ...student,
            ...editForm,
            name: editForm.name?.trim() || '',
            grade: editForm.grade || '',
            lot: editForm.lot || '',
            subject: editForm.subject || '',
            email: editForm.email?.trim() || undefined,
            phone: editForm.phone?.trim() || undefined,
            dateOfBirth: editForm.dateOfBirth || undefined,
            admissionNumber: editForm.admissionNumber?.trim() || undefined,
            nemisNumber: editForm.nemisNumber?.trim() || undefined,
            upi: editForm.upi?.trim() || undefined,
            kcpeMarks: editForm.kcpeMarks ? Number(editForm.kcpeMarks) : undefined,
            nationalId: editForm.nationalId?.trim() || undefined,
            nitaNumber: editForm.nitaNumber?.trim() || undefined,
            epraLicenseStatus: editForm.epraLicenseStatus || 'None',
            kcseGrade: editForm.kcseGrade?.trim() || undefined,
            guardianName: editForm.guardianName?.trim() || undefined,
            guardianPhone: editForm.guardianPhone?.trim() || undefined,
            address: editForm.address?.trim() || undefined,
        };

        const result = validateWithSchema(studentSchema, formData);

        if (result.success === false) {
            setErrors(result.errors);
            setIsSubmitting(false);
            return;
        }

        onSave({ ...student, ...result.data } as Student);
        setIsSubmitting(false);
        onClose();
    };

    const hasEnabledFields = !!(
        preferences.enabledFields?.admissionNumber ||
        preferences.enabledFields?.nemisNumber ||
        preferences.enabledFields?.upi ||
        preferences.enabledFields?.nationalId ||
        preferences.enabledFields?.nitaNumber ||
        preferences.enabledFields?.epraLicenseStatus ||
        preferences.enabledFields?.kcseGrade ||
        preferences.enabledFields?.kcpeMarks ||
        preferences.enabledFields?.guardianDetails
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-b border-[var(--md-sys-color-outline)] flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Edit Student Profile</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl transition-colors text-[var(--md-sys-color-on-surface-variant)]"
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                    <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-6">
                        {Object.keys(errors).length > 0 && (
                            <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 space-y-1">
                                {Object.entries(errors).filter(([_, msg]) => msg).map(([field, error]) => (
                                    <p key={field} className="text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        {error}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Photo Section */}
                        <div className="flex justify-center mb-6">
                            <div className="relative w-24 h-24 bg-gray-200 rounded-2xl overflow-hidden border-2 border-white shadow-lg ring-1 ring-black/5 animate-scale-in">
                                {editForm.photo ? (
                                    <img src={editForm.photo} alt={editForm.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                                        <span className="text-3xl font-black text-slate-400">{editForm.name?.charAt(0) || '?'}</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-1 right-1 p-1.5 bg-white rounded-full shadow-md text-violet-600 hover:bg-violet-50 transition-transform duration-200 hover:scale-110"
                                >
                                    <Camera size={14} />
                                </button>
                                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            </div>
                        </div>

                        {/* Primary Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Full Name *</label>
                                <input
                                    value={editForm.name || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] focus:border-transparent text-[var(--md-sys-color-on-surface)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">
                                    {preferences.terminology?.classLabel || 'Subject'} / Course *
                                </label>
                                <select
                                    value={editForm.subject || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-semibold"
                                >
                                    {(preferences.customSubjects || ['Solar', 'ICT']).map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>
                            {getStudentGroups(preferences.institutionType).length > 1 && (
                                <div>
                                    <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Group</label>
                                    <select
                                        value={editForm.studentGroup || 'Academy'}
                                        onChange={e => {
                                            const grp = e.target.value as StudentGroup;
                                            setEditForm(prev => ({ ...prev, studentGroup: grp, grade: getLevelsForGroup(grp, preferences.institutionType)[0]?.id || '' }));
                                        }}
                                        className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                    >
                                        {getStudentGroups(preferences.institutionType).map(grp => (
                                            <option key={grp} value={grp}>{grp}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">
                                    {preferences.terminology?.classLabel || 'Level'}
                                </label>
                                <select
                                    value={editForm.grade || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, grade: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                >
                                    {getLevelsForGroup(editForm.studentGroup || 'Academy', preferences.institutionType).map(lvl => (
                                        <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">
                                    {preferences.terminology?.cohortLabel || 'Lot'} / Cohort *
                                </label>
                                <select
                                    value={editForm.lot || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, lot: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                >
                                    {['2024', '2025', '2026', '2027'].map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <hr className="border-[var(--md-sys-color-outline-variant)]" />

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={editForm.dateOfBirth || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Address</label>
                                <input
                                    value={editForm.address || ''}
                                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                />
                            </div>
                        </div>

                        {/* Dynamic Regulatory & Academic details */}
                        {hasEnabledFields && (
                            <>
                                <hr className="border-[var(--md-sys-color-outline-variant)]" />
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">
                                        Regulatory & Academic Profile
                                    </h4>

                                    {preferences.enabledFields?.admissionNumber && (
                                        <div>
                                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Admission Number</label>
                                            <input
                                                value={editForm.admissionNumber || ''}
                                                onChange={e => setEditForm(prev => ({ ...prev, admissionNumber: e.target.value }))}
                                                className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {preferences.enabledFields?.nemisNumber && (
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">NEMIS ID</label>
                                                <input
                                                    value={editForm.nemisNumber || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, nemisNumber: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                                                />
                                            </div>
                                        )}

                                        {preferences.enabledFields?.upi && (
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">UPI (Unique Personal Identifier)</label>
                                                <input
                                                    value={editForm.upi || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, upi: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {preferences.enabledFields?.nationalId && (
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">National ID / Alien ID</label>
                                                <input
                                                    value={editForm.nationalId || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, nationalId: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                                />
                                            </div>
                                        )}

                                        {preferences.enabledFields?.nitaNumber && (
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">NITA Registration No.</label>
                                                <input
                                                    value={editForm.nitaNumber || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, nitaNumber: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-mono"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {preferences.enabledFields?.epraLicenseStatus && (
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">EPRA License Status</label>
                                                <select
                                                    value={editForm.epraLicenseStatus || 'None'}
                                                    onChange={e => setEditForm(prev => ({ ...prev, epraLicenseStatus: e.target.value as any }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-semibold"
                                                >
                                                    <option value="None">None</option>
                                                    <option value="T1">T1 (Artisan)</option>
                                                    <option value="T2">T2 (Technician)</option>
                                                    <option value="T3">T3 (Engineer)</option>
                                                </select>
                                            </div>
                                        )}

                                        {preferences.enabledFields?.kcseGrade && (
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">KCSE Mean Grade</label>
                                                <select
                                                    value={editForm.kcseGrade || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, kcseGrade: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)] font-semibold"
                                                >
                                                    <option value="">Select Grade</option>
                                                    {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'].map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {preferences.enabledFields?.kcpeMarks && (
                                        <div>
                                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">KCPE Marks</label>
                                            <input
                                                type="number"
                                                value={editForm.kcpeMarks === undefined ? '' : editForm.kcpeMarks}
                                                onChange={e => setEditForm(prev => ({ ...prev, kcpeMarks: e.target.value ? Number(e.target.value) : undefined }))}
                                                className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                            />
                                        </div>
                                    )}

                                    {preferences.enabledFields?.guardianDetails && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Guardian Name</label>
                                                <input
                                                    value={editForm.guardianName || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, guardianName: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Guardian Phone</label>
                                                <input
                                                    value={editForm.guardianPhone || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                                                    className="w-full px-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-surface)]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </form>
                </div>

                {/* Footer Controls */}
                <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-t border-[var(--md-sys-color-outline)] flex-shrink-0 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface-variant)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-student-form"
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-[var(--accent-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-75"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditStudentModal;
