
import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { AppData, Student } from '../types';
import PageTransition from './PageTransition';
import PageHeader from './PageHeader';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import { useToast } from './Toast';
import { GraduationCap, Plus, AlertTriangle, User, BookOpen, FileText, CreditCard, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';

// Lazy load sub-components for better performance (splitting large charts code)
const StudentList = lazy(() => import('./student-profile/StudentList').then(module => ({ default: module.StudentList })));
const ProfileHeader = lazy(() => import('./student-profile/ProfileHeader').then(module => ({ default: module.ProfileHeader })));
const OverviewTab = lazy(() => import('./student-profile/OverviewTab').then(module => ({ default: module.OverviewTab })));
const AnalyticsTab = lazy(() => import('./student-profile/AnalyticsTab').then(module => ({ default: module.AnalyticsTab })));
const AttendanceTab = lazy(() => import('./student-profile/AttendanceTab').then(module => ({ default: module.AttendanceTab })));
const BillingTab = lazy(() => import('./student-profile/BillingTab').then(module => ({ default: module.BillingTab })));

interface StudentProfileProps {
   data: AppData;
   onUpdateStudent: (student: Student, notify?: boolean) => void;
   onAddStudent: (student: Omit<Student, 'id'>) => void;
   onDeleteStudent: (studentId: number) => void;
   selectedStudentId?: number;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ data, onUpdateStudent, onAddStudent, onDeleteStudent, selectedStudentId: externalStudentId }) => {
   const [selectedStudentId, setSelectedStudentId] = useState<number>(externalStudentId || data.students[0]?.id || 0);
   const [mobileShowDetail, setMobileShowDetail] = useState(!!externalStudentId);
   const [searchTerm, setSearchTerm] = useState("");
   const [subjectFilter, setSubjectFilter] = useState<string>('All');
   const [showAddModal, setShowAddModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'attendance' | 'billing'>('overview');
   const { showToast } = useToast();

   const selectedStudent = useMemo(() =>
      data.students.find(s => s.id === selectedStudentId),
      [data.students, selectedStudentId]);

    React.useEffect(() => {
       if (externalStudentId) {
          setSelectedStudentId(externalStudentId);
          setMobileShowDetail(true);
       }
    }, [externalStudentId]);

   React.useEffect(() => {
      const handleBackButton = (e: Event) => {
         if (showAddModal) {
            e.preventDefault();
            setShowAddModal(false);
         } else if (showEditModal) {
            e.preventDefault();
            setShowEditModal(false);
         } else if (showDeleteConfirm) {
            e.preventDefault();
            setShowDeleteConfirm(false);
         } else if (mobileShowDetail) {
            e.preventDefault();
            setMobileShowDetail(false);
         }
      };
      window.addEventListener('app-back-button', handleBackButton);
      return () => window.removeEventListener('app-back-button', handleBackButton);
   }, [mobileShowDetail, showAddModal, showEditModal, showDeleteConfirm]);

   // Calculate class average for comparison
   const classStudents = useMemo(() => {
      if (!selectedStudent) return [];
      return data.students.filter(s =>
         s.subject === selectedStudent.subject && s.grade === selectedStudent.grade
      );
   }, [data.students, selectedStudent]);

   const getStudentAvg = useCallback((student: Student) => {
      const vals = Object.values(student.competencies);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
   }, []);

   const studentAverage = useMemo(() =>
      selectedStudent ? getStudentAvg(selectedStudent) : 0,
      [selectedStudent, getStudentAvg]);

   const classAverage = useMemo(() =>
      classStudents.length > 0
         ? classStudents.reduce((acc, s) => acc + getStudentAvg(s), 0) / classStudents.length
         : 0,
      [classStudents, getStudentAvg]);

   const performanceVsClass = studentAverage - classAverage;

   const handleAddNote = useCallback((note: string) => {
      if (!selectedStudent || !note.trim()) return;
      const updatedStudent = {
         ...selectedStudent,
         notes: [note, ...selectedStudent.notes]
      };
      onUpdateStudent(updatedStudent, true);
      showToast('Note added successfully!', 'success');
   }, [selectedStudent, onUpdateStudent, showToast]);

   const handleDeleteStudent = useCallback(() => {
      if (!selectedStudent) return;
      onDeleteStudent(selectedStudent.id);
      setShowDeleteConfirm(false);
      const remaining = data.students.filter(s => s.id !== selectedStudent.id);
      setSelectedStudentId(remaining[0]?.id || 0);
   }, [selectedStudent, onDeleteStudent, data.students]);

   const handleAddStudentClick = useCallback(() => setShowAddModal(true), []);
   const handleDeleteRequest = useCallback(() => setShowDeleteConfirm(true), []);

   return (
      <PageTransition>
         <div className="h-full flex flex-col font-sans">
            {/* Dossier Header Area */}
            <div className="relative mb-6 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-900/30 overflow-hidden p-6 md:p-8">
                {/* Subtle animated pattern */}
                <div className="absolute inset-0 opacity-20 dark:opacity-10 mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 dark:via-black/50 to-transparent -translate-x-full" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border border-indigo-100 dark:border-indigo-900/30 bg-white/80 dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-400">
                           <GraduationCap size={24} />
                        </div>
                        <div>
                           <h1 className="text-2xl font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2">
                              Student Profiles <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] rounded uppercase tracking-widest font-bold">CRM</span>
                           </h1>
                           <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-0.5">
                              Manage rosters and analyze administrative records
                           </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                           onClick={handleAddStudentClick}
                           className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                           <Plus size={16} /> Add Record
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-2 border border-slate-100 dark:border-slate-800">
               {/* LEFT: Student List */}
               <div className={clsx(
                  "w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col h-full",
                  mobileShowDetail ? "hidden md:flex" : "flex"
               )}>
                  <Suspense fallback={<div className="w-full md:w-80 lg:w-96 glass-panel animate-pulse" />}>
                     <StudentList
                        students={data.students}
                        selectedStudentId={selectedStudentId}
                        onSelectStudent={(id) => {
                           setSelectedStudentId(id);
                           setMobileShowDetail(true);
                        }}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        subjectFilter={subjectFilter}
                        onFilterChange={setSubjectFilter}
                        onAddStudent={handleAddStudentClick}
                     />
                  </Suspense>
               </div>

               {/* RIGHT: Detailed Profile */}
               <div className={clsx(
                  "flex-1 glass-panel backdrop-blur-md bg-[var(--md-sys-color-surface)]/80 overflow-hidden flex flex-col rounded-2xl border border-[var(--md-sys-color-outline)] shadow-lg shadow-slate-200/20 dark:shadow-none",
                  mobileShowDetail ? "flex" : "hidden md:flex"
               )}>
                  <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                     {selectedStudent ? (
                        <>
                           {/* Header */}
                           {mobileShowDetail && (
                              <div className="md:hidden p-3 bg-[var(--md-sys-color-surface-variant)]/50 border-b border-[var(--md-sys-color-outline)] flex items-center flex-shrink-0">
                                 <button
                                    onClick={() => setMobileShowDetail(false)}
                                    className="flex items-center gap-2 text-sm font-bold text-[var(--md-sys-color-primary)] active:scale-95 transition-all"
                                 >
                                    <ArrowLeft size={16} /> Back to Roster
                                 </button>
                              </div>
                           )}
                           <ProfileHeader
                              student={selectedStudent}
                              studentAverage={studentAverage}
                              performanceVsClass={performanceVsClass}
                              onDeleteRequest={handleDeleteRequest}
                              onEditRequest={() => setShowEditModal(true)}
                           />

                           {/* Tab Navigation */}
                           <div className="flex border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/30 p-1.5 gap-1">
                              {[
                                 { id: 'overview', label: 'General Info', icon: User },
                                 { id: 'analytics', label: 'Academic History', icon: BookOpen },
                                 { id: 'attendance', label: 'Behavior & Notes', icon: FileText },
                                 { id: 'billing', label: 'Billing', icon: CreditCard }
                              ].map(tab => (
                                 <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={clsx(
                                       "flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all rounded-lg flex items-center justify-center gap-2 active:scale-[0.98]",
                                       activeTab === tab.id
                                          ? "glass-card bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] shadow-sm"
                                          : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-white/5"
                                    )}
                                 >
                                    <tab.icon size={16} />
                                    {tab.label}
                                 </button>
                              ))}
                           </div>

                           {/* Tab Content */}
                           <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                              <Suspense fallback={<div className="h-64 flex items-center justify-center text-gray-400">Loading tab...</div>}>
                                 {activeTab === 'overview' && (
                                    <OverviewTab
                                       student={selectedStudent}
                                       classAvgStudents={classStudents}
                                       onAddNote={handleAddNote}
                                       studentAverage={studentAverage}
                                    />
                                 )}

                                 {activeTab === 'analytics' && (
                                    <AnalyticsTab
                                       student={selectedStudent}
                                       classAvgStudents={classStudents}
                                    />
                                 )}

                                 {activeTab === 'attendance' && (
                                    <AttendanceTab student={selectedStudent} onAddNote={handleAddNote} />
                                 )}

                                 {activeTab === 'billing' && (
                                    <BillingTab student={selectedStudent} />
                                 )}
                              </Suspense>
                           </div>
                        </>
                     ) : data.students.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] p-10 text-center">
                           <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/40 dark:to-violet-900/40 rounded-2xl flex items-center justify-center mb-5">
                              <GraduationCap size={36} className="text-blue-600 dark:text-blue-400" />
                           </div>
                           <h3 className="text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] mb-2">Welcome to Student Profiles</h3>
                           <p className="max-w-sm text-sm text-[var(--md-sys-color-secondary)] mb-6">Start by adding your first student to unlock performance tracking, competency analytics, and attendance management.</p>
                           <div className="flex flex-col gap-2 mb-6 text-left max-w-xs">
                              <div className="flex items-center gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</span><span className="text-[var(--md-sys-color-on-surface-variant)]">Add students with their details</span></div>
                              <div className="flex items-center gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">2</span><span className="text-[var(--md-sys-color-on-surface-variant)]">Track competencies and attendance</span></div>
                              <div className="flex items-center gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">3</span><span className="text-[var(--md-sys-color-on-surface-variant)]">View analytics and generate reports</span></div>
                           </div>
                           <button
                              onClick={handleAddStudentClick}
                              className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                           >
                              <Plus size={16} />
                              Add First Student
                           </button>
                        </div>
                     ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[var(--md-sys-color-on-surface-variant)] p-10 text-center">
                           <div className="w-24 h-24 bg-[var(--md-sys-color-surface-variant)] rounded-full flex items-center justify-center mb-4">
                              <GraduationCap size={40} className="opacity-40" />
                           </div>
                           <h3 className="text-xl font-google font-bold text-[var(--md-sys-color-on-surface)]">No Student Selected</h3>
                           <p className="max-w-xs mt-2 text-[var(--md-sys-color-secondary)]">Select a student from the roster to view their profile and performance analytics.</p>
                           <button
                              onClick={handleAddStudentClick}
                              className="mt-6 px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-full font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                           >
                              <Plus size={16} />
                              Add Student
                           </button>
                        </div>
                     )}
                  </Suspense>
               </div>

               {/* Add Student Modal */}
               <AddStudentModal
                  isOpen={showAddModal}
                  onClose={() => setShowAddModal(false)}
                  onAdd={onAddStudent}
               />

               {/* Edit Student Modal */}
               <EditStudentModal
                  isOpen={showEditModal}
                  onClose={() => setShowEditModal(false)}
                  student={selectedStudent || null}
                  onSave={(updated) => {
                     onUpdateStudent(updated, true);
                     setShowEditModal(false);
                  }}
               />

               {/* Delete Confirmation Modal */}
               {showDeleteConfirm && selectedStudent && (
                  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                     <div className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in p-6">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                           <AlertTriangle size={24} />
                           <h3 className="font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]">Delete Student</h3>
                        </div>
                        <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm mb-6">
                           Are you sure you want to delete <strong>{selectedStudent.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                           <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:opacity-80 transition-colors"
                           >
                              Cancel
                           </button>
                           <button
                              onClick={handleDeleteStudent}
                              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                           >
                              Delete
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </PageTransition>
   );
};

export default StudentProfile;