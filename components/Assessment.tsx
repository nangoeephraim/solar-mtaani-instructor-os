import React, { useState, useEffect } from 'react';
import { AppData, Student, CompetencyLevel, COMPETENCY_LABELS, AssessmentSystem, UnitAssessment, GradeKNEC, VerdictCBET } from '../types';
import { Check, ChevronRight, ClipboardList, UserCheck, UserX, BookOpen, Zap, Monitor, Award, CheckCircle2, XCircle, BarChart3, GraduationCap, Calculator, Scale, FileText, Lock, Unlock, Save } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';

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
   const [selectedGrade, setSelectedGrade] = useState<number>(5);
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

      onUpdateStudent(updatedStudent, true);
      showToast(`KNEC Grade Saved for ${activeUnit}`, 'success');
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

      onUpdateStudent(updatedStudent, true);
      showToast(`CBET Progress Saved: ${verdict}`, 'success');
   };

   return (
      <div className="max-w-7xl mx-auto animate-fade-in space-y-6 pb-10">
         {/* Header */}
         <div className="glass-panel p-6 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div className="flex items-center gap-4">
                  <motion.div
                     className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20"
                     whileHover={{ scale: 1.05, rotate: 5 }}
                     transition={{ type: "spring", stiffness: 400 }}
                  >
                     <Award size={28} className="text-white" />
                  </motion.div>
                  <div>
                     <h1 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                        Academic Assessment
                     </h1>
                     <p className="text-[var(--md-sys-color-on-surface-variant)] text-sm mt-0.5">
                        {assessmentSystem === 'KNEC' ? 'KNEC Standard Grading (TVET)' : 'NITA/CDAC Competency Based Assessment'}
                     </p>
                  </div>
               </div>

               {/* System Toggle */}
               <div className="flex bg-[var(--md-sys-color-surface-variant)] p-1 rounded-full border border-[var(--md-sys-color-outline)]">
                  <button
                     onClick={() => setAssessmentSystem('CBET')}
                     className={clsx(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        assessmentSystem === 'CBET' ? "bg-white shadow text-violet-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                     )}
                  >
                     <CheckCircle2 size={14} /> CBET (NITA)
                  </button>
                  <button
                     onClick={() => setAssessmentSystem('KNEC')}
                     className={clsx(
                        "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                        assessmentSystem === 'KNEC' ? "bg-white shadow text-blue-600" : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                     )}
                  >
                     <Scale size={14} /> KNEC (Standard)
                  </button>
               </div>
            </div>
         </div>

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
                     <div className="flex bg-[var(--md-sys-color-surface-variant)] rounded-lg p-1 overflow-x-auto">
                        {[5, 6, 7, 8, 9].map(g => (
                           <button
                              key={g}
                              onClick={() => { setSelectedGrade(g); setSelectedStudentId(null); }}
                              className={clsx(
                                 "flex-1 py-1.5 text-xs font-bold rounded-md transition-all min-w-[30px]",
                                 selectedGrade === g ? "bg-white shadow text-black" : "text-gray-500"
                              )}
                           >
                              {g}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Student List */}
               <div className="glass-panel p-4 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] h-[500px] flex flex-col">
                  <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider block mb-3">
                     Candidates ({studentsInClass.length})
                  </label>
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
                     {/* Assessment Header */}
                     <div className="p-6 border-b border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/30">
                        <div className="flex items-center justify-between">
                           <div>
                              <p className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Assessing Candidate</p>
                              <h2 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)]">{selectedStudent.name}</h2>
                              <div className="flex gap-4 mt-2 text-sm text-[var(--md-sys-color-on-surface-variant)]">
                                 <span className="flex items-center gap-1"><GraduationCap size={14} /> {selectedStudent.admissionNumber || 'N/A'}</span>
                                 <span className="flex items-center gap-1"><CheckCircle2 size={14} /> {selectedStudent.nitaNumber || 'No NITA Reg'}</span>
                              </div>
                           </div>
                           {activeUnit && (
                              <div className="text-right">
                                 <p className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Current Grade</p>
                                 {assessmentSystem === 'KNEC' ? (
                                    <div className="text-3xl font-black text-blue-600">
                                       {calculateKNECGrade(
                                          (marks.cat1 * 0.15) + (marks.cat2 * 0.15) + (marks.practical * 0.40) + (marks.exam * 0.30)
                                       )}
                                    </div>
                                 ) : (
                                    <div className="text-xl font-bold text-violet-600">Competency Check</div>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-1">
                        {/* Unit Selection */}
                        <div className="w-64 border-r border-[var(--md-sys-color-outline)] overflow-y-auto custom-scrollbar bg-[var(--md-sys-color-surface-variant)]/10">
                           <div className="p-4">
                              <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2 block">Select Unit</label>
                              <div className="space-y-2">
                                 {Object.entries(competencies).map(([key, comp]) => (
                                    <button
                                       key={key}
                                       onClick={() => setActiveUnit(key)}
                                       className={clsx(
                                          "w-full text-left p-3 rounded-lg text-sm border transition-all",
                                          activeUnit === key
                                             ? "bg-white shadow-sm border-l-4 border-l-blue-500 font-bold"
                                             : "hover:bg-gray-50 border-transparent text-gray-600"
                                       )}
                                    >
                                       {comp.name}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Scoring Area */}
                        <div className="flex-1 p-8 bg-[var(--md-sys-color-surface)]">
                           {activeUnit ? (
                              <div className="animate-fade-in max-w-2xl mx-auto">
                                 {assessmentSystem === 'KNEC' ? (
                                    <div className="space-y-8">
                                       <div className="flex items-center gap-3 mb-6">
                                          <Calculator className="text-blue-600" size={24} />
                                          <h3 className="text-xl font-bold">KNEC Grading Matrix</h3>
                                       </div>

                                       <div className="grid grid-cols-2 gap-8">
                                          <div className="space-y-4">
                                             <label className="block text-sm font-bold text-gray-700">CAT 1 (15%)</label>
                                             <div className="relative">
                                                <input
                                                   type="number"
                                                   value={marks.cat1}
                                                   onChange={e => setMarks({ ...marks, cat1: parseFloat(e.target.value) || 0 })}
                                                   className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/ 100</span>
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                             <label className="block text-sm font-bold text-gray-700">CAT 2 (15%)</label>
                                             <div className="relative">
                                                <input
                                                   type="number"
                                                   value={marks.cat2}
                                                   onChange={e => setMarks({ ...marks, cat2: parseFloat(e.target.value) || 0 })}
                                                   className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/ 100</span>
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                             <label className="block text-sm font-bold text-gray-700">Practical (40%)</label>
                                             <div className="relative">
                                                <input
                                                   type="number"
                                                   value={marks.practical}
                                                   onChange={e => setMarks({ ...marks, practical: parseFloat(e.target.value) || 0 })}
                                                   className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/ 100</span>
                                             </div>
                                          </div>
                                          <div className="space-y-4">
                                             <label className="block text-sm font-bold text-gray-700">Final Exam (30%)</label>
                                             <div className="relative">
                                                <input
                                                   type="number"
                                                   value={marks.exam}
                                                   onChange={e => setMarks({ ...marks, exam: parseFloat(e.target.value) || 0 })}
                                                   className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/ 100</span>
                                             </div>
                                          </div>
                                       </div>

                                       <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-2">Instructor Remarks</label>
                                          <textarea
                                             value={marks.remarks}
                                             onChange={e => setMarks({ ...marks, remarks: e.target.value })}
                                             className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-blue-500"
                                             placeholder="Enter qualitative feedback..."
                                          />
                                       </div>

                                       <div className="pt-6 border-t border-gray-100 flex justify-end">
                                          <button
                                             onClick={handleSaveAssessment}
                                             className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                          >
                                             <Save size={18} /> Save & Calculate Grade
                                          </button>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="space-y-6">
                                       {/* CBET Interface */}
                                       <div className="flex items-center gap-3 mb-6">
                                          <ClipboardList className="text-violet-600" size={24} />
                                          <h3 className="text-xl font-bold">Portfolio of Evidence (PoE)</h3>
                                       </div>

                                       <div className="space-y-3">
                                          {(competencies[activeUnit as keyof typeof competencies] as any).outcomes.map((outcome: string, idx: number) => {
                                             const isChecked = cbetChecks.includes(outcome);
                                             return (
                                                <div
                                                   key={idx}
                                                   onClick={() => toggleCBETCheck(outcome)}
                                                   className={clsx(
                                                      "flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group select-none",
                                                      isChecked
                                                         ? "bg-violet-50 border-violet-200 shadow-sm"
                                                         : "border-gray-200 hover:border-violet-200 hover:bg-gray-50"
                                                   )}
                                                >
                                                   <div className={clsx(
                                                      "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                      isChecked
                                                         ? "bg-violet-600 border-violet-600"
                                                         : "border-gray-300 group-hover:border-violet-400"
                                                   )}>
                                                      {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                                                   </div>
                                                   <span className={clsx(
                                                      "text-sm font-medium transition-colors",
                                                      isChecked ? "text-violet-900" : "text-gray-700"
                                                   )}>{outcome}</span>
                                                </div>
                                             );
                                          })}
                                       </div>

                                       <div className="pt-6 border-t border-gray-100 flex justify-end">
                                          <button
                                             onClick={handleSaveCBET}
                                             className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-violet-700 transition-all flex items-center gap-2 active:scale-95"
                                          >
                                             <Save size={18} /> Update Competency Status
                                          </button>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           ) : (
                              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                 <Scale size={64} className="mb-4 opacity-20" />
                                 <p>Select a unit to begin assessment</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="glass-panel h-96 rounded-2xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] flex items-center justify-center text-gray-400">
                     <p className="font-bold">Select a candidate to begin</p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default Assessment;