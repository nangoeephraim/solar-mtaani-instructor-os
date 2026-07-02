import React, { useState, useCallback } from 'react';
import { Student, StudentGroup } from '../types';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { studentSchema, validateWithSchema } from '../schemas/validation';
import { getStudentGroups, getLevelsForGroup, getDefaultLevel } from '../constants/educationLevels';
import { useTheme } from '../contexts/ThemeContext';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (student: Omit<Student, 'id'>) => void;
}

interface FieldErrors {
    [key: string]: string;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { preferences } = useTheme();
    const [name, setName] = useState('');
    const [grade, setGrade] = useState<string>('');
    const [lot, setLot] = useState('2025');
    const [subject, setSubject] = useState<string>('');
    const [studentGroup, setStudentGroup] = useState<StudentGroup>('Academy');

    // Profile details
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');

    // Regulatory / Custom Fields
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [nemisNumber, setNemisNumber] = useState('');
    const [upi, setUpi] = useState('');
    const [kcpeMarks, setKcpeMarks] = useState('');
    const [nationalId, setNationalId] = useState('');
    const [nitaNumber, setNitaNumber] = useState('');
    const [epraLicenseStatus, setEpraLicenseStatus] = useState<'None' | 'T1' | 'T2' | 'T3'>('None');
    const [kcseGrade, setKcseGrade] = useState('');
    const [guardianName, setGuardianName] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');

    const [errors, setErrors] = useState<FieldErrors>({});
    const [touched, setTouched] = useState<Set<string>>(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize state when modal opens or settings change
    React.useEffect(() => {
        if (isOpen && preferences) {
            const groups = getStudentGroups(preferences.institutionType);
            const defaultGroup = groups[0] || 'Academy';
            const defaultGrade = getDefaultLevel(defaultGroup, preferences.institutionType);
            const defaultSub = preferences.defaultSubject && preferences.defaultSubject !== 'All' 
                ? preferences.defaultSubject 
                : (preferences.customSubjects?.[0] || 'Solar');

            setStudentGroup(defaultGroup);
            setGrade(defaultGrade);
            setSubject(defaultSub);
            setLot(String(new Date().getFullYear()));
            
            // Clear other fields
            setName('');
            setEmail('');
            setPhone('');
            setDateOfBirth('');
            setAdmissionNumber('');
            setNemisNumber('');
            setUpi('');
            setKcpeMarks('');
            setNationalId('');
            setNitaNumber('');
            setEpraLicenseStatus('None');
            setKcseGrade('');
            setGuardianName('');
            setGuardianPhone('');
            setErrors({});
            setTouched(new Set());
        }
    }, [isOpen, preferences]);

    const getDefaultCompetencies = (sub: string) => {
        const instType = preferences.institutionType || 'tvet';
        if (instType === 'primary' || instType === 'jss') {
            return {
                communication_collaboration: 1,
                critical_thinking: 1,
                creativity_imagination: 1,
                citizenship: 1,
                self_efficacy: 1,
                digital_literacy: 1,
                learning_to_learn: 1
            };
        }
        
        if (sub.toLowerCase().includes('solar')) {
            return { safety: 1, tools: 1, principles: 1, installation: 1, maintenance: 1 };
        }
        if (sub.toLowerCase().includes('ict') || sub.toLowerCase().includes('computer') || sub.toLowerCase().includes('software')) {
            return { hardware: 1, software: 1, typing: 1, formatting: 1, data: 1 };
        }
        
        return {
            [`${sub.toLowerCase()}_basics`]: 1,
            [`${sub.toLowerCase()}_theory`]: 1,
            [`${sub.toLowerCase()}_practical`]: 1,
            [`${sub.toLowerCase()}_assessment`]: 1,
            [`${sub.toLowerCase()}_project`]: 1,
        };
    };

    // Real-time validation for touched fields
    const validateField = useCallback((field: string, value: unknown) => {
        const partialData = { [field]: value };
        const result = studentSchema.partial().safeParse(partialData);

        if (!result.success) {
            const fieldError = result.error.issues.find(e => e.path[0] === field);
            return fieldError?.message || '';
        }
        return '';
    }, []);

    const handleBlur = (field: string, value: unknown) => {
        setTouched(prev => new Set(prev).add(field));
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = {
            name: name.trim(),
            grade,
            lot,
            subject,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            dateOfBirth: dateOfBirth || undefined,
            admissionNumber: admissionNumber.trim() || undefined,
            nemisNumber: nemisNumber.trim() || undefined,
            upi: upi.trim() || undefined,
            kcpeMarks: kcpeMarks ? Number(kcpeMarks) : undefined,
            nationalId: nationalId.trim() || undefined,
            nitaNumber: nitaNumber.trim() || undefined,
            epraLicenseStatus,
            kcseGrade: kcseGrade.trim() || undefined,
            guardianName: guardianName.trim() || undefined,
            guardianPhone: guardianPhone.trim() || undefined,
        };

        const result = validateWithSchema(studentSchema, formData);

        if (result.success === false) {
            setErrors(result.errors);
            setIsSubmitting(false);
            return;
        }

        const valid = result.data;
        const newStudent: Omit<Student, 'id'> = {
            name: valid.name,
            grade: valid.grade,
            lot: valid.lot,
            subject: valid.subject,
            email: valid.email || undefined,
            phone: valid.phone || undefined,
            dateOfBirth: valid.dateOfBirth || undefined,
            guardianName: valid.guardianName || undefined,
            guardianPhone: valid.guardianPhone || undefined,
            admissionNumber: valid.admissionNumber || undefined,
            nemisNumber: valid.nemisNumber || undefined,
            upi: valid.upi || undefined,
            kcpeMarks: typeof valid.kcpeMarks === 'number' ? valid.kcpeMarks : undefined,
            nationalId: valid.nationalId || undefined,
            nitaNumber: valid.nitaNumber || undefined,
            epraLicenseStatus: valid.epraLicenseStatus,
            kcseGrade: valid.kcseGrade || undefined,
            notes: valid.notes || [],
            studentGroup,
            competencies: getDefaultCompetencies(subject),
            attendancePct: 100,
            attendanceHistory: [],
            assessment: { units: {}, termStats: [] }
        };

        onAdd(newStudent);
        handleClose();
        setIsSubmitting(false);
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-b border-[var(--md-sys-color-outline)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-xl text-[var(--md-sys-color-primary)]">
                                <UserPlus size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">Add New Student</h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl transition-colors text-[var(--md-sys-color-on-surface-variant)]"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
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

                    <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                        {/* Name */}
                        <div>
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={() => handleBlur('name', name)}
                                placeholder="Enter student's full name"
                                className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]"
                                autoFocus
                            />
                        </div>

                        {/* Subject Selection */}
                        <div>
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                {preferences.terminology?.classLabel || 'Subject'} / Program *
                            </label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                            >
                                {(preferences.customSubjects || ['Solar', 'ICT']).map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>

                        {/* Student Group (only show if there's more than 1 option for this institution type) */}
                        {getStudentGroups(preferences.institutionType).length > 1 && (
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                    Student System / Group
                                </label>
                                <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-xl p-1">
                                    {getStudentGroups(preferences.institutionType).map(grp => (
                                        <button
                                            key={grp}
                                            type="button"
                                            onClick={() => { setStudentGroup(grp); setGrade(getDefaultLevel(grp, preferences.institutionType)); }}
                                            className={clsx(
                                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                                studentGroup === grp
                                                    ? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow"
                                                    : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                                            )}
                                        >
                                            {grp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Level & Lot */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                    Education {preferences.terminology?.classLabel || 'Level'}
                                </label>
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                >
                                    {getLevelsForGroup(studentGroup, preferences.institutionType).map(lvl => (
                                        <option key={lvl.id} value={lvl.id}>{lvl.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                    {preferences.terminology?.cohortLabel || 'Lot'} / Cohort
                                </label>
                                <select
                                    value={lot}
                                    onChange={(e) => setLot(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                >
                                    {['2024', '2025', '2026', '2027'].map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Standard Contact Fields (optional) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    onBlur={() => handleBlur('phone', phone)}
                                    placeholder="e.g. 0712345678"
                                    className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    onBlur={() => handleBlur('dateOfBirth', dateOfBirth)}
                                    className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => handleBlur('email', email)}
                                placeholder="e.g. student@school.ac.ke"
                                className="w-full px-4 py-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-all placeholder-[var(--md-sys-color-secondary)]"
                            />
                        </div>

                        {/* Dynamic Regulatory / Niche Fields */}
                        {(preferences.enabledFields?.admissionNumber ||
                          preferences.enabledFields?.nemisNumber ||
                          preferences.enabledFields?.upi ||
                          preferences.enabledFields?.nationalId ||
                          preferences.enabledFields?.nitaNumber ||
                          preferences.enabledFields?.epraLicenseStatus ||
                          preferences.enabledFields?.kcseGrade ||
                          preferences.enabledFields?.kcpeMarks ||
                          preferences.enabledFields?.guardianDetails) && (
                            <div className="pt-4 border-t border-[var(--md-sys-color-outline-variant)] space-y-4">
                                <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">
                                    Regulatory & Academic Profile
                                </h4>

                                {preferences.enabledFields?.admissionNumber && (
                                    <div>
                                        <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Admission Number</label>
                                        <input
                                            type="text"
                                            value={admissionNumber}
                                            onChange={(e) => setAdmissionNumber(e.target.value)}
                                            placeholder="Enter Admission Number"
                                            className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    {preferences.enabledFields?.nemisNumber && (
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">NEMIS Number</label>
                                            <input
                                                type="text"
                                                value={nemisNumber}
                                                onChange={(e) => setNemisNumber(e.target.value)}
                                                placeholder="NEMIS ID"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                            />
                                        </div>
                                    )}

                                    {preferences.enabledFields?.upi && (
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">UPI Number</label>
                                            <input
                                                type="text"
                                                value={upi}
                                                onChange={(e) => setUpi(e.target.value)}
                                                placeholder="UPI Code"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {preferences.enabledFields?.nationalId && (
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">National ID</label>
                                            <input
                                                type="text"
                                                value={nationalId}
                                                onChange={(e) => setNationalId(e.target.value)}
                                                placeholder="ID Number"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                            />
                                        </div>
                                    )}

                                    {preferences.enabledFields?.nitaNumber && (
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">NITA Number</label>
                                            <input
                                                type="text"
                                                value={nitaNumber}
                                                onChange={(e) => setNitaNumber(e.target.value)}
                                                placeholder="NITA Reg No"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {preferences.enabledFields?.epraLicenseStatus && (
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">EPRA License</label>
                                            <select
                                                value={epraLicenseStatus}
                                                onChange={(e) => setEpraLicenseStatus(e.target.value as any)}
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
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
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">KCSE Grade</label>
                                            <select
                                                value={kcseGrade}
                                                onChange={(e) => setKcseGrade(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs font-semibold text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
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
                                        <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">KCPE Marks</label>
                                        <input
                                            type="number"
                                            value={kcpeMarks}
                                            onChange={(e) => setKcpeMarks(e.target.value)}
                                            onBlur={() => handleBlur('kcpeMarks', kcpeMarks ? Number(kcpeMarks) : undefined)}
                                            placeholder="Score out of 500"
                                            className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                        />
                                    </div>
                                )}

                                {preferences.enabledFields?.guardianDetails && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Guardian Name</label>
                                            <input
                                                type="text"
                                                value={guardianName}
                                                onChange={(e) => setGuardianName(e.target.value)}
                                                onBlur={() => handleBlur('guardianName', guardianName)}
                                                placeholder="Guardian Full Name"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase block mb-1">Guardian Phone</label>
                                            <input
                                                type="text"
                                                value={guardianPhone}
                                                onChange={(e) => setGuardianPhone(e.target.value)}
                                                onBlur={() => handleBlur('guardianPhone', guardianPhone)}
                                                placeholder="e.g. 0712345678"
                                                className="w-full px-4 py-2.5 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 px-4 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] rounded-xl font-bold text-sm hover:opacity-80 transition-opacity"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-4 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <UserPlus size={16} />
                            Add Student
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentModal;
