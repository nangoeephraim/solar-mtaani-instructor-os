
import React, { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { AppData, Student } from '../types';
import PageTransition from './PageTransition';
import PageHeader from './PageHeader';
import AddStudentModal from './AddStudentModal';
import { useToast } from './Toast';
import { GraduationCap, Plus, AlertTriangle, User, BarChart3, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { AnimatePresence } from 'framer-motion';

// Lazy load sub-components for better performance (splitting large charts code)
const StudentList = lazy(() => import('./student-profile/StudentList').then(module => ({ default: module.StudentList })));
const ProfileHeader = lazy(() => import('./student-profile/ProfileHeader').then(module => ({ default: module.ProfileHeader })));
const OverviewTab = lazy(() => import('./student-profile/OverviewTab').then(module => ({ default: module.OverviewTab })));
const AnalyticsTab = lazy(() => import('./student-profile/AnalyticsTab').then(module => ({ default: module.AnalyticsTab })));
const AttendanceTab = lazy(() => import('./student-profile/AttendanceTab').then(module => ({ default: module.AttendanceTab })));

interface StudentProfileProps {
   data: AppData;
   onUpdateStudent: (student: Student, notify?: boolean) => void;
   onAddStudent: (student: Omit<Student, 'id'>) => void;
   onDeleteStudent: (studentId: number) => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ data, onUpdateStudent, onAddStudent, onDeleteStudent }) => {
   const [selectedStudentId, setSelectedStudentId] = useState<number>(data.students[0]?.id || 0);
   const [searchTerm, setSearchTerm] = useState("");
   const [subjectFilter, setSubjectFilter] = useState<'All' | 'Solar' | 'ICT'>('All');
   const [showAddModal, setShowAddModal] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'attendance'>('overview');
   const { showToast } = useToast();

   const selectedStudent = useMemo(() =>
      data.students.find(s => s.id === selectedStudentId),
      [data.students, selectedStudentId]);

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
         <div className="h-full flex flex-col font-sans mb-4">
            <PageHeader
               title="Student Profiles"
               subtitle="Manage rosters and analyze individual performance"
               icon={GraduationCap}
               color="text-blue-600"
               action={
                  <div className="flex gap-2">
                     <button
                        onClick={handleAddStudentClick}
                        className="px-4 py-2 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 transition-all flex items-center gap-2"
                     >
                        <Plus size={18} /> Add Student
                     </button>
                  </div>
               }
            />

            <div className="flex-1 flex gap-6 min-h-0">
               {/* LEFT: Student List */}
               <Suspense fallback={<div className="w-96 glass-panel animate-pulse" />}>
                  <StudentList
                     students={data.students}
                     selectedStudentId={selectedStudentId}
                     onSelectStudent={setSelectedStudentId}
                     searchTerm={searchTerm}
                     onSearchChange={setSearchTerm}
                     subjectFilter={subjectFilter}
                     onFilterChange={setSubjectFilter}
                     onAddStudent={handleAddStudentClick}
                  />
               </Suspense>

               {/* RIGHT: Detailed Profile */}
               <div className="flex-1 glass-panel overflow-hidden flex flex-col rounded-2xl border border-[var(--md-sys-color-outline)]">
                  <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                     {selectedStudent ? (
                        <>
                           {/* Header */}
                           <ProfileHeader
                              student={selectedStudent}
                              studentAverage={studentAverage}
                              performanceVsClass={performanceVsClass}
                              onDeleteRequest={handleDeleteRequest}
                           />

                           {/* Tab Navigation */}
                           <div className="flex border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]">
                              {[
                                 { id: 'overview', label: 'Overview', icon: User },
                                 { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                                 { id: 'attendance', label: 'Attendance', icon: Calendar }
                              ].map(tab => (
                                 <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={clsx(
                                       "flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2",
                                       activeTab === tab.id
                                          ? "text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/30"
                                          : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]"
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
                                    <AttendanceTab student={selectedStudent} />
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