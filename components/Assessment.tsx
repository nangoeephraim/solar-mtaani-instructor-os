import React, { useState } from 'react';
import { AppData, Student, CompetencyLevel, COMPETENCY_LABELS } from '../types';
import { Check, ChevronRight, ClipboardList, UserCheck, UserX, BookOpen, Zap, Monitor, Award, CheckCircle2, XCircle, BarChart3, GraduationCap } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface AssessmentProps {
   data: AppData;
   onUpdateStudent: (student: Student) => void;
}

// NITA Solar PV Installer II Competencies (KNQF Level 3)
const SOLAR_COMPETENCIES = {
   siteAssessment: {
      name: 'Site Assessment',
      description: 'Energy audits, load analysis, site surveys',
      outcomes: ['Conduct site surveys', 'Perform energy audits', 'Calculate load requirements', 'Assess roof/ground suitability']
   },
   panelInstallation: {
      name: 'Panel Installation',
      description: 'Mounting, orientation, connection modes',
      outcomes: ['Mount solar panels correctly', 'Optimize panel orientation', 'Connect panels in series/parallel', 'Secure mounting structures']
   },
   electricalWiring: {
      name: 'Electrical Wiring',
      description: 'Cable specs, voltage drop, safety protocols',
      outcomes: ['Select appropriate cables', 'Calculate voltage drop', 'Install wiring safely', 'Connect to distribution board']
   },
   systemTesting: {
      name: 'System Testing',
      description: 'Commissioning, troubleshooting, maintenance',
      outcomes: ['Commission PV systems', 'Use multimeter for testing', 'Troubleshoot common faults', 'Perform routine maintenance']
   },
   batterySetup: {
      name: 'Battery Setup',
      description: 'Technologies, installation, connection',
      outcomes: ['Identify battery types', 'Install batteries safely', 'Connect charge controllers', 'Configure inverter settings']
   },
   safetyProtocols: {
      name: 'Safety Protocols',
      description: 'PPE usage, electrical safety, first aid',
      outcomes: ['Use appropriate PPE', 'Follow electrical safety rules', 'Handle emergencies', 'Maintain safe work environment']
   }
};

// KICD Computer Studies - MS Office Path
const ICT_COMPETENCIES = {
   msWord: {
      name: 'Microsoft Word',
      description: 'Document formatting, tables, mail merge',
      outcomes: ['Format documents professionally', 'Create and edit tables', 'Perform mail merge', 'Insert headers/footers/graphics']
   },
   msExcel: {
      name: 'Microsoft Excel',
      description: 'Formulas, functions, charts, data management',
      outcomes: ['Create and edit worksheets', 'Apply formulas and functions', 'Use cell referencing', 'Create charts and graphs']
   },
   msPowerPoint: {
      name: 'Microsoft PowerPoint',
      description: 'Presentations, transitions, animations',
      outcomes: ['Design professional slides', 'Apply transitions/animations', 'Insert multimedia content', 'Present effectively']
   },
   msAccess: {
      name: 'Microsoft Access',
      description: 'Database creation, queries, reports',
      outcomes: ['Create database tables', 'Design forms', 'Write basic queries', 'Generate reports']
   },
   computerBasics: {
      name: 'Computer Basics',
      description: 'Hardware, OS, file management',
      outcomes: ['Identify hardware components', 'Navigate operating system', 'Manage files and folders', 'Install basic software']
   },
   typingSpeed: {
      name: 'Typing Speed',
      description: 'Keyboarding proficiency',
      outcomes: ['Type with proper technique', 'Achieve 30+ WPM', 'Maintain accuracy', 'Use keyboard shortcuts']
   }
};

// Practical Skills Checklists
const SOLAR_PRACTICAL = [
   { id: 'wiring', label: 'Wire solar panel connections correctly', category: 'Electrical' },
   { id: 'mounting', label: 'Mount panels at correct angle', category: 'Installation' },
   { id: 'inverter', label: 'Configure inverter settings', category: 'System' },
   { id: 'safety', label: 'Use PPE throughout installation', category: 'Safety' },
   { id: 'testing', label: 'Test system with multimeter', category: 'Testing' },
   { id: 'battery', label: 'Connect battery bank safely', category: 'Storage' }
];

const ICT_PRACTICAL = [
   { id: 'document', label: 'Format a business letter in Word', category: 'Word' },
   { id: 'formula', label: 'Create SUM/AVERAGE formulas in Excel', category: 'Excel' },
   { id: 'chart', label: 'Generate chart from data in Excel', category: 'Excel' },
   { id: 'presentation', label: 'Design 5-slide presentation', category: 'PowerPoint' },
   { id: 'database', label: 'Create table and run query in Access', category: 'Access' },
   { id: 'typing', label: 'Complete typing test (30+ WPM)', category: 'Typing' }
];

const LEVEL_COLORS = {
   1: 'bg-red-100 border-red-300 text-red-800',
   2: 'bg-orange-100 border-orange-300 text-orange-800',
   3: 'bg-blue-100 border-blue-300 text-blue-800',
   4: 'bg-green-100 border-green-300 text-green-800'
};

const Assessment: React.FC<AssessmentProps> = ({ data, onUpdateStudent }) => {
   const [selectedGrade, setSelectedGrade] = useState<number>(5);
   const [selectedSubject, setSelectedSubject] = useState<'Solar' | 'ICT'>('Solar');
   const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
   const [activeCompetency, setActiveCompetency] = useState<string | null>(null);
   const [assessmentMode, setAssessmentMode] = useState<'theory' | 'practical'>('theory');
   const [practicalChecks, setPracticalChecks] = useState<Record<string, boolean>>({});

   const studentsInClass = data.students.filter(s => s.grade === selectedGrade && s.subject === selectedSubject);
   const selectedStudent = data.students.find(s => s.id === selectedStudentId);

   const competencies = selectedSubject === 'Solar' ? SOLAR_COMPETENCIES : ICT_COMPETENCIES;
   const practicalSkills = selectedSubject === 'Solar' ? SOLAR_PRACTICAL : ICT_PRACTICAL;
   const activeCompetencyData = activeCompetency ? competencies[activeCompetency as keyof typeof competencies] : null;

   const handleGradeChange = (key: string, value: CompetencyLevel) => {
      if (!selectedStudent) return;
      const updatedStudent = {
         ...selectedStudent,
         competencies: {
            ...selectedStudent.competencies,
            [key]: value
         }
      };
      onUpdateStudent(updatedStudent);
   };

   const handleAttendance = (status: 'present' | 'absent') => {
      if (!selectedStudent) return;
      const today = new Date().toISOString().split('T')[0];
      const existingIndex = selectedStudent.attendanceHistory.findIndex(r => r.date === today && !r.slotId);

      let newHistory = [...selectedStudent.attendanceHistory];
      const record = { date: today, status };

      if (existingIndex >= 0) {
         newHistory[existingIndex] = { ...newHistory[existingIndex], status };
      } else {
         newHistory.push(record);
      }

      const presentCount = newHistory.filter(h => h.status === 'present').length;
      const newPct = newHistory.length > 0 ? Math.round((presentCount / newHistory.length) * 100) : selectedStudent.attendancePct;

      onUpdateStudent({
         ...selectedStudent,
         attendanceHistory: newHistory,
         attendancePct: newPct
      });
   };

   const togglePracticalCheck = (id: string) => {
      setPracticalChecks(prev => ({ ...prev, [id]: !prev[id] }));
   };

   const todayRecord = selectedStudent?.attendanceHistory.find(h => h.date === new Date().toISOString().split('T')[0] && !h.slotId);
   const completedPracticals = Object.values(practicalChecks).filter(Boolean).length;

   return (
      <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-10">

         {/* Header - Google Style */}
         <div className="glass-panel p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-4">
                  <motion.div
                     className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20"
                     whileHover={{ scale: 1.05, rotate: 5 }}
                     transition={{ type: "spring", stiffness: 400 }}
                  >
                     <GraduationCap size={28} className="text-white" />
                  </motion.div>
                  <div>
                     <h1 className="text-2xl font-google font-bold text-gray-900 flex items-center gap-2">
                        {selectedSubject === 'Solar' ? 'NITA' : 'KICD'} Competency Assessment
                     </h1>
                     <p className="text-gray-500 text-sm mt-0.5">
                        {selectedSubject === 'Solar'
                           ? 'Solar PV Installer II • KNQF Level 3 • Industrial Training Act Cap 237'
                           : 'Computer Studies • CBC Secondary • MS Office Path'}
                     </p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <div className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                     <Award size={14} />
                     Official Record
                  </div>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-3 space-y-4">
               {/* Subject Toggle */}
               <div className="glass-panel p-4 rounded-xl bg-white border border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Program / Trade</label>
                  <div className="flex bg-gray-100 rounded-full p-1">
                     {(['Solar', 'ICT'] as const).map(sub => (
                        <button
                           key={sub}
                           onClick={() => { setSelectedSubject(sub); setSelectedStudentId(null); setActiveCompetency(null); }}
                           className={clsx(
                              "flex-1 py-2.5 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2",
                              selectedSubject === sub ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                           )}
                        >
                           {sub === 'Solar' ? <Zap size={16} /> : <Monitor size={16} />}
                           {sub}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Grade Selector */}
               <div className="glass-panel p-4 rounded-xl bg-white border border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Grade Level</label>
                  <div className="grid grid-cols-5 gap-2">
                     {[5, 6, 7, 8, 9].map(g => (
                        <button
                           key={g}
                           onClick={() => { setSelectedGrade(g); setSelectedStudentId(null); }}
                           className={clsx(
                              "py-2 rounded-lg text-sm font-bold transition-all",
                              selectedGrade === g
                                 ? "bg-blue-600 text-white shadow-md"
                                 : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                           )}
                        >
                           {g}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Student List */}
               <div className="glass-panel p-4 rounded-xl bg-white border border-gray-100">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">
                     Select Candidate ({studentsInClass.length})
                  </label>
                  <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                     {studentsInClass.map(s => (
                        <button
                           key={s.id}
                           onClick={() => { setSelectedStudentId(s.id); setActiveCompetency(null); setPracticalChecks({}); }}
                           className={clsx(
                              "w-full text-left p-3 rounded-xl border transition-all text-sm font-medium flex justify-between items-center group",
                              selectedStudentId === s.id
                                 ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                 : "bg-white border-gray-100 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50"
                           )}
                        >
                           <span>{s.name}</span>
                           {selectedStudentId === s.id && <Check size={16} />}
                        </button>
                     ))}
                     {studentsInClass.length === 0 && (
                        <p className="text-sm text-gray-400 italic text-center py-4">No students found</p>
                     )}
                  </div>
               </div>
            </div>

            {/* Main Assessment Area */}
            <div className="lg:col-span-9">
               {selectedStudent ? (
                  <div className="glass-panel rounded-2xl overflow-hidden bg-white border border-gray-100">
                     {/* Student Header */}
                     <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                              {selectedStudent.name.charAt(0)}
                           </div>
                           <div>
                              <h2 className="text-xl font-google font-bold text-gray-900">{selectedStudent.name}</h2>
                              <p className="text-sm text-gray-500">Lot {selectedStudent.lot} • ID #{selectedStudent.id} • Grade {selectedStudent.grade}</p>
                           </div>
                        </div>

                        {/* Attendance Quick Action */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded-full border border-gray-100 shadow-sm">
                           <span className="text-xs font-bold text-gray-400 uppercase px-3">Today:</span>
                           <button
                              onClick={() => handleAttendance('present')}
                              className={clsx(
                                 "p-2.5 rounded-full transition-all",
                                 todayRecord?.status === 'present'
                                    ? "bg-green-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
                              )}
                           >
                              <UserCheck size={18} />
                           </button>
                           <button
                              onClick={() => handleAttendance('absent')}
                              className={clsx(
                                 "p-2.5 rounded-full transition-all",
                                 todayRecord?.status === 'absent'
                                    ? "bg-red-500 text-white shadow-md"
                                    : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              )}
                           >
                              <UserX size={18} />
                           </button>
                        </div>
                     </div>

                     {/* Assessment Mode Tabs */}
                     <div className="flex border-b border-gray-100">
                        <button
                           onClick={() => setAssessmentMode('theory')}
                           className={clsx(
                              "flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2",
                              assessmentMode === 'theory'
                                 ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                                 : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                           )}
                        >
                           <BookOpen size={18} />
                           Theory Assessment
                        </button>
                        <button
                           onClick={() => setAssessmentMode('practical')}
                           className={clsx(
                              "flex-1 py-4 text-sm font-bold transition-all flex items-center justify-center gap-2",
                              assessmentMode === 'practical'
                                 ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                                 : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                           )}
                        >
                           <ClipboardList size={18} />
                           Practical Skills
                        </button>
                     </div>

                     {/* Assessment Content */}
                     <div className="flex flex-col lg:flex-row">
                        {/* Competencies/Skills List */}
                        <div className="flex-1 p-6 overflow-y-auto max-h-[600px] custom-scrollbar">
                           {assessmentMode === 'theory' ? (
                              <div className="space-y-4">
                                 {Object.entries(competencies).map(([key, comp]) => {
                                    const currentLevel = selectedStudent.competencies[key] || 0;
                                    return (
                                       <div
                                          key={key}
                                          onClick={() => setActiveCompetency(key)}
                                          className={clsx(
                                             "glass-card p-5 rounded-xl border-2 transition-all cursor-pointer",
                                             activeCompetency === key
                                                ? "border-blue-400 bg-blue-50/30 shadow-md"
                                                : "border-transparent hover:border-gray-200 hover:shadow-sm"
                                          )}
                                       >
                                          <div className="flex items-center justify-between mb-4">
                                             <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                                   {comp.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                   <h3 className="font-bold text-gray-900">{comp.name}</h3>
                                                   <p className="text-xs text-gray-500">{comp.description}</p>
                                                </div>
                                             </div>
                                             <ChevronRight size={20} className={clsx("text-gray-300 transition-transform", activeCompetency === key && "rotate-90 text-blue-500")} />
                                          </div>

                                          <div className="grid grid-cols-4 gap-2">
                                             {[1, 2, 3, 4].map((level) => {
                                                const isSelected = currentLevel === level;
                                                return (
                                                   <button
                                                      key={level}
                                                      onClick={(e) => { e.stopPropagation(); handleGradeChange(key, level as CompetencyLevel); setActiveCompetency(key); }}
                                                      className={clsx(
                                                         "p-3 rounded-lg border-2 text-center transition-all",
                                                         isSelected
                                                            ? LEVEL_COLORS[level as CompetencyLevel] + " border-current shadow-sm"
                                                            : "bg-gray-50 border-transparent text-gray-400 hover:bg-white hover:border-gray-200"
                                                      )}
                                                   >
                                                      <div className="text-lg font-black">{level}</div>
                                                      <div className="text-[10px] font-bold uppercase">{COMPETENCY_LABELS[level]}</div>
                                                   </button>
                                                );
                                             })}
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           ) : (
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-google font-bold text-gray-900">Practical Skills Checklist</h3>
                                    <div className="flex items-center gap-2 text-sm">
                                       <span className="text-gray-500">Completed:</span>
                                       <span className="font-bold text-blue-600">{completedPracticals}/{practicalSkills.length}</span>
                                    </div>
                                 </div>

                                 {/* Progress Bar */}
                                 <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
                                    <div
                                       className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                                       style={{ width: `${(completedPracticals / practicalSkills.length) * 100}%` }}
                                    />
                                 </div>

                                 {practicalSkills.map((skill) => (
                                    <button
                                       key={skill.id}
                                       onClick={() => togglePracticalCheck(skill.id)}
                                       className={clsx(
                                          "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 group",
                                          practicalChecks[skill.id]
                                             ? "bg-green-50 border-green-200"
                                             : "bg-white border-gray-100 hover:border-gray-200"
                                       )}
                                    >
                                       <div className={clsx(
                                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                          practicalChecks[skill.id]
                                             ? "bg-green-500 text-white"
                                             : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                       )}>
                                          {practicalChecks[skill.id] ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                       </div>
                                       <div className="flex-1">
                                          <p className={clsx("font-medium", practicalChecks[skill.id] ? "text-green-800" : "text-gray-800")}>
                                             {skill.label}
                                          </p>
                                          <span className="text-xs text-gray-400 uppercase tracking-wider">{skill.category}</span>
                                       </div>
                                       <div className={clsx(
                                          "px-3 py-1 rounded-full text-xs font-bold",
                                          practicalChecks[skill.id] ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                       )}>
                                          {practicalChecks[skill.id] ? 'PASS' : 'PENDING'}
                                       </div>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* Standards Reference Panel */}
                        <div className="w-full lg:w-80 bg-gray-50 border-l border-gray-100 p-6">
                           <div className="flex items-center gap-2 mb-6">
                              <BarChart3 className="text-blue-500" size={20} />
                              <h3 className="font-google font-bold text-gray-800">
                                 {selectedSubject === 'Solar' ? 'NITA' : 'KICD'} Standards
                              </h3>
                           </div>

                           {activeCompetency && activeCompetencyData ? (
                              <div className="space-y-6 animate-fade-in">
                                 <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Competency Unit</span>
                                    <h4 className="font-bold text-gray-900 text-lg mt-1">{activeCompetencyData.name}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{activeCompetencyData.description}</p>
                                 </div>

                                 <div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Learning Outcomes</span>
                                    <ul className="space-y-2">
                                       {activeCompetencyData.outcomes.map((o, i) => (
                                          <li key={i} className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-100 flex items-start gap-2">
                                             <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                             {o}
                                          </li>
                                       ))}
                                    </ul>
                                 </div>

                                 <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-700">
                                       <strong>Assessment Criteria:</strong> Candidate must demonstrate competency level 3 or above to meet {selectedSubject === 'Solar' ? 'NITA' : 'KICD'} certification requirements.
                                    </p>
                                 </div>
                              </div>
                           ) : (
                              <div className="text-center py-12 text-gray-400">
                                 <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                 <p className="text-sm">Select a competency to view official {selectedSubject === 'Solar' ? 'NITA' : 'KICD'} standards and learning outcomes.</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="glass-panel rounded-2xl bg-white border border-gray-100 flex flex-col items-center justify-center text-gray-400 p-16 min-h-[500px]">
                     <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                        <ClipboardList size={48} className="opacity-40" />
                     </div>
                     <h3 className="text-xl font-google font-bold text-gray-600">No Candidate Selected</h3>
                     <p className="max-w-md text-center mt-2 text-gray-400">
                        Please select a student from the sidebar to begin the {selectedSubject === 'Solar' ? 'NITA Solar PV' : 'KICD Computer Studies'} competency assessment.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Assessment;