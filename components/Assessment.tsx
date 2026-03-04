import React, { useState, useEffect } from 'react';
import { AppData, Student, CompetencyLevel, COMPETENCY_LABELS, AssessmentSystem, UnitAssessment, GradeKNEC, VerdictCBET } from '../types';
import { Check, ChevronRight, ClipboardList, UserCheck, UserX, BookOpen, Zap, Monitor, Award, CheckCircle2, XCircle, BarChart3, GraduationCap, Calculator, Scale, FileText, Lock, Unlock, Save, X, AlertCircle, FileDown, Download } from 'lucide-react';
import clsx from 'clsx';
import { STUDENT_GROUPS, getLevelsForGroup, getDefaultLevel } from '../constants/educationLevels';
import type { StudentGroup } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import PageHeader from './PageHeader';

interface AssessmentProps {
   data: AppData;
   onUpdateStudent: (student: Student, notify?: boolean) => void;
}

// ... existing competencies constants ...
// NITA Solar PV Installer II Competencies (KNQF Level 3)
const SOLAR_COMPETENCIES = {
   siteAssessment: {
      name: 'Site Assessment',
      description: 'Energy audits, load analysis, site surveys',
      outcomes: ['Conduct site surveys', 'Perform energy audits', 'Calculate load requirements', 'Assess roof/ground suitability']
   },
   // ... rest of solar competencies
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

const ICT_COMPETENCIES = {
   msWord: {
      name: 'Microsoft Word',
      description: 'Document formatting, tables, mail merge',
      outcomes: ['Format documents professionally', 'Create and edit tables', 'Perform mail merge', 'Insert headers/footers/graphics']
   },
   // ... rest of ICT competencies
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
   }
};

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
   const [selectedGrade, setSelectedGrade] = useState<string>('L3');
   const [selectedGroup, setSelectedGroup] = useState<StudentGroup>('Academy');
   const [selectedSubject, setSelectedSubject] = useState<'Solar' | 'ICT'>('Solar');
   const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
   const [assessmentSystem, setAssessmentSystem] = useState<AssessmentSystem>('CBET');
   const [activeUnit, setActiveUnit] = useState<string | null>(null);
   const { showToast } = useToast();

   // Form State for Marks
   const [marks, setMarks] = useState({
      cat1: 0, cat2: 0, practical: 0, exam: 0,
      remarks: ''
   });

   const studentsInClass = data.students.filter(s => s.grade === selectedGrade && s.subject === selectedSubject);
   const selectedStudent = data.students.find(s => s.id === selectedStudentId);

   const competencies = selectedSubject === 'Solar' ? SOLAR_COMPETENCIES : ICT_COMPETENCIES;
   const practicalSkills = selectedSubject === 'Solar' ? SOLAR_PRACTICAL : ICT_PRACTICAL;

   const [cbetChecks, setCbetChecks] = useState<string[]>([]);

   // Load marks when unit changes
   useEffect(() => {
      if (selectedStudent && activeUnit) {
         const unitData = selectedStudent.assessment?.units?.[activeUnit];
         if (unitData) {
            setMarks({
               cat1: unitData.cat1?.score || 0,
               cat2: unitData.cat2?.score || 0,
               practical: unitData.practical?.score || 0,
               exam: unitData.finalExam?.score || 0,
               remarks: unitData.instructorRemarks || ''
            });
            // Load CBET checks if available
            setCbetChecks(unitData.practicalChecks || []);
         } else {
            setMarks({ cat1: 0, cat2: 0, practical: 0, exam: 0, remarks: '' });
            setCbetChecks([]);
         }
      }
   }, [selectedStudentId, activeUnit]);

   const calculateKNECGrade = (score: number): GradeKNEC => {
      if (score >= 80) return 'Distinction';
      if (score >= 60) return 'Credit';
      if (score >= 40) return 'Pass';
      if (score >= 30) return 'Referral';
      return 'Fail';
   };

   const handleSaveAssessment = () => {
      if (!selectedStudent || !activeUnit) return;

      // Calculate Weighted Score
      // Default Weights: CATs (30%), Practical (40%), Exam (30%)
      // Assuming inputs are out of 100
      const finalScore = (marks.cat1 * 0.15) + (marks.cat2 * 0.15) + (marks.practical * 0.40) + (marks.exam * 0.30);
      const finalGrade = calculateKNECGrade(finalScore);

      const updatedStudent = { ...selectedStudent };
      if (!updatedStudent.assessment) updatedStudent.assessment = { units: {}, termStats: [] };

      updatedStudent.assessment.units[activeUnit] = {
         ...updatedStudent.assessment.units[activeUnit], // Preserve existing data if any
         unitId: activeUnit,
         system: 'KNEC', // Explicitly set system for this save
         cat1: { score: marks.cat1, maxScore: 100, weight: 15 },
         cat2: { score: marks.cat2, maxScore: 100, weight: 15 },
         practical: { score: marks.practical, maxScore: 100, weight: 40 },
         finalExam: { score: marks.exam, maxScore: 100, weight: 30 },
         finalScore: Math.round(finalScore),
         finalGrade: finalGrade,
         instructorRemarks: marks.remarks
      };

      // Sync to student.competencies so Analytics tab reflects this data
      // Map KNEC score (0-100) to competency level (1-4)
      const competencyLevel = finalScore >= 80 ? 4 : finalScore >= 60 ? 3 : finalScore >= 40 ? 2 : 1;
      if (!updatedStudent.competencies) updatedStudent.competencies = {};
      updatedStudent.competencies[activeUnit] = competencyLevel;

      onUpdateStudent(updatedStudent, true);
      showToast(`KNEC Grade Saved for ${activeUnit}`, 'success');
      setActiveUnit(null);
   };

   const toggleCBETCheck = (outcome: string) => {
      setCbetChecks(prev =>
         prev.includes(outcome)
            ? prev.filter(p => p !== outcome)
            : [...prev, outcome]
      );
   };

   const handleSaveCBET = () => {
      if (!selectedStudent || !activeUnit) return;

      const updatedStudent = { ...selectedStudent };
      if (!updatedStudent.assessment) updatedStudent.assessment = { units: {}, termStats: [] };

      const totalOutcomes = (competencies[activeUnit as keyof typeof competencies] as any).outcomes.length;
      const checkedOutcomes = cbetChecks.length;
      const verdict: VerdictCBET = checkedOutcomes === totalOutcomes ? 'Competent' : 'Not Yet Competent';

      updatedStudent.assessment.units[activeUnit] = {
         ...updatedStudent.assessment.units[activeUnit],
         unitId: activeUnit,
         system: 'CBET',
         practicalChecks: cbetChecks,
         verdict: verdict,
         instructorRemarks: `Competency Check: ${checkedOutcomes}/${totalOutcomes} outcomes achieved.`
      };

      // Sync to student.competencies so Analytics tab reflects this data
      // Map CBET progress to competency level (1-4)
      const pct = totalOutcomes > 0 ? checkedOutcomes / totalOutcomes : 0;
      const competencyLevel = pct >= 1 ? 4 : pct >= 0.75 ? 3 : pct >= 0.5 ? 2 : 1;
      if (!updatedStudent.competencies) updatedStudent.competencies = {};
      updatedStudent.competencies[activeUnit] = competencyLevel;

      onUpdateStudent(updatedStudent, true);
      showToast(`CBET Progress Saved: ${verdict}`, 'success');
      setActiveUnit(null);
   };

   return (
      <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-10">
         {/* Header */}
         <PageHeader
            title="Academic Assessment"
            subtitle={assessmentSystem === 'KNEC' ? 'KNEC Standard Grading (TVET)' : 'NITA/CDAC Competency Based Assessment'}
            icon={Award}
            color="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20"
            action={
               <div className="flex bg-[var(--md-sys-color-surface-variant)] p-1 rounded-full border border-[var(--md-sys-color-outline)]">
                  <button
                     onClick={() => setAssessmentSystem('CBET')}
                     className={clsx(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        assessmentSystem === 'CBET' ? "bg-[var(--md-sys-color-surface)] shadow text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                     )}
                  >
                     <CheckCircle2 size={14} /> CBET (NITA)
                  </button>
                  <button
                     onClick={() => setAssessmentSystem('KNEC')}
                     className={clsx(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        assessmentSystem === 'KNEC' ? "bg-[var(--md-sys-color-surface)] shadow text-blue-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                     )}
                  >
                     <Scale size={14} /> KNEC (Standard)
                  </button>
               </div>
            }
         />

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar - Candidate Selection */}
            <div className="lg:col-span-3 space-y-4">
               {/* Filters */}
               <div className="glass-panel p-4 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)]">
                  <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-3">Filter Candidates</label>
                  <div className="space-y-3">
                     <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1">
                        {(['Solar', 'ICT'] as const).map(sub => (
                           <button
                              key={sub}
                              onClick={() => { setSelectedSubject(sub); setSelectedStudentId(null); setActiveUnit(null); }}
                              className={clsx(
                                 "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                                 selectedSubject === sub ? "bg-white shadow text-black" : "text-gray-500"
                              )}
                           >
                              {sub}
                           </button>
                        ))}
                     </div>
                     <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1 overflow-x-auto custom-scrollbar">
                        {STUDENT_GROUPS.map(grp => (
                           <button
                              key={grp}
                              onClick={() => { setSelectedGroup(grp); setSelectedGrade(getDefaultLevel(grp)); setSelectedStudentId(null); }}
                              className={clsx(
                                 "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                                 selectedGroup === grp ? "bg-white shadow text-black" : "text-gray-500"
                              )}
                           >
                              {grp}
                           </button>
                        ))}
                     </div>
                     <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1 overflow-x-auto">
                        {getLevelsForGroup(selectedGroup).map(lvl => (
                           <button
                              key={lvl.id}
                              onClick={() => { setSelectedGrade(lvl.id); setSelectedStudentId(null); }}
                              className={clsx(
                                 "flex-1 py-1.5 text-xs font-bold rounded-md transition-all min-w-[30px]",
                                 selectedGrade === lvl.id ? "bg-white shadow text-black" : "text-gray-500"
                              )}
                           >
                              {lvl.shortLabel}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Student List */}
               <div className="glass-panel p-4 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] h-[300px] md:h-[500px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                     <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">
                        Candidates ({studentsInClass.length})
                     </label>
                     {studentsInClass.length > 0 && (
                        <button
                           onClick={async () => {
                              const { generateBulkReportCards } = await import('../services/reportCardService');
                              generateBulkReportCards(studentsInClass, data, { term: 1 });
                              showToast(`Downloading ${studentsInClass.length} report cards...`, 'success');
                           }}
                           className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-200 transition-all"
                           title="Download all report cards"
                        >
                           <Download size={10} /> All PDFs
                        </button>
                     )}
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                     {studentsInClass.map(s => (
                        <button
                           key={s.id}
                           onClick={() => setSelectedStudentId(s.id)}
                           className={clsx(
                              "w-full text-left p-3 rounded-xl border transition-all text-sm font-medium flex items-center justify-between group",
                              selectedStudentId === s.id
                                 ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                 : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-blue-300"
                           )}
                        >
                           <div>
                              <p className="font-bold">{s.name}</p>
                              <p className="text-[10px] opacity-80">{s.admissionNumber || 'No Adm No'}</p>
                           </div>
                           {selectedStudentId === s.id && <ChevronRight size={16} />}
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            {/* Main Area */}
            <div className="lg:col-span-9">
               {selectedStudent ? (
                  <div className="glass-panel rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] overflow-hidden min-h-[600px] flex flex-col">
                     {/* Dashboard Header */}
                     <div className="p-6 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/30">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Candidate Dashboard</p>
                              <h2 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)]">{selectedStudent.name}</h2>
                              <div className="flex gap-4 mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                                 <span className="flex items-center gap-1"><GraduationCap size={14} /> {selectedStudent.admissionNumber || 'N/A'}</span>
                                 <span className="flex items-center gap-1"><CheckCircle2 size={14} /> {selectedStudent.nitaNumber || 'No NITA Reg'}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <button
                                 onClick={async () => {
                                    const { generateReportCard } = await import('../services/reportCardService');
                                    generateReportCard(selectedStudent, data, { term: 1 });
                                 }}
                                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                                 title="Download Report Card PDF"
                              >
                                 <FileDown size={14} /> Report Card
                              </button>
                              <div className="text-right">
                                 <p className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Overall Status</p>
                                 <div className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
                                    {Object.keys(selectedStudent.assessment?.units || {}).length} / {Object.keys(competencies).length} Units Attempted
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Unit Cards Grid */}
                     <div className="flex-1 p-6 bg-[var(--md-sys-color-surface-variant)]/10 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {Object.entries(competencies).map(([key, comp]) => {
                              const unitData = selectedStudent.assessment?.units?.[key];
                              const isCompleteKNEC = unitData?.system === 'KNEC' && !!unitData?.finalGrade;
                              const isCompleteCBET = unitData?.system === 'CBET' && unitData?.verdict === 'Competent';
                              const isComplete = assessmentSystem === 'KNEC' ? isCompleteKNEC : isCompleteCBET;

                              return (
                                 <motion.div
                                    key={key}
                                    whileHover={{ y: -4 }}
                                    onClick={() => setActiveUnit(key)}
                                    className={clsx(
                                       "p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col min-h-[220px]",
                                       isComplete
                                          ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                                          : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-blue-400"
                                    )}
                                 >
                                    {isComplete && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-[100px] z-0" />}

                                    <div className="relative z-10">
                                       <div className="flex justify-between items-start mb-4">
                                          <div className="p-2 bg-[var(--md-sys-color-surface-variant)] rounded-lg">
                                             <BookOpen size={18} className={isComplete ? "text-green-600 dark:text-green-400" : "text-[var(--md-sys-color-primary)]"} />
                                          </div>
                                          {isComplete ? (
                                             <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Completed
                                             </span>
                                          ) : (
                                             <span className="px-2 py-1 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] text-[10px] font-bold rounded uppercase tracking-wider">
                                                Pending
                                             </span>
                                          )}
                                       </div>
                                       <h3 className="font-bold text-[var(--md-sys-color-on-surface)] leading-tight mb-2">{(comp as any).name}</h3>
                                       <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">{(comp as any).description}</p>
                                    </div>

                                    <div className="mt-auto relative z-10">
                                       {assessmentSystem === 'KNEC' && unitData?.finalScore ? (
                                          <div className="flex items-end justify-between pt-4 mt-4 border-t border-[var(--md-sys-color-outline)] border-dashed">
                                             <div>
                                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold mb-1">Score</p>
                                                <p className="text-2xl font-black text-[var(--md-sys-color-on-surface)] leading-none">{unitData.finalScore}%</p>
                                             </div>
                                             <div className="text-right">
                                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-bold mb-1">Grade</p>
                                                <p className={clsx("text-lg font-bold leading-none", unitData.finalGrade === 'Fail' ? "text-red-500" : "text-blue-500")}>
                                                   {unitData.finalGrade}
                                                </p>
                                             </div>
                                          </div>
                                       ) : assessmentSystem === 'CBET' && unitData?.practicalChecks ? (
                                          <div className="pt-4 mt-4 border-t border-[var(--md-sys-color-outline)] border-dashed">
                                             <div className="flex justify-between text-xs mb-2">
                                                <span className="text-[var(--md-sys-color-secondary)] font-medium">Outcomes Achieved</span>
                                                <span className="font-bold">{unitData.practicalChecks.length} / {(comp as any).outcomes.length}</span>
                                             </div>
                                             <div className="h-2 w-full bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
                                                <div
                                                   className={clsx("h-full transition-all duration-500", unitData.practicalChecks.length === (comp as any).outcomes.length ? "bg-green-500" : "bg-violet-500")}
                                                   style={{ width: `${(unitData.practicalChecks.length / (comp as any).outcomes.length) * 100}%` }}
                                                />
                                             </div>
                                          </div>
                                       ) : (
                                          <div className="pt-4 mt-4 border-t border-[var(--md-sys-color-outline)] border-dashed">
                                             <p className="text-xs text-center text-[var(--md-sys-color-secondary)] font-medium text-blue-500 hover:underline">Click to Grade</p>
                                          </div>
                                       )}
                                    </div>
                                 </motion.div>
                              );
                           })}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="glass-panel h-96 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] flex items-center justify-center text-[var(--md-sys-color-secondary)]">
                     <p className="font-bold">Select a candidate to begin assessment</p>
                  </div>
               )}
            </div>
         </div>

         {/* Assessment Grading Modal */}
         <AnimatePresence>
            {activeUnit && selectedStudent && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm">
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="bg-[var(--md-sys-color-surface)] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[var(--md-sys-color-outline)] relative"
                  >
                     {/* Close Button */}
                     <button
                        title="Close Grading Modal"
                        aria-label="Close Grading Modal"
                        onClick={() => setActiveUnit(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors text-white z-10"
                     >
                        <X size={20} />
                     </button>

                     {/* Modal Header */}
                     <div className={clsx(
                        "px-8 py-6 text-white shrink-0",
                        assessmentSystem === 'KNEC' ? "bg-gradient-to-br from-blue-600 to-indigo-700" : "bg-gradient-to-br from-violet-600 to-fuchsia-700"
                     )}>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded">
                              {assessmentSystem} Assessment
                           </span>
                           <span className="px-2 py-0.5 bg-black/20 backdrop-blur-md text-white/90 text-[10px] font-bold uppercase tracking-wider rounded">
                              {selectedSubject}
                           </span>
                        </div>
                        <h2 className="text-3xl font-google font-bold mb-1">
                           {(competencies[activeUnit as keyof typeof competencies] as any).name}
                        </h2>
                        <p className="text-white/80 text-sm font-medium">
                           Candidate: <span className="text-white font-bold">{selectedStudent.name}</span> • {selectedStudent.admissionNumber || 'No Adm No'}
                        </p>
                     </div>

                     {/* Modal Body */}
                     <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {assessmentSystem === 'KNEC' ? (
                           // KNEC Form Layout
                           (() => {
                              const liveScore = Math.round((marks.cat1 * 0.15) + (marks.cat2 * 0.15) + (marks.practical * 0.40) + (marks.exam * 0.30));
                              const liveGrade = calculateKNECGrade(liveScore);
                              const liveColor = liveGrade === 'Distinction' ? 'bg-green-500' : liveGrade === 'Credit' ? 'bg-blue-500' : liveGrade === 'Pass' ? 'bg-yellow-500' : liveGrade === 'Referral' ? 'bg-orange-500' : 'bg-red-500';

                              return (
                                 <div className="space-y-8">
                                    {/* Live Projection Bar */}
                                    <div className="bg-[var(--md-sys-color-surface-variant)] rounded-2xl p-5 flex items-center justify-between border border-[var(--md-sys-color-outline)] shadow-sm">
                                       <div>
                                          <p className="text-xs text-[var(--md-sys-color-secondary)] font-bold uppercase tracking-wider mb-1">Projected Grade</p>
                                          <div className="flex items-baseline gap-2">
                                             <span className="text-4xl font-black text-[var(--md-sys-color-on-surface)]">{liveScore}%</span>
                                             <span className={clsx("text-xl font-bold", liveColor.replace('bg-', 'text-'))}>{liveGrade}</span>
                                          </div>
                                       </div>
                                       <div className="w-1/2">
                                          <div className="h-3 w-full bg-[var(--md-sys-color-surface)] rounded-full overflow-hidden border border-[var(--md-sys-color-outline)]">
                                             <div
                                                className={clsx("h-full transition-all duration-500", liveColor)}
                                                style={{ width: `${liveScore}%` }}
                                             />
                                          </div>
                                          <div className="flex justify-between text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 font-bold">
                                             <span>0</span>
                                             <span>Pass (40)</span>
                                             <span>Distinction (80)</span>
                                             <span>100</span>
                                          </div>
                                       </div>
                                    </div>

                                    {/* Inputs */}
                                    <div className="grid grid-cols-2 gap-6">
                                       <div className="space-y-4">
                                          <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)]">CAT 1 (15%)</label>
                                          <div className="relative">
                                             <input
                                                type="number"
                                                title="CAT 1 Score"
                                                aria-label="CAT 1 Score"
                                                placeholder="0"
                                                value={marks.cat1}
                                                onChange={e => setMarks({ ...marks, cat1: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 text-[var(--md-sys-color-on-surface)]"
                                             />
                                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm">/ 100</span>
                                          </div>
                                       </div>
                                       <div className="space-y-4">
                                          <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)]">CAT 2 (15%)</label>
                                          <div className="relative">
                                             <input
                                                type="number"
                                                title="CAT 2 Score"
                                                aria-label="CAT 2 Score"
                                                placeholder="0"
                                                value={marks.cat2}
                                                onChange={e => setMarks({ ...marks, cat2: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 text-[var(--md-sys-color-on-surface)]"
                                             />
                                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm">/ 100</span>
                                          </div>
                                       </div>
                                       <div className="space-y-4">
                                          <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)]">Practical (40%)</label>
                                          <div className="relative">
                                             <input
                                                type="number"
                                                title="Practical Score"
                                                aria-label="Practical Score"
                                                placeholder="0"
                                                value={marks.practical}
                                                onChange={e => setMarks({ ...marks, practical: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 text-[var(--md-sys-color-on-surface)]"
                                             />
                                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm">/ 100</span>
                                          </div>
                                       </div>
                                       <div className="space-y-4">
                                          <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)]">Final Exam (30%)</label>
                                          <div className="relative">
                                             <input
                                                type="number"
                                                title="Final Exam Score"
                                                aria-label="Final Exam Score"
                                                placeholder="0"
                                                value={marks.exam}
                                                onChange={e => setMarks({ ...marks, exam: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-4 pr-12 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500 text-[var(--md-sys-color-on-surface)]"
                                             />
                                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)] text-sm">/ 100</span>
                                          </div>
                                       </div>
                                    </div>

                                    <div>
                                       <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2">Instructor Remarks</label>
                                       <textarea
                                          value={marks.remarks}
                                          onChange={e => setMarks({ ...marks, remarks: e.target.value })}
                                          className="w-full p-4 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500 text-[var(--md-sys-color-on-surface)]"
                                          placeholder="Enter qualitative feedback..."
                                       />
                                    </div>

                                    <div className="pt-6 border-t border-[var(--md-sys-color-outline)] flex justify-end gap-3">
                                       <button
                                          onClick={() => setActiveUnit(null)}
                                          className="px-6 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold transition-all"
                                       >
                                          Cancel
                                       </button>
                                       <button
                                          onClick={handleSaveAssessment}
                                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                                       >
                                          <Save size={18} /> Save Grade
                                       </button>
                                    </div>
                                 </div>
                              );
                           })()
                        ) : (
                           // CBET Form Layout
                           (() => {
                              const currentComp = competencies[activeUnit as keyof typeof competencies] as any;
                              const liveOutcomes = cbetChecks.length;
                              const totalOutcomes = currentComp?.outcomes.length || 0;
                              const liveVerdict = liveOutcomes === totalOutcomes ? 'Competent' : 'Not Yet Competent';

                              return (
                                 <div className="space-y-6">
                                    {/* Live Projection Bar */}
                                    <div className="bg-[var(--md-sys-color-surface-variant)] rounded-2xl p-5 flex items-center justify-between border border-[var(--md-sys-color-outline)] shadow-sm">
                                       <div>
                                          <p className="text-xs text-[var(--md-sys-color-secondary)] font-bold uppercase tracking-wider mb-1">Current Verdict</p>
                                          <div className="flex items-center gap-2">
                                             {liveVerdict === 'Competent' ? <CheckCircle2 className="text-green-500" size={24} /> : <AlertCircle className="text-amber-500" size={24} />}
                                             <span className={clsx("text-2xl font-black", liveVerdict === 'Competent' ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                                                {liveVerdict}
                                             </span>
                                          </div>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-xs text-[var(--md-sys-color-secondary)] font-bold uppercase tracking-wider mb-1">Outcomes Met</p>
                                          <p className="text-3xl font-black text-[var(--md-sys-color-on-surface)]">{liveOutcomes} <span className="text-lg text-[var(--md-sys-color-on-surface-variant)]">/ {totalOutcomes}</span></p>
                                       </div>
                                    </div>

                                    <div className="space-y-3 mt-6">
                                       <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-4">Select outcomes demonstrated by candidate:</p>
                                       {currentComp.outcomes.map((outcome: string, idx: number) => {
                                          const isChecked = cbetChecks.includes(outcome);
                                          return (
                                             <div
                                                key={idx}
                                                onClick={() => toggleCBETCheck(outcome)}
                                                className={clsx(
                                                   "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group select-none",
                                                   isChecked
                                                      ? "bg-violet-50 border-violet-200 shadow-sm dark:bg-violet-900/20 dark:border-violet-800"
                                                      : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-violet-300"
                                                )}
                                             >
                                                <div className={clsx(
                                                   "mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                                   isChecked
                                                      ? "bg-violet-600 border-violet-600"
                                                      : "border-gray-300 dark:border-gray-600 group-hover:border-violet-400"
                                                )}>
                                                   <AnimatePresence>
                                                      {isChecked && (
                                                         <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                                            <Check size={14} className="text-white" strokeWidth={4} />
                                                         </motion.div>
                                                      )}
                                                   </AnimatePresence>
                                                </div>
                                                <span className={clsx(
                                                   "text-sm font-medium transition-colors",
                                                   isChecked ? "text-violet-900 dark:text-violet-300" : "text-[var(--md-sys-color-on-surface)]"
                                                )}>{outcome}</span>
                                             </div>
                                          );
                                       })}
                                    </div>

                                    <div className="pt-6 mt-8 border-t border-[var(--md-sys-color-outline)] flex justify-end gap-3">
                                       <button
                                          onClick={() => setActiveUnit(null)}
                                          className="px-6 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold transition-all"
                                       >
                                          Cancel
                                       </button>
                                       <button
                                          onClick={handleSaveCBET}
                                          className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-violet-700 transition-all flex items-center gap-2 active:scale-95"
                                       >
                                          <Save size={18} /> Update Competency Status
                                       </button>
                                    </div>
                                 </div>
                              );
                           })()
                        )}
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default Assessment;