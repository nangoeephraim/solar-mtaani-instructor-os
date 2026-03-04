import re

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\Students.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove editForm state and fileInputRef
content = re.sub(r'    const \[editForm, setEditForm\] = useState<Partial<Student>>\(\{\}\);\n', '', content)
content = re.sub(r'    const fileInputRef = useRef<HTMLInputElement>\(null\);\n', '', content)

# Remove handlePhotoUpload
content = re.sub(r'    const handlePhotoUpload = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{.*?\};\n\n', '', content, flags=re.DOTALL)

# Refactor handleSaveEdit and handleStartEdit
handle_save_old = """    const handleSaveEdit = () => {
        if (selectedStudent) {
            const updated = { ...selectedStudent, ...editForm };
            onUpdateStudent(updated, true);
            setSelectedStudent(updated);
            setIsEditing(false);
            setEditForm({});
        }
    };

    const handleStartEdit = () => {
        if (selectedStudent) {
            setEditForm(selectedStudent);
            setIsEditing(true);
        }
    };"""

handle_save_new = """    const handleSaveEdit = (updatedStudent: Student) => {
        onUpdateStudent(updatedStudent, true);
        setSelectedStudent(updatedStudent);
        setIsEditing(false);
    };

    const handleStartEdit = () => {
        setIsEditing(true);
    };"""
content = content.replace(handle_save_old, handle_save_new)

# Now, let's remove the inline editing from the JSX.
# Luckily, the structure is always {isEditing ? (...) : (...)}
# We want to replace {isEditing ? <something> : <something_else>} with just <something_else>
# Since regex parsing of nested {} is hard in Python, we can just replace the specific strings.

replacements = [
    # Photo
    (
"""                                                {(isEditing ? editForm.photo : selectedStudent.photo) ? (
                                                    <img
                                                        src={isEditing ? editForm.photo : selectedStudent.photo}
                                                        alt={selectedStudent.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                                        <span className="text-4xl font-black text-slate-400 dark:text-slate-500">{selectedStudent.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                                {isEditing && (
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        aria-label="Upload photo"
                                                        title="Upload photo"
                                                        className="absolute bottom-2 right-2 p-1.5 bg-white rounded-full shadow-md text-violet-600 hover:bg-violet-50"
                                                    >
                                                        <Camera size={14} />
                                                    </button>
                                                )}""",
"""                                                {selectedStudent.photo ? (
                                                    <img
                                                        src={selectedStudent.photo}
                                                        alt={selectedStudent.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                                                        <span className="text-4xl font-black text-slate-400 dark:text-slate-500">{selectedStudent.name.charAt(0)}</span>
                                                    </div>
                                                )}"""
    ),
    # Subject
    (
"""                                                {isEditing ? (
                                                    <select
                                                        value={editForm.subject || 'Solar'}
                                                        onChange={e => setEditForm(prev => ({ ...prev, subject: e.target.value as 'Solar' | 'ICT' }))}
                                                        title="Select Subject"
                                                        className="w-full bg-white/50 border border-gray-300 rounded px-2 py-1 text-xs font-bold text-center"
                                                    >
                                                        <option value="Solar">Solar</option>
                                                        <option value="ICT">ICT</option>
                                                    </select>
                                                ) : (
                                                    <span className={clsx(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                        selectedStudent.subject === 'Solar'
                                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                            : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800"
                                                    )}>
                                                        {selectedStudent.subject}
                                                    </span>
                                                )}""",
"""                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                                    selectedStudent.subject === 'Solar'
                                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                                        : "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800"
                                                )}>
                                                    {selectedStudent.subject}
                                                </span>"""
    ),
    # Group
    (
"""                                                {isEditing ? (
                                                    <select
                                                        value={editForm.studentGroup || 'Academy'}
                                                        onChange={e => setEditForm(prev => ({ ...prev, studentGroup: e.target.value as any }))}
                                                        title="Select Group"
                                                        className="w-full bg-white/50 border border-gray-300 rounded px-2 py-1 text-[10px] font-bold text-center mt-1"
                                                    >
                                                        <option value="Campus">Campus</option>
                                                        <option value="Academy">Academy</option>
                                                        <option value="CBC">CBC</option>
                                                        <option value="High School">High School</option>
                                                    </select>
                                                ) : (
                                                    <span className={clsx(
                                                        "block mx-auto w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm mt-1",
                                                        selectedStudent.studentGroup === 'Campus' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" :
                                                            selectedStudent.studentGroup === 'Academy' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                                                                selectedStudent.studentGroup === 'CBC' ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" :
                                                                    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                                                    )}>
                                                        {selectedStudent.studentGroup}
                                                    </span>
                                                )}""",
"""                                                <span className={clsx(
                                                    "block mx-auto w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm mt-1",
                                                    selectedStudent.studentGroup === 'Campus' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" :
                                                        selectedStudent.studentGroup === 'Academy' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                                                            selectedStudent.studentGroup === 'CBC' ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800" :
                                                                "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                                                )}>
                                                    {selectedStudent.studentGroup}
                                                </span>"""
    ),
    # Name
    (
"""                                                {isEditing ? (
                                                    <input
                                                        value={editForm.name || ''}
                                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Student Name"
                                                        title="Student Name"
                                                        className="text-xl font-bold w-full bg-white/50 border border-gray-300 rounded px-2 py-1"
                                                    />
                                                ) : (
                                                    <h1 className="text-xl font-black text-[var(--md-sys-color-on-surface)] uppercase leading-tight font-google">
                                                        {selectedStudent.name}
                                                    </h1>
                                                )}""",
"""                                                <h1 className="text-xl font-black text-[var(--md-sys-color-on-surface)] uppercase leading-tight font-google">
                                                    {selectedStudent.name}
                                                </h1>"""
    ),
    # Adm No
    (
"""                                                    {isEditing ? (
                                                        <input
                                                            value={editForm.admissionNumber || ''}
                                                            onChange={e => setEditForm(prev => ({ ...prev, admissionNumber: e.target.value }))}
                                                            placeholder="Adm No"
                                                            title="Admission Number"
                                                            className="text-xs font-bold w-24 bg-white/50 border border-gray-300 rounded px-1 py-0.5"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-[var(--md-sys-color-on-surface)] font-bold">{selectedStudent.admissionNumber || 'N/A'}</span>
                                                    )}""",
"""                                                    <span className="text-xs text-[var(--md-sys-color-on-surface)] font-bold">{selectedStudent.admissionNumber || 'N/A'}</span>"""
    ),
    # NITA
    (
"""                                                    {isEditing ? (
                                                        <input
                                                            value={editForm.nitaNumber || ''}
                                                            onChange={e => setEditForm(prev => ({ ...prev, nitaNumber: e.target.value }))}
                                                            placeholder="NITA No"
                                                            title="NITA Registration Number"
                                                            className="w-full bg-white/50 border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px]"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.nitaNumber || 'Pending'}</span>
                                                    )}""",
"""                                                    <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.nitaNumber || 'Pending'}</span>"""
    ),
    # KCSE Grade
    (
"""                                                    {isEditing ? (
                                                        <input
                                                            value={editForm.kcseGrade || ''}
                                                            onChange={e => setEditForm(prev => ({ ...prev, kcseGrade: e.target.value }))}
                                                            placeholder="Grade"
                                                            title="KCSE Grade"
                                                            className="w-full bg-white/50 border border-gray-300 rounded px-1 py-0.5 font-mono text-[10px]"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.kcseGrade || '-'}</span>
                                                    )}""",
"""                                                    <span className="font-mono font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.kcseGrade || '-'}</span>"""
    ),
    # EPRA
    (
"""                                                    {isEditing ? (
                                                        <select
                                                            value={editForm.epraLicenseStatus || 'None'}
                                                            onChange={e => setEditForm(prev => ({ ...prev, epraLicenseStatus: e.target.value as any }))}
                                                            title="EPRA License Status"
                                                            className="w-full bg-white/50 border border-gray-300 rounded px-1 py-0.5 text-[10px] font-bold"
                                                        >
                                                            <option value="None">None</option>
                                                            <option value="T3">T3</option>
                                                            <option value="T2">T2</option>
                                                            <option value="T1">T1</option>
                                                        </select>
                                                    ) : (
                                                        <span className={clsx(
                                                            "font-bold",
                                                            selectedStudent.epraLicenseStatus === 'None' ? "text-gray-400" : "text-green-600"
                                                        )}>
                                                            {selectedStudent.epraLicenseStatus || 'None'}
                                                        </span>
                                                    )}""",
"""                                                    <span className={clsx(
                                                        "font-bold",
                                                        selectedStudent.epraLicenseStatus === 'None' ? "text-gray-400" : "text-green-600"
                                                    )}>
                                                        {selectedStudent.epraLicenseStatus || 'None'}
                                                    </span>"""
    ),
    # Cohort
    (
"""                                                    {isEditing ? (
                                                        <input
                                                            value={editForm.lot || ''}
                                                            onChange={e => setEditForm(prev => ({ ...prev, lot: e.target.value }))}
                                                            placeholder="Lot/Cohort"
                                                            title="Cohort Lot"
                                                            className="w-full bg-white/50 border border-gray-300 rounded px-1 py-0.5 text-[10px] font-medium"
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.lot}</span>
                                                    )}""",
"""                                                    <span className="font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.lot}</span>"""
    ),
    # Email
    (
"""                                            {isEditing ? (
                                                <input
                                                    type="email"
                                                    value={editForm.email || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                                    placeholder="Email address"
                                                    className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                                />
                                            ) : (
                                                <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.email || 'No email'}</span>
                                            )}""",
"""                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.email || 'No email'}</span>"""
    ),
    # Phone
    (
"""                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    value={editForm.phone || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder="Phone number"
                                                    className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                                />
                                            ) : (
                                                <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.phone || 'No phone'}</span>
                                            )}""",
"""                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.phone || 'No phone'}</span>"""
    ),
    # DOB
    (
"""                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    value={editForm.dateOfBirth || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                                                    title="Date of Birth"
                                                    className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)]"
                                                />
                                            ) : (
                                                <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.dateOfBirth || 'No DOB'}</span>
                                            )}""",
"""                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.dateOfBirth || 'No DOB'}</span>"""
    ),
    # Address
    (
"""                                            {isEditing ? (
                                                <input
                                                    value={editForm.address || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                                    placeholder="Address"
                                                    className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-on-surface-variant)]"
                                                />
                                            ) : (
                                                <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.address || 'No address'}</span>
                                            )}""",
"""                                            <span className="text-sm text-[var(--md-sys-color-on-surface)]">{selectedStudent.address || 'No address'}</span>"""
    ),
    # Guardian Name
    (
"""                                            {isEditing ? (
                                                <input
                                                    value={editForm.guardianName || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, guardianName: e.target.value }))}
                                                    placeholder="Guardian name"
                                                    className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianName || 'Not specified'}</p>
                                            )}""",
"""                                            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianName || 'Not specified'}</p>"""
    ),
    # Guardian Phone
    (
"""                                            {isEditing ? (
                                                <input
                                                    value={editForm.guardianPhone || ''}
                                                    onChange={e => setEditForm(prev => ({ ...prev, guardianPhone: e.target.value }))}
                                                    placeholder="Guardian phone"
                                                    className="w-full bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-violet-500 text-[var(--md-sys-color-on-surface)]"
                                                />
                                            ) : (
                                                <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianPhone || 'Not specified'}</p>
                                            )}""",
"""                                            <p className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{selectedStudent.guardianPhone || 'Not specified'}</p>"""
    ),
    # Actions footer
    (
"""                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setIsEditing(false); setEditForm({}); }}
                                            className="flex-1 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-violet-500/20"
                                        >
                                            <Save size={16} />
                                            Save Changes
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => onNavigate('students', selectedStudent.id)}
                                                className="w-full py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex flex-col items-center justify-center gap-1 border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md"
                                            >
                                                <User size={18} />
                                                Full Profile
                                            </button>
                                            <button
                                                onClick={handleViewAnalytics}
                                                className="w-full py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg"
                                            >
                                                <BarChart3 size={18} />
                                                Deep Insights
                                            </button>
                                        </div>

                                        {user?.role !== 'viewer' && (
                                            <div className="flex gap-2 pt-3 mt-1 border-t border-[var(--md-sys-color-outline)] border-dashed">
                                                <button
                                                    onClick={handleStartEdit}
                                                    className="flex-1 py-2 bg-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-[var(--md-sys-color-surface-variant)]"
                                                >
                                                    <Edit3 size={14} />
                                                    Quick Edit
                                                </button>
                                                {user?.role === 'admin' && (
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                                                onDeleteStudent(selectedStudent.id);
                                                                setSelectedStudent(null);
                                                                showToast('Student deleted successfully', 'success');
                                                            }
                                                        }}
                                                        className="flex-1 py-2 bg-transparent text-rose-500 hover:text-rose-700 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}""",
"""                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onNavigate('students', selectedStudent.id)}
                                        className="w-full py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-container-highest)] transition-colors flex flex-col items-center justify-center gap-1 border border-[var(--md-sys-color-outline)] shadow-sm hover:shadow-md"
                                    >
                                        <User size={18} />
                                        Full Profile
                                    </button>
                                    <button
                                        onClick={handleViewAnalytics}
                                        className="w-full py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-all flex flex-col items-center justify-center gap-1 shadow-md hover:shadow-lg"
                                    >
                                        <BarChart3 size={18} />
                                        Deep Insights
                                    </button>
                                </div>

                                {user?.role !== 'viewer' && (
                                    <div className="flex gap-2 pt-3 mt-1 border-t border-[var(--md-sys-color-outline)] border-dashed">
                                        <button
                                            onClick={handleStartEdit}
                                            className="flex-1 py-2 bg-transparent text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-[var(--md-sys-color-surface-variant)]"
                                        >
                                            <Edit3 size={14} />
                                            Quick Edit
                                        </button>
                                        {user?.role === 'admin' && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
                                                        onDeleteStudent(selectedStudent.id);
                                                        setSelectedStudent(null);
                                                        showToast('Student deleted successfully', 'success');
                                                    }
                                                }}
                                                className="flex-1 py-2 bg-transparent text-rose-500 hover:text-rose-700 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                )}"""
    )
]

for orig, new in replacements:
    content = content.replace(orig, new)

# add EditStudentModal import
content = content.replace("import PageHeader from './PageHeader';", "import PageHeader from './PageHeader';\nimport EditStudentModal from './EditStudentModal';")

# add EditStudentModal at the bottom, just above AddStudentModal
modal_code = """
            {/* Edit Student Modal */}
            <EditStudentModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                student={selectedStudent}
                onSave={handleSaveEdit}
            />

            {/* Add Student Modal */}
"""
content = content.replace("{/* Add Student Modal */}", modal_code)

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\Students.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
