import React, { useState, useMemo, useEffect } from 'react';
import { AppData, CurriculumUnit, Student, ScheduleSlot } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from './PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, Sparkles, AlertCircle, ChevronDown, ChevronUp, 
  GraduationCap, ShieldAlert, Zap, Layers, Calendar, ClipboardList,
  CheckCircle2, Circle, PlayCircle, PlusCircle, Trash2, Edit2, Brain,
  FileText, CheckSquare, Square, Users, Award, BookOpenCheck, Clock, 
  Plus, ExternalLink, HelpCircle, Save, Check, RefreshCw
} from 'lucide-react';
import { getSubjectEmoji, getSubjectIconBg } from '../utils/subjectUtils';
import clsx from 'clsx';

interface CurriculumProps {
  data: AppData;
  onNavigate: (view: string) => void;
  onUpdateStudent?: (student: Student, notify?: boolean) => Promise<void> | void;
  onAddScheduleSlot?: (slot: Omit<ScheduleSlot, 'id'>) => Promise<void> | void;
}

// Visual layout mappings
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 25 }
  }
};

const getMappedCompetencyKey = (title: string, subject: string): string => {
  const lowerTitle = title.toLowerCase();
  const lowerSubject = subject.toLowerCase();
  
  if (lowerSubject.includes('solar')) {
    if (lowerTitle.includes('safety') || lowerTitle.includes('ppe') || lowerTitle.includes('hazard')) return 'safetyProtocols';
    if (lowerTitle.includes('wiring') || lowerTitle.includes('circuit') || lowerTitle.includes('multimeter') || lowerTitle.includes('principle')) return 'electricalWiring';
    if (lowerTitle.includes('panel') || lowerTitle.includes('mount') || lowerTitle.includes('crimping') || lowerTitle.includes('series') || lowerTitle.includes('array')) return 'panelInstallation';
    if (lowerTitle.includes('battery') || lowerTitle.includes('load') || lowerTitle.includes('sizing') || lowerTitle.includes('bank')) return 'batterySetup';
    if (lowerTitle.includes('controller') || lowerTitle.includes('inverter') || lowerTitle.includes('commissioning') || lowerTitle.includes('test')) return 'systemTesting';
    return 'safetyProtocols'; // default fallback for solar
  }
  
  if (lowerSubject.includes('ict') || lowerSubject.includes('computer') || lowerSubject.includes('software') || lowerSubject.includes('web') || lowerSubject.includes('network')) {
    if (lowerTitle.includes('word') || lowerTitle.includes('document') || lowerTitle.includes('format')) return 'msWord';
    if (lowerTitle.includes('excel') || lowerTitle.includes('spreadsheet') || lowerTitle.includes('formula') || lowerTitle.includes('chart')) return 'msExcel';
    if (lowerTitle.includes('powerpoint') || lowerTitle.includes('presentation') || lowerTitle.includes('slide')) return 'msPowerPoint';
    if (lowerTitle.includes('access') || lowerTitle.includes('database') || lowerTitle.includes('query') || lowerTitle.includes('sql')) return 'msAccess';
    return 'computerBasics';
  }
  
  // CBC / General Core Competencies fallback
  if (lowerTitle.includes('fraction') || lowerTitle.includes('number') || lowerTitle.includes('measure') || lowerTitle.includes('geometry') || lowerTitle.includes('data')) return 'critical_thinking';
  if (lowerTitle.includes('digital') || lowerTitle.includes('code') || lowerTitle.includes('program') || lowerTitle.includes('device')) return 'digital_literacy';
  if (lowerTitle.includes('art') || lowerTitle.includes('music') || lowerTitle.includes('drama') || lowerTitle.includes('song')) return 'creativity_imagination';
  if (lowerTitle.includes('soil') || lowerTitle.includes('crop') || lowerTitle.includes('agriculture')) return 'citizenship';
  if (lowerTitle.includes('eat') || lowerTitle.includes('nutri') || lowerTitle.includes('health') || lowerTitle.includes('hygiene')) return 'self_efficacy';
  
  return 'critical_thinking';
};

const getCompetencyLabel = (key: string): string => {
  const mapping: Record<string, string> = {
    safetyProtocols: 'Safety Protocols & PPE',
    electricalWiring: 'Electrical Wiring & Main Boards',
    panelInstallation: 'PV Panel Assembly & Crimping',
    batterySetup: 'Battery Banks & Controller Sizing',
    systemTesting: 'System Commissioning & Multimeter Testing',
    msWord: 'Word Processing & Tables',
    msExcel: 'Excel Formulas & Charting',
    msPowerPoint: 'PowerPoint Design & Slideshows',
    msAccess: 'Access Tables & SQL Queries',
    computerBasics: 'Hardware & OS Setup',
    critical_thinking: 'Critical Thinking & Problem Solving',
    digital_literacy: 'Digital Devices & Literacy',
    creativity_imagination: 'Creativity & Artistic Expression',
    citizenship: 'Citizenship & Soil/Crop Care',
    self_efficacy: 'Self-Efficacy & Healthy Eating',
    communication_collaboration: 'Communication & Teamwork'
  };
  return mapping[key] || 'Unit Competency';
};

export const Curriculum: React.FC<CurriculumProps> = ({ 
  data, 
  onNavigate,
  onUpdateStudent,
  onAddScheduleSlot
}) => {
  const { preferences } = useTheme();
  const activeCurriculum = preferences?.selectedCurriculum || 'TVET_CDACC';
  const subjects = useMemo(() => Object.keys(data.curriculum || {}), [data.curriculum]);

  const [activeSubject, setActiveSubject] = useState<string>(() => subjects[0] || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // Curriculum State Management (Progress, Notes, Attached Resources, Checked Outcomes, Custom Units)
  const [progressState, setProgressState] = useState<{
    status: Record<string, 'Not Started' | 'In Progress' | 'Completed'>;
    notes: Record<string, string>;
    attachedResources: Record<string, string[]>;
    completedOutcomes: Record<string, Record<number, boolean>>;
    customUnits: CurriculumUnit[];
  }>({
    status: {},
    notes: {},
    attachedResources: {},
    completedOutcomes: {},
    customUnits: []
  });

  // Modals management
  const [activeAssessUnit, setActiveAssessUnit] = useState<CurriculumUnit | null>(null);
  const [activeScheduleUnit, setActiveScheduleUnit] = useState<CurriculumUnit | null>(null);
  const [activeAIUnit, setActiveAIUnit] = useState<CurriculumUnit | null>(null);
  const [activeResourceUnit, setActiveResourceUnit] = useState<CurriculumUnit | null>(null);
  const [isCustomUnitModalOpen, setIsCustomUnitModalOpen] = useState(false);

  // Loading indicator for simulated AI generation
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResult, setAiResult] = useState<{ plan: string; quiz: { q: string; a: string[] }[] } | null>(null);

  // Local schedule form state
  const [scheduleDay, setScheduleDay] = useState(1);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleDuration, setScheduleDuration] = useState(120);

  // Custom unit form state
  const [customUnitTitle, setCustomUnitTitle] = useState('');
  const [customUnitCode, setCustomUnitCode] = useState('');
  const [customUnitNumber, setCustomUnitNumber] = useState(1);
  const [customUnitOutcomes, setCustomUnitOutcomes] = useState('');
  const [customUnitActivities, setCustomUnitActivities] = useState('');

  // Assessment scores mapping
  const activeStudents = useMemo(() => {
    return data.students.filter(s => s.subject === activeSubject);
  }, [data.students, activeSubject]);

  // Load customizations from localStorage
  useEffect(() => {
    if (!activeSubject || !activeCurriculum) return;
    const progressKey = `prism_curr_progress_${activeCurriculum}_${activeSubject}`;
    const customKey = `prism_curr_custom_units_${activeCurriculum}_${activeSubject}`;

    const storedProgress = localStorage.getItem(progressKey);
    const storedCustom = localStorage.getItem(customKey);

    setProgressState({
      status: storedProgress ? JSON.parse(storedProgress).status || {} : {},
      notes: storedProgress ? JSON.parse(storedProgress).notes || {} : {},
      attachedResources: storedProgress ? JSON.parse(storedProgress).attachedResources || {} : {},
      completedOutcomes: storedProgress ? JSON.parse(storedProgress).completedOutcomes || {} : {},
      customUnits: storedCustom ? JSON.parse(storedCustom) : []
    });
  }, [activeSubject, activeCurriculum]);

  // Reset active subject when subjects list changes
  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(activeSubject)) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject]);

  // Save changes to localStorage
  const saveProgress = (updates: Partial<typeof progressState>) => {
    const nextState = { ...progressState, ...updates };
    setProgressState(nextState);

    const progressKey = `prism_curr_progress_${activeCurriculum}_${activeSubject}`;
    localStorage.setItem(progressKey, JSON.stringify({
      status: nextState.status,
      notes: nextState.notes,
      attachedResources: nextState.attachedResources,
      completedOutcomes: nextState.completedOutcomes
    }));

    if (updates.customUnits !== undefined) {
      const customKey = `prism_curr_custom_units_${activeCurriculum}_${activeSubject}`;
      localStorage.setItem(customKey, JSON.stringify(nextState.customUnits));
    }
  };

  const toggleUnit = (unitTitle: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitTitle]: !prev[unitTitle]
    }));
  };

  const updateUnitStatus = (unitTitle: string, status: 'Not Started' | 'In Progress' | 'Completed') => {
    const nextStatus = { ...progressState.status, [unitTitle]: status };
    saveProgress({ status: nextStatus });
  };

  const updateUnitNotes = (unitTitle: string, noteText: string) => {
    const nextNotes = { ...progressState.notes, [unitTitle]: noteText };
    saveProgress({ notes: nextNotes });
  };

  const toggleOutcomeChecked = (unitTitle: string, outcomeIdx: number) => {
    const unitOutcomes = progressState.completedOutcomes[unitTitle] || {};
    const nextUnitOutcomes = { ...unitOutcomes, [outcomeIdx]: !unitOutcomes[outcomeIdx] };
    const nextCompletedOutcomes = { ...progressState.completedOutcomes, [unitTitle]: nextUnitOutcomes };
    saveProgress({ completedOutcomes: nextCompletedOutcomes });
  };

  // Compile combined units (default preset + custom added ones)
  const allUnits = useMemo(() => {
    const defaults = data.curriculum?.[activeSubject] || [];
    return [...defaults, ...progressState.customUnits];
  }, [data.curriculum, activeSubject, progressState.customUnits]);

  // Apply search query
  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return allUnits;
    const query = searchQuery.toLowerCase();
    return allUnits.filter(u => 
      u.unit.toLowerCase().includes(query) ||
      u.title.toLowerCase().includes(query) ||
      u.outcomes.some(o => o.toLowerCase().includes(query)) ||
      u.activities.toLowerCase().includes(query)
    );
  }, [allUnits, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allUnits.length;
    if (total === 0) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, pct: 0 };

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    allUnits.forEach(u => {
      const status = progressState.status[u.title] || 'Not Started';
      if (status === 'Completed') completed++;
      else if (status === 'In Progress') inProgress++;
      else notStarted++;
    });

    return {
      total,
      completed,
      inProgress,
      notStarted,
      pct: Math.round((completed / total) * 100)
    };
  }, [allUnits, progressState.status]);

  // Calculate class average competency score across all units mapped for this course
  const overallClassMastery = useMemo(() => {
    if (activeStudents.length === 0) return null;
    let sum = 0;
    let count = 0;
    
    activeStudents.forEach(student => {
      if (student.competencies) {
        Object.values(student.competencies).forEach(score => {
          sum += score;
          count++;
        });
      }
    });

    return count > 0 ? parseFloat((sum / count).toFixed(1)) : null;
  }, [activeStudents]);

  // Determine standard badge details for the curriculum framework
  const curriculumDetails = useMemo(() => {
    switch (activeCurriculum) {
      case 'CBC':
        return {
          title: 'CBC (Competency Based Curriculum)',
          subtitle: 'Kenya Institute of Curriculum Development (KICD)',
          desc: 'Formative competencies focusing on learner outcomes, value-based education, and core competencies (e.g., communication, critical thinking, citizenship).',
          badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
          accent: 'emerald'
        };
      case 'KNEC':
        return {
          title: 'KNEC (Kenya National Examinations Council)',
          subtitle: 'Traditional Academic Framework (8-4-4 Standards)',
          desc: 'Continuous Assessment Tests (CATs) and summative examinations mapped to terminal performance grades.',
          badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
          accent: 'indigo'
        };
      case 'TVET_CDACC':
        return {
          title: 'TVET CDACC (Curriculum Development, Assessment & Certification Council)',
          subtitle: 'Competency-Based Education and Training (CBET)',
          desc: 'Occupational standards designed for vocational mastery. Focuses on hand-on practice, safety portfolios, and workplace execution checklists.',
          badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          accent: 'amber'
        };
      case 'NITA':
        return {
          title: 'NITA (National Industrial Training Authority)',
          subtitle: 'Industrial Skills Testing and Certification',
          desc: 'Trade testing structure (Grade III, II, I) for commercial trades. Heavy emphasis on safety code execution and timed trade test practical tasks.',
          badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
          accent: 'rose'
        };
      default:
        return {
          title: 'Custom Curriculum',
          subtitle: 'Institution Preset Outline',
          desc: 'Customized educational pathways adjusted to organizational standards.',
          badgeBg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
          accent: 'slate'
        };
    }
  }, [activeCurriculum]);

  const isVocationalContext = activeCurriculum === 'TVET_CDACC' || activeCurriculum === 'NITA';

  // Calculate stats for a single unit
  const getUnitClassMastery = (unitTitle: string) => {
    const compKey = getMappedCompetencyKey(unitTitle, activeSubject);
    if (activeStudents.length === 0) return { avg: null, percentCompetent: 0, count: 0 };
    
    let totalScore = 0;
    let gradedCount = 0;

    activeStudents.forEach(s => {
      const score = s.competencies?.[compKey];
      if (score !== undefined) {
        totalScore += score;
        gradedCount++;
      }
    });

    const avg = gradedCount > 0 ? parseFloat((totalScore / gradedCount).toFixed(1)) : null;
    const competentCount = activeStudents.filter(s => (s.competencies?.[compKey] || 0) >= 3).length;
    const percentCompetent = gradedCount > 0 ? Math.round((competentCount / gradedCount) * 100) : 0;

    return {
      avg,
      percentCompetent,
      count: gradedCount
    };
  };

  // Schedule slot creation handler
  const handleScheduleUnitClass = async () => {
    if (!activeScheduleUnit || !onAddScheduleSlot) return;
    
    const isWeekMode = activeScheduleUnit.week !== undefined;
    const desc = isWeekMode ? `Week ${activeScheduleUnit.week}` : `Session ${activeScheduleUnit.session}`;
    const slotTitle = `${activeSubject}: ${activeScheduleUnit.title} (${desc})`;

    // Get default values for grade and studentGroup from current subject
    const dummyStudent = activeStudents[0];
    const grade = dummyStudent?.grade || 'L3';
    const studentGroup = dummyStudent?.studentGroup || 'Academy';

    const slotPayload = {
      title: slotTitle,
      dayOfWeek: Number(scheduleDay),
      startTime: scheduleTime,
      durationMinutes: Number(scheduleDuration),
      grade,
      studentGroup,
      subject: activeSubject,
      status: 'Pending' as const,
    };

    try {
      await onAddScheduleSlot(slotPayload);
      setActiveScheduleUnit(null);
    } catch (err) {
      console.error("Failed to add schedule slot", err);
    }
  };

  // Custom unit addition handler
  const handleAddCustomUnit = () => {
    if (!customUnitTitle || !customUnitCode) return;

    const parsedOutcomes = customUnitOutcomes
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    const newUnit: CurriculumUnit = {
      unit: customUnitCode,
      title: customUnitTitle,
      outcomes: parsedOutcomes.length > 0 ? parsedOutcomes : ['Demonstrate knowledge of general guidelines'],
      activities: customUnitActivities || 'Practical session and Q&A review.',
    };

    if (activeCurriculum === 'TVET_CDACC' || activeCurriculum === 'NITA') {
      newUnit.session = Number(customUnitNumber);
    } else {
      newUnit.week = Number(customUnitNumber);
    }

    const nextCustomList = [...progressState.customUnits, newUnit];
    saveProgress({ customUnits: nextCustomList });

    // Reset form & close
    setCustomUnitTitle('');
    setCustomUnitCode('');
    setCustomUnitNumber(allUnits.length + 1);
    setCustomUnitOutcomes('');
    setCustomUnitActivities('');
    setIsCustomUnitModalOpen(false);
  };

  // Custom unit deletion
  const handleDeleteCustomUnit = (unitTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the custom unit "${unitTitle}"?`)) {
      const nextCustomList = progressState.customUnits.filter(u => u.title !== unitTitle);
      
      // Clean up local progress storage for this unit
      const nextStatus = { ...progressState.status };
      const nextNotes = { ...progressState.notes };
      const nextResources = { ...progressState.attachedResources };
      const nextCompletedOutcomes = { ...progressState.completedOutcomes };

      delete nextStatus[unitTitle];
      delete nextNotes[unitTitle];
      delete nextResources[unitTitle];
      delete nextCompletedOutcomes[unitTitle];

      saveProgress({
        status: nextStatus,
        notes: nextNotes,
        attachedResources: nextResources,
        completedOutcomes: nextCompletedOutcomes,
        customUnits: nextCustomList
      });
    }
  };

  // Trigger simulated AI lesson planning guide
  const handleGenerateAILessonGuide = (unit: CurriculumUnit) => {
    setActiveAIUnit(unit);
    setIsGeneratingAI(true);
    setAiResult(null);

    // Simulate standard streaming layout generator
    setTimeout(() => {
      const mappedComp = getCompetencyLabel(getMappedCompetencyKey(unit.title, activeSubject));
      const outcomesList = unit.outcomes.map(o => `• ${o}`).join('\n');
      
      const plan = `
### 📚 5E LESSON PLAN OUTLINE
**Topic**: ${unit.title} (${unit.unit})
**Core Competency Focus**: ${mappedComp}

#### 1. Engage (5-10 Mins)
* **Hook Question**: Ask students if they've ever seen a real installation/application of this concept in local shops or enterprises.
* **Demonstration**: Show a primary hand tool or schematic and ask learners to troubleshoot a common failure.

#### 2. Explore (15-20 Mins)
* **Group Task**: Divide class into groups of 3-4 students.
* **Hands-on Lab**: Perform a mock exercise matching: *"${unit.activities}"*. Encourage teamwork.

#### 3. Explain (15 Mins)
* **Key Theory**: Explain safety practices, circuit parameters, or software commands.
* **Outcomes Alignment**: Cover outcomes:
${outcomesList}

#### 4. Elaborate (15 Mins)
* **Contextual Application**: Connect with Kenyan occupational standards (e.g. Energy Act guidelines or KICD CBC frameworks). Explain how this trade or theory drives local job creation (Mtaani).

#### 5. Evaluate (5 Mins)
* **Check for Understanding**: Conduct a rapid oral review of outcomes or check student logs.
      `.trim();

      const quiz = [
        {
          q: `Which of the following is a primary safety standard/best practice related to ${unit.title}?`,
          a: ['Wear correct PPE & check line voltage', 'Ignore structural checks', 'Proceed without testing', 'Use incorrect wire sizing']
        },
        {
          q: `What is the expected outcome of masterfully completing this unit?`,
          a: ['Achieving occupational competency in the standard task', 'Scribbling random notes', 'Skiping practical tasks', 'Memorizing formulas without practice']
        }
      ];

      setAiResult({ plan, quiz });
      setIsGeneratingAI(false);
    }, 1500);
  };

  // Link/unlink resources to a unit
  const toggleResourceAttachment = (unitTitle: string, docId: string) => {
    const list = progressState.attachedResources[unitTitle] || [];
    const nextList = list.includes(docId) 
      ? list.filter(id => id !== docId) 
      : [...list, docId];
    
    const nextResources = { ...progressState.attachedResources, [unitTitle]: nextList };
    saveProgress({ attachedResources: nextResources });
  };

  // Resolve attached resources objects
  const getAttachedResourceObjects = (unitTitle: string) => {
    const ids = progressState.attachedResources[unitTitle] || [];
    return data.library.filter(doc => ids.includes(doc.id));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 custom-scrollbar space-y-6 bg-[var(--md-sys-color-background)]">
      <PageHeader 
        title="Curriculum Hub" 
        subtitle="Manage and audit active syllabus modules, lessons, and student competency outcomes"
      />

      {/* Curriculum Banner and Progress widgets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Preset Summary */}
        <div className="xl:col-span-2 relative overflow-hidden rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-6 lg:p-8 shadow-sm flex flex-col justify-between">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[var(--md-sys-color-primary-container)] opacity-30 blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={clsx("px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border", curriculumDetails.badgeBg)}>
                {curriculumDetails.title}
              </span>
              {isVocationalContext && (
                <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 animate-pulse">
                  <Zap size={10} className="fill-current" /> Vocational Preset
                </span>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-bold font-google text-[var(--md-sys-color-on-surface)]">
                {curriculumDetails.subtitle}
              </h2>
              <p className="text-xs leading-relaxed text-[var(--md-sys-color-on-surface-variant)] mt-1.5">
                {curriculumDetails.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6 border-t border-[var(--md-sys-color-outline-variant)]/60 pt-4">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] font-semibold">
              Subject Focus: <strong className="text-[var(--md-sys-color-primary)]">{activeSubject}</strong>
            </span>
            
            <button
              onClick={() => onNavigate('settings')}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--md-sys-color-primary)] text-white hover:opacity-90 active:scale-95 transition-all text-xs font-google font-bold shadow-md shadow-indigo-500/15"
            >
              <RefreshCw size={12} /> Change Preset
            </button>
          </div>
        </div>

        {/* Right Column: Dynamic Progress & Class Mastery widgets */}
        <div className="relative overflow-hidden rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Syllabus Coverage</h3>
            
            {/* Progress Bar & Badges */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black font-google text-[var(--md-sys-color-on-surface)]">{stats.pct}%</span>
                <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-bold">{stats.completed} of {stats.total} units</span>
              </div>
              <div className="w-full bg-[var(--md-sys-color-outline-variant)]/40 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.pct}%` }} 
                />
              </div>
            </div>

            {/* Badges Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
                <div className="text-[9px] text-[var(--md-sys-color-secondary)] mt-0.5">Completed</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{stats.inProgress}</div>
                <div className="text-[9px] text-[var(--md-sys-color-secondary)] mt-0.5">In Progress</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-500/5 border border-slate-500/10">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">{stats.notStarted}</div>
                <div className="text-[9px] text-[var(--md-sys-color-secondary)] mt-0.5">Pending</div>
              </div>
            </div>
          </div>

          {/* Average Class Competency Integration */}
          {overallClassMastery !== null && (
            <div className="border-t border-[var(--md-sys-color-outline-variant)]/60 pt-4 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-[10px] font-bold text-[var(--md-sys-color-on-surface)] leading-none">Class Competency Average</h4>
                  <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">Average score across assessed units</p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-black text-indigo-700 dark:text-indigo-400">
                {overallClassMastery} / 4.0
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control bar: subject filtering, custom syllabus button, search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar flex-1">
          {subjects.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">No active subjects loaded.</p>
          ) : (
            subjects.map(sub => {
              const isActive = activeSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setActiveSubject(sub);
                    setSearchQuery('');
                  }}
                  className={clsx(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-google font-bold text-xs whitespace-nowrap border transition-all duration-200 active:scale-95",
                    isActive
                      ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-primary)] shadow-sm"
                      : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                  )}
                >
                  <span className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-sm", getSubjectIconBg(sub))}>
                    {getSubjectEmoji(sub)}
                  </span>
                  <span>{sub}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Custom lesson creation button & search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setCustomUnitNumber(allUnits.length + 1);
              setIsCustomUnitModalOpen(true);
            }}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white text-xs font-google font-bold shadow-md shadow-violet-500/10 transition-all active:scale-95"
          >
            <Plus size={14} /> Add Custom Unit
          </button>
          
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="text"
              placeholder="Search syllabus units, outcomes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all placeholder:text-[var(--md-sys-color-on-surface-variant)]"
            />
          </div>
        </div>
      </div>

      {/* Main Units/Sessions checklist */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${activeSubject}-${searchQuery}-${allUnits.length}`}
        className="space-y-4"
      >
        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
            <BookOpen size={48} className="text-[var(--md-sys-color-outline)] mb-3 animate-pulse" />
            <h3 className="font-google font-bold text-sm text-[var(--md-sys-color-on-surface)]">No modules found</h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm">
              We couldn't find any syllabus items matching your query or selected course subject.
            </p>
          </div>
        ) : (
          filteredUnits.map((u, idx) => {
            const isExpanded = expandedUnits[u.title] !== false; // Default expanded for search visibility
            const status = progressState.status[u.title] || 'Not Started';
            const unitNotes = progressState.notes[u.title] || '';
            const outcomeChecked = progressState.completedOutcomes[u.title] || {};
            const attachedDocs = getAttachedResourceObjects(u.title);
            const isCustom = progressState.customUnits.some(custom => custom.title === u.title);
            
            // Dynamic competency scores stats
            const mastery = getUnitClassMastery(u.title);
            
            return (
              <motion.div
                key={u.title}
                variants={cardVariants}
                className={clsx(
                  "overflow-hidden rounded-2xl border transition-all duration-200",
                  status === 'Completed' ? "border-emerald-300 dark:border-emerald-950/40 bg-emerald-500/[0.01]" : 
                  status === 'In Progress' ? "border-amber-300 dark:border-amber-950/40 bg-amber-500/[0.01]" : 
                  "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] shadow-sm hover:border-[var(--md-sys-color-outline)]"
                )}
              >
                {/* Card Header area */}
                <div 
                  className={clsx(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 lg:p-5 select-none transition-colors duration-150 border-b border-[var(--md-sys-color-outline-variant)]/60 cursor-pointer",
                    status === 'Completed' ? "bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]" :
                    status === 'In Progress' ? "bg-amber-500/[0.03] hover:bg-amber-500/[0.06]" :
                    "bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-variant)]"
                  )}
                  onClick={() => toggleUnit(u.title)}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Badge for Week/Session */}
                    <div className={clsx(
                      "p-2.5 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5 min-w-[42px] min-h-[42px]",
                      status === 'Completed' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      status === 'In Progress' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]"
                    )}>
                      {u.week || u.session ? (
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[8px] font-black uppercase tracking-widest">
                            {u.week ? 'WEEK' : 'SESS'}
                          </span>
                          <span className="text-sm font-black mt-0.5">
                            {u.week || u.session}
                          </span>
                        </div>
                      ) : (
                        <Layers size={18} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">
                          {u.unit}
                        </span>
                        {isCustom && (
                          <span className="px-1.5 py-0.5 text-[8px] font-black uppercase bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20 rounded">
                            Custom Lesson
                          </span>
                        )}
                        {status === 'In Progress' && (
                          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Active Class
                          </span>
                        )}
                        {status === 'Completed' && (
                          <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            <Check size={10} className="stroke-[3]" /> Taught
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 font-google truncate">
                        {u.title}
                      </h3>
                    </div>
                  </div>

                  {/* Right Header: Interactive status selector & action buttons */}
                  <div className="flex items-center gap-3 mt-3 sm:mt-0 ml-12 sm:ml-4" onClick={e => e.stopPropagation()}>
                    {/* Status Pill switcher */}
                    <div className="flex bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-0.5 shadow-inner">
                      {(['Not Started', 'In Progress', 'Completed'] as const).map(s => {
                        const isSel = status === s;
                        return (
                          <button
                            key={s}
                            onClick={() => updateUnitStatus(u.title, s)}
                            className={clsx(
                              "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all",
                              isSel ? (
                                s === 'Completed' ? "bg-emerald-500 text-white shadow-sm" :
                                s === 'In Progress' ? "bg-amber-500 text-white shadow-sm" :
                                "bg-slate-500 text-white shadow-sm"
                              ) : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                            )}
                          >
                            {s === 'Not Started' ? 'Pending' : s === 'In Progress' ? 'Teaching' : 'Done'}
                          </button>
                        );
                      })}
                    </div>

                    {isCustom && (
                      <button
                        onClick={() => handleDeleteCustomUnit(u.title)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 active:scale-90 transition-all"
                        title="Delete custom unit"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    <div className="text-[var(--md-sys-color-on-surface-variant)] cursor-pointer" onClick={() => toggleUnit(u.title)}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </div>

                {/* Card Body area */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="p-5 space-y-5 bg-[var(--md-sys-color-surface-container-low)]/30 border-t border-[var(--md-sys-color-outline-variant)]/60">
                        {/* Upper row: Outcomes & Suggested Activities */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Outcomes List with Checkboxes */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1.5">
                              <ClipboardList size={12} /> Sub-Competency Outcomes checklist
                            </h4>
                            <div className="grid grid-cols-1 gap-2">
                              {u.outcomes.map((outcome, oIdx) => {
                                const isChecked = !!outcomeChecked[oIdx];
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => toggleOutcomeChecked(u.title, oIdx)}
                                    className={clsx(
                                      "flex gap-3 items-start p-3 rounded-xl border text-left text-xs transition-all active:scale-[0.99]",
                                      isChecked 
                                        ? "bg-emerald-500/5 border-emerald-500/20 text-[var(--md-sys-color-on-surface)]" 
                                        : "bg-[var(--md-sys-color-surface-container)] border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                    )}
                                  >
                                    <div className={clsx(
                                      "mt-0.5 flex-shrink-0 rounded-md p-0.5",
                                      isChecked ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--md-sys-color-secondary)]"
                                    )}>
                                      {isChecked ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                                    </div>
                                    <span className={clsx("leading-tight", isChecked && "line-through opacity-70")}>{outcome}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Suggested Activities */}
                          <div className="space-y-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1.5">
                                <Sparkles size={12} /> Recommended Lesson Execution
                              </h4>
                              <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]">
                                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                                  {u.activities}
                                </p>
                              </div>
                            </div>

                            {/* Timetable schedule action & AI lesson planner triggers */}
                            <div className="flex flex-wrap gap-2.5 pt-2">
                              {onAddScheduleSlot && (
                                <button
                                  onClick={() => setActiveScheduleUnit(u)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)] active:scale-95 text-xs text-[var(--md-sys-color-on-surface)] font-bold transition-all shadow-sm"
                                >
                                  <Calendar size={13} className="text-[var(--md-sys-color-primary)]" /> Schedule Class
                                </button>
                              )}

                              {preferences.enableAI && (
                                <button
                                  onClick={() => handleGenerateAILessonGuide(u)}
                                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/40 active:scale-95 text-xs font-bold transition-all shadow-sm"
                                >
                                  <Brain size={13} className="animate-pulse" /> AI Lesson Guide
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Lower row: Class competency status, attached resources & lesson notes */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/60">
                          
                          {/* Unit Mastery Status */}
                          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] leading-none">Class Competency Details</h4>
                                <span className="text-[8.5px] font-black uppercase tracking-wider text-[var(--md-sys-color-primary)] font-mono">
                                  {getMappedCompetencyKey(u.title, activeSubject)}
                                </span>
                              </div>
                              <p className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)]">Mapped skill graded on the Assessment tab</p>
                            </div>

                            <div className="space-y-1.5">
                              {mastery.avg !== null ? (
                                <>
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-lg font-black font-google text-[var(--md-sys-color-on-surface)]">{mastery.avg} / 4.0</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{mastery.percentCompetent}% Competent</span>
                                  </div>
                                  <div className="w-full bg-[var(--md-sys-color-outline-variant)]/40 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={clsx(
                                        "h-full rounded-full transition-all duration-300",
                                        mastery.avg >= 3.0 ? "bg-emerald-500" : mastery.avg >= 2.0 ? "bg-amber-500" : "bg-red-500"
                                      )}
                                      style={{ width: `${(mastery.avg / 4) * 100}%` }} 
                                    />
                                  </div>
                                  <p className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">Based on {mastery.count} active student grades</p>
                                </>
                              ) : (
                                <div className="py-2 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic bg-[var(--md-sys-color-surface-container-low)] rounded-lg">
                                  No student grades registered yet
                                </div>
                              )}
                            </div>

                            {onUpdateStudent && (
                              <button
                                onClick={() => setActiveAssessUnit(u)}
                                className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-[var(--md-sys-color-primary)]/10 hover:bg-[var(--md-sys-color-primary)]/20 text-[var(--md-sys-color-primary)] text-[11px] font-bold transition-colors active:scale-95"
                              >
                                <Users size={12} /> Grade / Assess Unit
                              </button>
                            )}
                          </div>

                          {/* Attached Resources */}
                          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)]">Lesson Resources</h4>
                              <p className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)]">Study guides & reference sheets</p>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[85px] space-y-1.5 py-1 custom-scrollbar">
                              {attachedDocs.length === 0 ? (
                                <p className="text-[10.5px] text-[var(--md-sys-color-on-surface-variant)] italic text-center py-4">No documents linked</p>
                              ) : (
                                attachedDocs.map(doc => (
                                  <a
                                    key={doc.id}
                                    href={doc.downloadUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/60 text-xs text-[var(--md-sys-color-on-surface)] transition-colors group"
                                  >
                                    <span className="truncate font-bold font-google flex-1 pr-2">{doc.title}</span>
                                    <ExternalLink size={11} className="text-[var(--md-sys-color-secondary)] group-hover:text-[var(--md-sys-color-primary)] flex-shrink-0" />
                                  </a>
                                ))
                              )}
                            </div>

                            <button
                              onClick={() => setActiveResourceUnit(u)}
                              className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-colors active:scale-95"
                            >
                              <FileText size={12} /> Link / Edit Documents
                            </button>
                          </div>

                          {/* Instructor Notes */}
                          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-col justify-between space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] leading-none">Instructor Notes</h4>
                            <textarea
                              placeholder="Type reminders or materials to bring for this lesson..."
                              value={unitNotes}
                              onChange={e => updateUnitNotes(u.title, e.target.value)}
                              className="flex-1 w-full p-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all resize-none min-h-[80px]"
                            />
                            <div className="text-[8.5px] text-[var(--md-sys-color-on-surface-variant)] italic text-right font-medium">Auto-saves locally</div>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* MODAL 1: Quick Student Assessment */}
      {activeAssessUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-2xl w-full max-w-xl animate-fade-in flex flex-col max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-6 border-b border-[var(--md-sys-color-outline-variant)] flex-shrink-0 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-google text-[var(--md-sys-color-on-surface)]">
                  Assess Unit Competency
                </h3>
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                  Grade students on <strong className="text-[var(--md-sys-color-primary)]">{getCompetencyLabel(getMappedCompetencyKey(activeAssessUnit.title, activeSubject))}</strong>
                </p>
              </div>
              <button 
                onClick={() => setActiveAssessUnit(null)}
                className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl transition-colors text-[var(--md-sys-color-on-surface-variant)] text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {activeStudents.length === 0 ? (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic text-center py-8">
                  No students enrolled in this course/subject.
                </p>
              ) : (
                activeStudents.map(student => {
                  const compKey = getMappedCompetencyKey(activeAssessUnit.title, activeSubject);
                  const currentScore = student.competencies?.[compKey] || 1;
                  
                  return (
                    <div 
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary)]/10 text-[var(--md-sys-color-primary)] font-black text-xs flex items-center justify-center">
                          {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">{student.name}</h4>
                          <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Level: {student.grade} • Lot {student.lot}</p>
                        </div>
                      </div>

                      {/* 4-step rating switcher */}
                      <div className="flex bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-xl p-0.5 shadow-inner self-end sm:self-center">
                        {([1, 2, 3, 4] as const).map(level => {
                          const isSel = currentScore === level;
                          const labels = ['Emerging', 'Developing', 'Competent', 'Mastered'];
                          const colors = [
                            'bg-red-500 text-white',
                            'bg-amber-500 text-white',
                            'bg-blue-500 text-white',
                            'bg-emerald-500 text-white'
                          ];
                          
                          return (
                            <button
                              key={level}
                              onClick={async () => {
                                if (!onUpdateStudent) return;
                                const updatedStudent = {
                                  ...student,
                                  competencies: {
                                    ...(student.competencies || {}),
                                    [compKey]: level
                                  }
                                };
                                await onUpdateStudent(updatedStudent, false);
                              }}
                              className={clsx(
                                "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all",
                                isSel ? colors[level - 1] : "text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]"
                              )}
                              title={labels[level - 1]}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-[var(--md-sys-color-surface-container-highest)] p-4 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end">
              <button 
                onClick={() => setActiveAssessUnit(null)}
                className="px-5 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-white text-xs font-bold active:scale-95 shadow-md shadow-indigo-500/10 hover:opacity-90 transition-all"
              >
                Done / Save Grades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Timetable Schedule booking */}
      {activeScheduleUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-2xl w-full max-w-md animate-fade-in flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-google text-[var(--md-sys-color-on-surface)]">
                  Schedule Curriculum Class
                </h3>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Book a session slot for the current unit
                </p>
              </div>
              <button 
                onClick={() => setActiveScheduleUnit(null)}
                className="p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors text-[var(--md-sys-color-on-surface-variant)] text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-1">
                <span className="text-[8px] font-black uppercase bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20">
                  Unit target
                </span>
                <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] mt-1">{activeScheduleUnit.title}</h4>
              </div>

              {/* Day of Week */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Day of the Week</label>
                <select
                  value={scheduleDay}
                  onChange={e => setScheduleDay(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all cursor-pointer font-bold font-google"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>

              {/* Start Time & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Start Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all font-bold font-google"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Duration</label>
                  <select
                    value={scheduleDuration}
                    onChange={e => setScheduleDuration(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all cursor-pointer font-bold font-google"
                  >
                    <option value={60}>60 Minutes (1 Hr)</option>
                    <option value={90}>90 Minutes (1.5 Hrs)</option>
                    <option value={120}>120 Minutes (2 Hrs)</option>
                    <option value={180}>180 Minutes (3 Hrs)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface-container-highest)] p-4 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end gap-2">
              <button 
                onClick={() => setActiveScheduleUnit(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={scheduleTime ? handleScheduleUnitClass : undefined}
                disabled={!scheduleTime}
                className="px-5 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-white text-xs font-bold active:scale-95 shadow-md shadow-indigo-500/10 hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar size={13} /> Book to Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AI Lesson Guide & Quiz */}
      {activeAIUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-2xl w-full max-w-2xl animate-fade-in flex flex-col max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-6 text-white flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Brain size={22} className="animate-pulse text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-google">
                    PRISM AI Lesson Guide
                  </h3>
                  <p className="text-[10px] text-indigo-100 font-medium">
                    Syllabus Co-Pilot • {activeAIUnit.title}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveAIUnit(null)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all text-white active:scale-95"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {isGeneratingAI ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <RefreshCw className="animate-spin text-indigo-600" size={32} />
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-bold animate-pulse">
                    Analyzing syllabus guidelines and structuring class pedagogy...
                  </p>
                </div>
              ) : aiResult ? (
                <div className="space-y-6">
                  {/* Lesson plan text */}
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed text-[var(--md-sys-color-on-surface-variant)] whitespace-pre-wrap">
                    {aiResult.plan}
                  </div>

                  {/* Formative assessment quiz */}
                  <div className="space-y-3 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1">
                      <HelpCircle size={13} /> Classroom Concept Evaluation Quiz
                    </h4>
                    
                    <div className="space-y-4">
                      {aiResult.quiz.map((q, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-2.5">
                          <h5 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] leading-normal">
                            Q{idx + 1}: {q.q}
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                            {q.a.map((ans, aIdx) => (
                              <div 
                                key={aIdx} 
                                className={clsx(
                                  "p-2.5 rounded-xl border transition-colors leading-tight",
                                  aIdx === 0 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-bold" 
                                    : "bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 text-[var(--md-sys-color-on-surface-variant)]"
                                )}
                              >
                                {ans} {aIdx === 0 && '✓'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-[var(--md-sys-color-surface-container-highest)] p-4 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end">
              <button 
                onClick={() => setActiveAIUnit(null)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold active:scale-95 shadow-md shadow-indigo-500/10 hover:opacity-90 transition-all"
              >
                Copy to Lesson Planner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Link / Edit Documents */}
      {activeResourceUnit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-2xl w-full max-w-md animate-fade-in flex flex-col max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-google text-[var(--md-sys-color-on-surface)]">
                  Link Library Documents
                </h3>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Associate active materials with this lesson unit
                </p>
              </div>
              <button 
                onClick={() => setActiveResourceUnit(null)}
                className="p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors text-[var(--md-sys-color-on-surface-variant)] text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              {data.library.length === 0 ? (
                <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] italic text-center py-6">
                  No documents found in the PRISM Library. Use the Resources tab to upload files.
                </p>
              ) : (
                data.library.map(doc => {
                  const attachedList = progressState.attachedResources[activeResourceUnit.title] || [];
                  const isLinked = attachedList.includes(doc.id);
                  
                  return (
                    <button
                      key={doc.id}
                      onClick={() => toggleResourceAttachment(activeResourceUnit.title, doc.id)}
                      className={clsx(
                        "w-full flex items-center justify-between p-3 rounded-2xl border text-left text-xs transition-all active:scale-[0.99]",
                        isLinked
                          ? "bg-indigo-500/5 border-indigo-500/20 text-[var(--md-sys-color-on-surface)] font-semibold"
                          : "bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 text-[var(--md-sys-color-on-surface-variant)]"
                      )}
                    >
                      <div className="truncate flex-1 pr-3">
                        <span className="block truncate text-xs text-[var(--md-sys-color-on-surface)]">{doc.title}</span>
                        <span className="block text-[9px] text-[var(--md-sys-color-secondary)] uppercase mt-0.5">{doc.category} • {doc.fileName.split('.').pop()?.toUpperCase()}</span>
                      </div>
                      
                      <div className={clsx(
                        "rounded-md p-0.5 flex-shrink-0",
                        isLinked ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--md-sys-color-secondary)]/50"
                      )}>
                        {isLinked ? <CheckSquare size={16} /> : <Square size={16} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="bg-[var(--md-sys-color-surface-container-highest)] p-4 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end">
              <button 
                onClick={() => setActiveResourceUnit(null)}
                className="px-5 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-white text-xs font-bold active:scale-95 shadow-md shadow-indigo-500/10 hover:opacity-90 transition-all"
              >
                Save Links
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Add Custom Unit */}
      {isCustomUnitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline)] shadow-2xl w-full max-w-md animate-fade-in flex flex-col max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-[var(--md-sys-color-surface-variant)] to-[var(--md-sys-color-surface)] p-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-google text-[var(--md-sys-color-on-surface)]">
                  Add Custom Lesson Unit
                </h3>
                <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                  Append a customized syllabus module to the current curriculum
                </p>
              </div>
              <button 
                onClick={() => setIsCustomUnitModalOpen(false)}
                className="p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors text-[var(--md-sys-color-on-surface-variant)] text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {/* Unit Code & Unit Number */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Module/Unit Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SL-MOD-5"
                    value={customUnitCode}
                    onChange={e => setCustomUnitCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">
                    {activeCurriculum === 'TVET_CDACC' || activeCurriculum === 'NITA' ? 'Session' : 'Week'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={customUnitNumber}
                    onChange={e => setCustomUnitNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all font-bold"
                  />
                </div>
              </div>

              {/* Lesson Title */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Lesson / Unit Title</label>
                <input
                  type="text"
                  placeholder="e.g. Solar Tracker System Installation"
                  value={customUnitTitle}
                  onChange={e => setCustomUnitTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all font-bold"
                />
              </div>

              {/* Competency Outcomes */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">
                  Expected Competency Outcomes (One per line)
                </label>
                <textarea
                  placeholder="Identify core tracking metrics&#10;Assemble tracker hardware brackets&#10;Program tilt limits on actuators"
                  value={customUnitOutcomes}
                  onChange={e => setCustomUnitOutcomes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all resize-none min-h-[90px]"
                />
              </div>

              {/* Suggested Activities */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Suggested Student Activities</label>
                <textarea
                  placeholder="Review assembly schematics, setup limit switches, verify actuator torque ranges in groups."
                  value={customUnitActivities}
                  onChange={e => setCustomUnitActivities(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all resize-none min-h-[60px]"
                />
              </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface-container-highest)] p-4 border-t border-[var(--md-sys-color-outline-variant)] flex justify-end gap-2">
              <button 
                onClick={() => setIsCustomUnitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomUnit}
                disabled={!customUnitTitle || !customUnitCode}
                className="px-5 py-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-white text-xs font-bold active:scale-95 shadow-md shadow-indigo-500/10 hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusCircle size={13} /> Save Custom Unit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Curriculum;
