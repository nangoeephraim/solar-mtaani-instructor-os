import React, { useState } from 'react';
import { AppData, Student, COMPETENCY_LABELS } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line } from 'recharts';
import { User, Award, FileText, Plus, Search, Mail, Phone, Calendar, Trash2, AlertTriangle, TrendingUp, TrendingDown, BarChart3, Activity, Target, ChevronRight, GraduationCap, Zap, Monitor } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import AddStudentModal from './AddStudentModal';
import { useToast } from './Toast';

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
   const [noteInput, setNoteInput] = useState("");
   const [showAddModal, setShowAddModal] = useState(false);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'attendance'>('overview');
   const { showToast } = useToast();

   const filteredStudents = data.students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.lot.includes(searchTerm);
      const matchesSubject = subjectFilter === 'All' || s.subject === subjectFilter;
      return matchesSearch && matchesSubject;
   });

   const selectedStudent = data.students.find(s => s.id === selectedStudentId);

   // Calculate class average for comparison
   const classStudents = data.students.filter(s =>
      selectedStudent && s.subject === selectedStudent.subject && s.grade === selectedStudent.grade
   );

   const getStudentAvg = (student: Student) => {
      const vals = Object.values(student.competencies);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
   };

   const classAverage = classStudents.length > 0
      ? classStudents.reduce((acc, s) => acc + getStudentAvg(s), 0) / classStudents.length
      : 0;

   const studentAverage = selectedStudent ? getStudentAvg(selectedStudent) : 0;
   const performanceVsClass = studentAverage - classAverage;

   // Radar Data Transformation
   const radarData = selectedStudent ? Object.entries(selectedStudent.competencies).map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      student: value,
      classAvg: classStudents.length > 0
         ? classStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classStudents.length
         : 0,
      fullMark: 4
   })) : [];

   // Comparative Bar Data
   const comparisonData = selectedStudent ? Object.entries(selectedStudent.competencies).map(([key, value]) => {
      const classAvgForSkill = classStudents.length > 0
         ? classStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classStudents.length
         : 0;
      return {
         skill: key.substring(0, 10),
         student: value,
         class: parseFloat(classAvgForSkill.toFixed(1))
      };
   }) : [];

   // Attendance Calendar Data (last 30 days simulation)
   const getAttendanceCalendar = () => {
      const days = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
         const date = new Date(today);
         date.setDate(date.getDate() - i);
         const dateStr = date.toISOString().split('T')[0];
         const record = selectedStudent?.attendanceHistory.find(h => h.date === dateStr);
         days.push({
            date: dateStr,
            day: date.getDate(),
            status: record?.status || 'none',
            weekday: date.getDay()
         });
      }
      return days;
   };

   // Progress Timeline (simulated monthly progress)
   const progressData = [
      { month: 'Sep', score: 2.1 },
      { month: 'Oct', score: 2.4 },
      { month: 'Nov', score: 2.8 },
      { month: 'Dec', score: 3.0 },
      { month: 'Jan', score: studentAverage }
   ];

   const handleAddNote = () => {
      if (!selectedStudent || !noteInput.trim()) return;
      const updatedStudent = {
         ...selectedStudent,
         notes: [noteInput, ...selectedStudent.notes]
      };
      onUpdateStudent(updatedStudent, true);
      setNoteInput("");
      showToast('Note added successfully!', 'success');
   };

   const handleDeleteStudent = () => {
      if (!selectedStudent) return;
      onDeleteStudent(selectedStudent.id);
      setShowDeleteConfirm(false);
      const remaining = data.students.filter(s => s.id !== selectedStudent.id);
      setSelectedStudentId(remaining[0]?.id || 0);
   };

   return (
      <div className="h-full flex gap-6 animate-fade-in relative pb-6">

         {/* LEFT: Student List */}
         <div className="w-full md:w-80 lg:w-96 flex flex-col glass-panel overflow-hidden rounded-2xl border border-gray-100">
            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="font-google font-bold text-xl text-gray-800">Student Roster</h2>
                  <button
                     onClick={() => setShowAddModal(true)}
                     className="px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                     <Plus size={16} />
                     Add
                  </button>
               </div>

               {/* Subject Filter Toggle */}
               <div className="flex bg-gray-100 rounded-full p-1 mb-3">
                  {(['All', 'Solar', 'ICT'] as const).map(sub => (
                     <button
                        key={sub}
                        onClick={() => setSubjectFilter(sub)}
                        className={clsx(
                           "flex-1 py-2 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1",
                           subjectFilter === sub ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                     >
                        {sub === 'Solar' && <Zap size={12} />}
                        {sub === 'ICT' && <Monitor size={12} />}
                        {sub}
                     </button>
                  ))}
               </div>

               <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input
                     type="text"
                     placeholder="Search students..."
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 placeholder-gray-500 transition-all"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
               {filteredStudents.map(student => {
                  const avg = getStudentAvg(student);
                  const isAtRisk = avg < 2.5 || student.attendancePct < 80;
                  return (
                     <button
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        className={clsx(
                           "w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group border",
                           selectedStudentId === student.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                              : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-sm text-gray-700"
                        )}
                     >
                        <div className={clsx(
                           "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                           selectedStudentId === student.id
                              ? "bg-white/20 text-white"
                              : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        )}>
                           {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="font-bold text-sm leading-tight truncate">{student.name}</h4>
                           <p className={clsx("text-xs mt-0.5 flex items-center gap-1",
                              selectedStudentId === student.id ? "text-blue-100" : "text-gray-500"
                           )}>
                              {student.subject === 'Solar' ? <Zap size={10} /> : <Monitor size={10} />}
                              {student.subject} • Grade {student.grade}
                           </p>
                        </div>
                        {isAtRisk && selectedStudentId !== student.id && (
                           <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Needs attention" />
                        )}
                        <ChevronRight size={16} className={clsx(
                           "flex-shrink-0 transition-transform",
                           selectedStudentId === student.id ? "text-white" : "text-gray-300 group-hover:text-gray-400"
                        )} />
                     </button>
                  );
               })}
               {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                     <User size={32} className="mx-auto mb-2 opacity-40" />
                     <p className="text-sm">No students found</p>
                  </div>
               )}
            </div>
         </div>

         {/* RIGHT: Detailed Profile */}
         <div className="flex-1 glass-panel overflow-hidden flex flex-col rounded-2xl border border-gray-100">
            {selectedStudent ? (
               <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-white to-gray-50 p-6 border-b border-gray-100">
                     <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                        <div className="flex items-center gap-5">
                           <motion.div
                              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-blue-500/30"
                              whileHover={{ scale: 1.05, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 400 }}
                           >
                              {selectedStudent.name.charAt(0)}
                           </motion.div>
                           <div>
                              <div className="flex items-center gap-2 mb-2">
                                 <span className={clsx(
                                    "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                                    selectedStudent.subject === 'Solar'
                                       ? "bg-yellow-100 text-yellow-800"
                                       : "bg-blue-100 text-blue-800"
                                 )}>
                                    {selectedStudent.subject === 'Solar' ? <Zap size={12} /> : <Monitor size={12} />}
                                    {selectedStudent.subject}
                                 </span>
                                 <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                                    Grade {selectedStudent.grade}
                                 </span>
                              </div>
                              <h1 className="text-2xl font-google font-bold text-gray-900">{selectedStudent.name}</h1>
                              <p className="text-gray-500 text-sm mt-1 flex items-center gap-3">
                                 <span>Lot {selectedStudent.lot}</span>
                                 <span>•</span>
                                 <span>ID #{selectedStudent.id.toString().padStart(4, '0')}</span>
                              </p>
                           </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-3 flex-wrap">
                           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center min-w-[90px]">
                              <span className={clsx(
                                 "block text-2xl font-bold",
                                 selectedStudent.attendancePct >= 85 ? "text-green-600" :
                                    selectedStudent.attendancePct >= 70 ? "text-orange-500" : "text-red-500"
                              )}>
                                 {selectedStudent.attendancePct}%
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attendance</span>
                           </div>
                           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center min-w-[90px]">
                              <span className="block text-2xl font-bold text-blue-600">
                                 {studentAverage.toFixed(1)}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg Score</span>
                           </div>
                           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center min-w-[90px]">
                              <div className="flex items-center justify-center gap-1">
                                 {performanceVsClass >= 0 ? (
                                    <TrendingUp size={18} className="text-green-500" />
                                 ) : (
                                    <TrendingDown size={18} className="text-red-500" />
                                 )}
                                 <span className={clsx(
                                    "text-xl font-bold",
                                    performanceVsClass >= 0 ? "text-green-600" : "text-red-500"
                                 )}>
                                    {performanceVsClass >= 0 ? '+' : ''}{performanceVsClass.toFixed(1)}
                                 </span>
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">vs Class</span>
                           </div>
                           <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-100 transition-colors"
                              title="Delete Student"
                           >
                              <Trash2 size={20} />
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-100 bg-white">
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
                                 ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                                 : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                           )}
                        >
                           <tab.icon size={16} />
                           {tab.label}
                        </button>
                     ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                     {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                           {/* Competency Radar */}
                           <div className="glass-card p-5 rounded-xl border border-gray-100">
                              <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                 <Award className="text-blue-500" size={18} />
                                 Competency Profile
                              </h3>
                              <div className="h-56">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                       <PolarGrid stroke="#e5e7eb" />
                                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                       <PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                                       <Radar name="Student" dataKey="student" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                       <Radar name="Class Avg" dataKey="classAvg" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeDasharray="5 5" />
                                    </RadarChart>
                                 </ResponsiveContainer>
                              </div>
                              <div className="flex justify-center gap-6 mt-2 text-xs">
                                 <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Student</span>
                                 <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 opacity-50"></span> Class Avg</span>
                              </div>
                           </div>

                           {/* Instructor Notes */}
                           <div className="glass-card p-5 rounded-xl border border-gray-100 flex flex-col">
                              <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                 <FileText className="text-blue-500" size={18} />
                                 Instructor Notes
                              </h3>
                              <div className="flex gap-2 mb-4">
                                 <input
                                    type="text"
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder-gray-400"
                                    placeholder="Add a note..."
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                 />
                                 <button
                                    onClick={handleAddNote}
                                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                                 >
                                    <Plus size={18} />
                                 </button>
                              </div>
                              <div className="flex-1 overflow-y-auto space-y-2 max-h-48 custom-scrollbar">
                                 {selectedStudent.notes.length > 0 ? (
                                    selectedStudent.notes.map((note, i) => (
                                       <div key={i} className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-sm text-gray-700">
                                          {note}
                                       </div>
                                    ))
                                 ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                       <FileText size={24} className="mb-2 opacity-40" />
                                       <p className="text-xs">No notes yet</p>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Progress Timeline */}
                           <div className="glass-card p-5 rounded-xl border border-gray-100 lg:col-span-2">
                              <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                 <Activity className="text-blue-500" size={18} />
                                 Progress Timeline
                              </h3>
                              <div className="h-48">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressData}>
                                       <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                       <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                       <YAxis domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                       <Tooltip
                                          contentStyle={{
                                             background: 'white',
                                             border: '1px solid #e5e7eb',
                                             borderRadius: '8px'
                                          }}
                                       />
                                       <Line
                                          type="monotone"
                                          dataKey="score"
                                          stroke="#3b82f6"
                                          strokeWidth={3}
                                          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                                          activeDot={{ r: 7, fill: '#3b82f6' }}
                                       />
                                    </LineChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'analytics' && (
                        <div className="space-y-6 animate-fade-in">
                           {/* Comparative Analysis */}
                           <div className="glass-card p-5 rounded-xl border border-gray-100">
                              <h3 className="font-google font-bold text-gray-800 flex items-center gap-2 mb-4">
                                 <Target className="text-blue-500" size={18} />
                                 Competency vs Class Average
                              </h3>
                              <div className="h-64">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} layout="vertical">
                                       <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                       <XAxis type="number" domain={[0, 4]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                       <YAxis type="category" dataKey="skill" tick={{ fill: '#6b7280', fontSize: 11 }} width={80} />
                                       <Tooltip
                                          contentStyle={{
                                             background: 'white',
                                             border: '1px solid #e5e7eb',
                                             borderRadius: '8px'
                                          }}
                                       />
                                       <Bar dataKey="student" name="Student" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                       <Bar dataKey="class" name="Class Avg" fill="#10b981" radius={[0, 4, 4, 0]} opacity={0.6} />
                                    </BarChart>
                                 </ResponsiveContainer>
                              </div>
                              <div className="flex justify-center gap-6 mt-4 text-xs">
                                 <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500"></span> {selectedStudent.name}</span>
                                 <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500 opacity-60"></span> Class Average</span>
                              </div>
                           </div>

                           {/* Skill Breakdown */}
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {Object.entries(selectedStudent.competencies).map(([key, value]) => {
                                 const classAvgForSkill = classStudents.length > 0
                                    ? classStudents.reduce((acc, s) => acc + (s.competencies[key] || 0), 0) / classStudents.length
                                    : 0;
                                 const diff = value - classAvgForSkill;
                                 return (
                                    <div key={key} className="bg-white p-4 rounded-xl border border-gray-100">
                                       <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{key}</p>
                                       <div className="flex items-end justify-between">
                                          <span className="text-2xl font-bold text-gray-900">{value}</span>
                                          <span className={clsx(
                                             "text-xs font-bold px-2 py-0.5 rounded-full",
                                             diff >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                          )}>
                                             {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                                          </span>
                                       </div>
                                       <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                             className="h-full bg-blue-500 rounded-full transition-all"
                                             style={{ width: `${(value / 4) * 100}%` }}
                                          />
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}

                     {activeTab === 'attendance' && (
                        <div className="space-y-6 animate-fade-in">
                           {/* Attendance Stats */}
                           <div className="grid grid-cols-3 gap-4">
                              <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                                 <span className="block text-3xl font-bold text-green-600">
                                    {selectedStudent.attendanceHistory.filter(h => h.status === 'present').length}
                                 </span>
                                 <span className="text-xs font-bold text-green-700 uppercase">Present</span>
                              </div>
                              <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                                 <span className="block text-3xl font-bold text-red-500">
                                    {selectedStudent.attendanceHistory.filter(h => h.status === 'absent').length}
                                 </span>
                                 <span className="text-xs font-bold text-red-700 uppercase">Absent</span>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                                 <span className="block text-3xl font-bold text-blue-600">
                                    {selectedStudent.attendancePct}%
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
                                 {getAttendanceCalendar().map((day, i) => (
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
                                 <span>student@solarmtaani.org</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                 <Phone size={16} className="text-gray-400" />
                                 <span>+254 700 000 000</span>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                     <GraduationCap size={40} className="opacity-40" />
                  </div>
                  <h3 className="text-xl font-google font-bold text-gray-600">No Student Selected</h3>
                  <p className="max-w-xs mt-2 text-gray-500">Select a student from the roster to view their profile and performance analytics.</p>
                  <button
                     onClick={() => setShowAddModal(true)}
                     className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-full font-bold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                     <Plus size={16} />
                     Add Student
                  </button>
               </div>
            )}
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
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in p-6">
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                     <AlertTriangle size={24} />
                     <h3 className="font-google font-bold text-lg">Delete Student</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">
                     Are you sure you want to delete <strong>{selectedStudent.name}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                     <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
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
   );
};

export default StudentProfile;