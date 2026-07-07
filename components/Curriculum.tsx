import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, CurriculumUnit, Student, ScheduleSlot } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from './PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, Sparkles, AlertCircle, ChevronDown, ChevronUp, 
  GraduationCap, ShieldAlert, Zap, Layers, Calendar, ClipboardList,
  CheckCircle2, Circle, PlayCircle, PlusCircle, Trash2, Edit2, Brain,
  FileText, CheckSquare, Square, Users, Award, BookOpenCheck, Clock, 
  Plus, ExternalLink, HelpCircle, Send, ArrowRight, Flame, Check, RefreshCw,
  Download, Copy, Wifi, ClipboardCheck, ThumbsUp, HelpCircle as HelpIcon
} from 'lucide-react';
import { getSubjectEmoji, getSubjectIconBg } from '../utils/subjectUtils';
import clsx from 'clsx';

interface CurriculumProps {
  data: AppData;
  onNavigate: (view: string) => void;
  onUpdateStudent?: (student: Student, notify?: boolean) => Promise<void> | void;
  onAddScheduleSlot?: (slot: Omit<ScheduleSlot, 'id'>) => Promise<void> | void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
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

// 4-level competency styling
const COMPETENCY_LEVELS = {
  1: { label: 'Emerging', bg: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
  2: { label: 'Developing', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  3: { label: 'Competent', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  4: { label: 'Mastered', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' }
};

// Vocational Practical Lab task sheets pre-configured
const LAB_TASKS_PRESETS: Record<string, string[]> = {
  // Solar PV
  'Workplace Safety & Tools': ['Inspect harness & lanyard safety', 'Perform mock electrical shock response', 'Identify insulated vs non-insulated tools'],
  'Electrical Principles': ['Measure current on direct circuit', 'Calculate total load sizing for workshop', 'Verify resistor code values'],
  'Solar Panels & Battery Sizing': ['Wire two 12V batteries in series', 'Crimp male/female MC4 connectors', 'Test Voc of PV module under sun'],
  'Controllers & Inverters': ['Mount PWM charge controller', 'Configure low-voltage disconnect values', 'Test pure sine inverter waveform output'],
  'Basic Electronics': ['Test rectifier diodes with multimeter', 'Solder simple voltage divider', 'Measure solar cell irradiance angles'],
  'PV Module Sizing & Mounting': ['Assemble aluminum L-bracket roof mounts', 'Measure compass roof azimuth orientation', 'Solder bypass diodes'],
  'Trade Test Practical': ['Connect complete off-grid system board', 'Diagnose open circuit terminal fault', 'Verify grounding rod impedance'],
  
  // ICT
  'Hardware & OS': ['Assemble RAM & CPU on motherboard', 'Create bootable OS installation flash disk', 'Install local device driver packages'],
  'Networking & Web': ['Crimp RJ-45 cable under EIA/TIA 568B', 'Verify network routing using ping/tracert', 'Setup SSID security on wireless access point'],
  'Intro to Programming': ['Write standard Python while-loop', 'Define a custom class with parameters', 'Implement linear search algorithm'],
  'Data Structures': ['Implement a stack using arrays', 'Contrast binary tree search traversal time', 'Analyze bubble sort O(n^2) outputs'],
  'Database Systems': ['Draw Entity-Relationship diagrams', 'Write SQL SELECT statement with INNER JOIN', 'Normalize database to 3NF'],
  'Microsoft Word': ['Insert table of contents & footnotes', 'Perform mail merge from spreadsheet', 'Format pages with custom headers'],
  'Microsoft Excel': ['Write nested IF & VLOOKUP formulas', 'Generate scatter plot graphs', 'Perform filter & pivot sorting'],
  'Microsoft PowerPoint': ['Setup automated slide timings', 'Embed video media & animations', 'Export slides to PDF handbooks'],
  'Microsoft Access': ['Build data entry form layout', 'Write query checking date ranges', 'Generate terminal progress report']
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
  
  if (lowerSubject.includes('ict') || lowerSubject.includes('computer') || lowerSubject.includes('software') || lowerSubject.includes('web') || lowerSubject.includes('network') || lowerSubject.includes('program')) {
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

  // Feedback trackers
  const [copiedUnitTitle, setCopiedUnitTitle] = useState<string | null>(null);

  // Curriculum State Management
  const [progressState, setProgressState] = useState<{
    status: Record<string, 'Not Started' | 'In Progress' | 'Completed'>;
    notes: Record<string, string>;
    attachedResources: Record<string, string[]>;
    completedOutcomes: Record<string, Record<number, boolean>>;
    customUnits: CurriculumUnit[];
    completedLabTasks: Record<string, Record<number, boolean>>;
  }>({
    status: {},
    notes: {},
    attachedResources: {},
    completedOutcomes: {},
    customUnits: [],
    completedLabTasks: {}
  });

  // Copilot sandbox chat states
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotUnit, setCopilotUnit] = useState<CurriculumUnit | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Modals management
  const [activeAssessUnit, setActiveAssessUnit] = useState<CurriculumUnit | null>(null);
  const [activeScheduleUnit, setActiveScheduleUnit] = useState<CurriculumUnit | null>(null);
  const [activeResourceUnit, setActiveResourceUnit] = useState<CurriculumUnit | null>(null);
  const [isCustomUnitModalOpen, setIsCustomUnitModalOpen] = useState(false);

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

  const activeStudents = useMemo(() => {
    return data.students.filter(s => s.subject === activeSubject);
  }, [data.students, activeSubject]);

  // Load customizations from localStorage
  useEffect(() => {
    if (!activeSubject || !activeCurriculum) return;
    const progressKey = `prism_curr_progress_v4_${activeCurriculum}_${activeSubject}`;
    const customKey = `prism_curr_custom_units_v4_${activeCurriculum}_${activeSubject}`;

    const storedProgress = localStorage.getItem(progressKey);
    const storedCustom = localStorage.getItem(customKey);

    setProgressState({
      status: storedProgress ? JSON.parse(storedProgress).status || {} : {},
      notes: storedProgress ? JSON.parse(storedProgress).notes || {} : {},
      attachedResources: storedProgress ? JSON.parse(storedProgress).attachedResources || {} : {},
      completedOutcomes: storedProgress ? JSON.parse(storedProgress).completedOutcomes || {} : {},
      completedLabTasks: storedProgress ? JSON.parse(storedProgress).completedLabTasks || {} : {},
      customUnits: storedCustom ? JSON.parse(storedCustom) : []
    });
  }, [activeSubject, activeCurriculum]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAiTyping]);

  // Save changes to localStorage
  const saveProgress = (updates: Partial<typeof progressState>) => {
    const nextState = { ...progressState, ...updates };
    setProgressState(nextState);

    const progressKey = `prism_curr_progress_v4_${activeCurriculum}_${activeSubject}`;
    localStorage.setItem(progressKey, JSON.stringify({
      status: nextState.status,
      notes: nextState.notes,
      attachedResources: nextState.attachedResources,
      completedOutcomes: nextState.completedOutcomes,
      completedLabTasks: nextState.completedLabTasks
    }));

    if (updates.customUnits !== undefined) {
      const customKey = `prism_curr_custom_units_v4_${activeCurriculum}_${activeSubject}`;
      localStorage.setItem(customKey, JSON.stringify(nextState.customUnits));
    }
  };

  const toggleUnit = (unitTitle: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitTitle]: !prev[unitTitle] }));
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

  const toggleLabTaskChecked = (unitTitle: string, taskIdx: number) => {
    const unitTasks = progressState.completedLabTasks[unitTitle] || {};
    const nextUnitTasks = { ...unitTasks, [taskIdx]: !unitTasks[taskIdx] };
    const nextCompletedLabTasks = { ...progressState.completedLabTasks, [unitTitle]: nextUnitTasks };
    saveProgress({ completedLabTasks: nextCompletedLabTasks });
  };

  // Compile combined units
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

  // Dynamic syllabus velocity & completion date predictor
  const velocityPrediction = useMemo(() => {
    const subjectSlots = data.schedule.filter(s => s.subject === activeSubject);
    const classesPerWeek = Math.max(subjectSlots.length, 1);
    const velocityPerWeek = classesPerWeek; 
    const remainingUnits = stats.total - stats.completed;
    
    if (remainingUnits <= 0) {
      return { msg: 'Syllabus successfully completed! 🎉', isDelayed: false };
    }

    const weeksNeeded = Math.ceil(remainingUnits / velocityPerWeek);
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + (weeksNeeded * 7));

    const formattedDate = estimatedDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
    const deadlineDate = new Date('2026-11-20');
    const isDelayed = estimatedDate > deadlineDate;

    return {
      msg: `Finished in ${weeksNeeded} weeks (~${formattedDate})`,
      detail: `Velocity: ${velocityPerWeek} module/week (${classesPerWeek} classes scheduled)`,
      isDelayed,
      formattedDate
    };
  }, [data.schedule, activeSubject, stats]);

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
          title: 'CBC Framework',
          subtitle: 'Kenya Institute of Curriculum Development (KICD)',
          desc: 'Formative competencies focusing on learner outcomes, value-based education, and core competencies (e.g., communication, critical thinking, citizenship).',
          badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
          accent: 'emerald'
        };
      case 'KNEC':
        return {
          title: 'KNEC Framework',
          subtitle: 'Traditional Academic Framework (8-4-4 Standards)',
          desc: 'Continuous Assessment Tests (CATs) and summative examinations mapped to terminal performance grades.',
          badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
          accent: 'indigo'
        };
      case 'TVET_CDACC':
        return {
          title: 'TVET CDACC CBET',
          subtitle: 'Competency-Based Education and Training (CBET)',
          desc: 'Occupational standards designed for vocational mastery. Focuses on hand-on practice, safety portfolios, and workplace execution checklists.',
          badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          accent: 'amber'
        };
      case 'NITA':
        return {
          title: 'NITA Standards',
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

  // Calculate diagnostics stats for a single unit
  const getUnitClassMastery = (unitTitle: string) => {
    const compKey = getMappedCompetencyKey(unitTitle, activeSubject);
    if (activeStudents.length === 0) return { avg: null, percentCompetent: 0, count: 0, levels: { 1: 0, 2: 0, 3: 0, 4: 0 } };
    
    let totalScore = 0;
    let gradedCount = 0;
    const levels = { 1: 0, 2: 0, 3: 0, 4: 0 };

    activeStudents.forEach(s => {
      const score = s.competencies?.[compKey] as 1 | 2 | 3 | 4;
      if (score !== undefined) {
        totalScore += score;
        gradedCount++;
        levels[score] = (levels[score] || 0) + 1;
      }
    });

    const avg = gradedCount > 0 ? parseFloat((totalScore / gradedCount).toFixed(1)) : null;
    const competentCount = activeStudents.filter(s => (s.competencies?.[compKey] || 0) >= 3).length;
    const percentCompetent = gradedCount > 0 ? Math.round((competentCount / gradedCount) * 100) : 0;

    return {
      avg,
      percentCompetent,
      count: gradedCount,
      levels
    };
  };

  // Peer Pairing Recommendation calculation
  const getPeerPairings = (unitTitle: string) => {
    const compKey = getMappedCompetencyKey(unitTitle, activeSubject);
    const competent = activeStudents.filter(s => (s.competencies?.[compKey] || 0) >= 3);
    const needingHelp = activeStudents.filter(s => (s.competencies?.[compKey] || 1) <= 2);
    
    // Sort competent descending (Mastered first)
    competent.sort((a, b) => (b.competencies?.[compKey] || 0) - (a.competencies?.[compKey] || 0));
    // Sort needingHelp ascending (Emerging first)
    needingHelp.sort((a, b) => (a.competencies?.[compKey] || 0) - (b.competencies?.[compKey] || 0));

    const pairings: Array<{ tutor: Student; learner: Student }> = [];
    const minLen = Math.min(competent.length, needingHelp.length);

    for (let i = 0; i < minLen; i++) {
      pairings.push({ tutor: competent[i], learner: needingHelp[i] });
    }

    return pairings;
  };

  // NITA Trade Test Readiness Audit calculator
  const getStudentReadiness = (student: Student, unit: CurriculumUnit) => {
    const compKey = getMappedCompetencyKey(unit.title, activeSubject);
    const score = student.competencies?.[compKey] || 1;
    
    // Safety check is paramount
    const safetyScore = student.competencies?.['safetyProtocols'] || 1;
    const hasSafetyRisk = safetyScore < 3;
    
    // Practical task completion check
    const practicalTasks = LAB_TASKS_PRESETS[unit.title] || LAB_TASKS_PRESETS[unit.unit] || ['Review components', 'Perform checks'];
    const completedTasks = progressState.completedLabTasks[unit.title] || {};
    const completedCount = Object.values(completedTasks).filter(Boolean).length;
    const isLabFullyDone = completedCount >= practicalTasks.length;

    let readiness: 'ready' | 'developing' | 'risk' = 'developing';
    let detail = '';

    if (hasSafetyRisk) {
      readiness = 'risk';
      detail = 'Safety Protocols failed/unassessed. PPE Audit required!';
    } else if (score >= 3 && isLabFullyDone) {
      readiness = 'ready';
      detail = '100% Practical and Competency targets achieved.';
    } else if (!isLabFullyDone) {
      readiness = 'developing';
      detail = `Practical task sheet incomplete (${completedCount}/${practicalTasks.length} tasks done).`;
    } else {
      readiness = 'developing';
      detail = 'Requires higher competency rating (Emerging/Developing).';
    }

    return { readiness, detail };
  };

  // Local backups JSON exporter
  const handleExportBackup = () => {
    const exportData = {
      curriculumFramework: activeCurriculum,
      subject: activeSubject,
      stats,
      savedProgress: {
        status: progressState.status,
        notes: progressState.notes,
        attachedResources: progressState.attachedResources,
        completedOutcomes: progressState.completedOutcomes,
        completedLabTasks: progressState.completedLabTasks
      },
      customUnits: progressState.customUnits,
      exportTimestamp: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PRISM_CurriculumBackup_${activeSubject}_${activeCurriculum}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Official KICD/CBC Scheme of work exporter
  const handleCopySchemeOfWork = (unit: CurriculumUnit) => {
    const compKey = getMappedCompetencyKey(unit.title, activeSubject);
    const outcomesList = unit.outcomes.map(o => `* ${o}`).join('\n');
    const linkedResources = getAttachedResourceObjects(unit.title).map(doc => doc.title).join(', ') || 'PRISM Course Manual, local handouts';
    const notesText = progressState.notes[unit.title] || 'None recorded.';
    
    const template = `===========================================================
PRISM INSTRUCTOR SUITE - KENYAN SYLLABUS SCHEME OF WORK
===========================================================
Subject: ${activeSubject}
Module / Lesson: ${unit.title} (${unit.unit})
Framework: ${activeCurriculum} (CBC/TVET)

1. SPECIFIC LEARNING OUTCOMES:
${outcomesList}

2. CORE COMPETENCIES MAPPED:
* ${getCompetencyLabel(compKey)} (${compKey})
* Critical Thinking & Problem Solving
* Collaboration and Team Dynamics

3. KEY INQUIRY QUESTIONS (KIQ):
* What are the primary safety rules during ${unit.title}?
* How do we execute the lab practical tasks effectively?
* Why is accuracy critical in workshop testing?

4. LEARNING RESOURCES:
* Mapped manuals: ${linkedResources}
* Locally sourced items: Scrap metal/wire blocks, irradiance screens

5. SUGGESTED LEARNING ACTIVITIES:
* ${unit.activities}
* Group practical challenge & peer tutor inspection sheets.

6. ASSESSMENT & REFLECTION:
* Diagnostic Average score target: 3.0/4.0
* Teacher Reflection: ${notesText}
===========================================================`;

    navigator.clipboard.writeText(template);
    setCopiedUnitTitle(unit.title);
    setTimeout(() => setCopiedUnitTitle(null), 2000);
  };

  // Schedule slot creation handler
  const handleScheduleUnitClass = async () => {
    if (!activeScheduleUnit || !onAddScheduleSlot) return;
    
    const isWeekMode = activeScheduleUnit.week !== undefined;
    const desc = isWeekMode ? `Week ${activeScheduleUnit.week}` : `Session ${activeScheduleUnit.session}`;
    const slotTitle = `${activeSubject}: ${activeScheduleUnit.title} (${desc})`;

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
      
      const nextStatus = { ...progressState.status };
      const nextNotes = { ...progressState.notes };
      const nextResources = { ...progressState.attachedResources };
      const nextCompletedOutcomes = { ...progressState.completedOutcomes };
      const nextLabTasks = { ...progressState.completedLabTasks };

      delete nextStatus[unitTitle];
      delete nextNotes[unitTitle];
      delete nextResources[unitTitle];
      delete nextCompletedOutcomes[unitTitle];
      delete nextLabTasks[unitTitle];

      saveProgress({
        status: nextStatus,
        notes: nextNotes,
        attachedResources: nextResources,
        completedOutcomes: nextCompletedOutcomes,
        completedLabTasks: nextLabTasks,
        customUnits: nextCustomList
      });
    }
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

  // Copilot message sending simulated handler
  const handleSendCopilotMessage = (textToSend?: string) => {
    const msgText = textToSend || chatInput;
    if (!msgText.trim() || !copilotUnit) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiText = '';
      const t = msgText.toLowerCase();

      if (t.includes('analogy') || t.includes('analogia')) {
        aiText = `💡 **Mtaani Lesson Analogy for: "${copilotUnit.title}"**\n\nTo explain this in simple terms, compare it to a **local water supply system**:\n\n* **Voltage (Volt)** is like the water pressure in your roof tank. The higher the tank, the more force the water pushes with down the pipes.\n* **Current (Amps)** is the speed and amount of water actually flowing inside the pipe.\n* **Resistance (Ohms)** is like a narrow bend or a tap partially closed, blocking the flow.\n\n*Class Hack*: Bring a plastic bottle and pierce different sized holes to demonstrate pressure vs flow rate in real time!`;
      } else if (t.includes('swahili') || t.includes('kiswahili')) {
        aiText = `🇰🇪 **Bilingual Swahili/English Workshop Cribsheet**\n\nHere is a list of terms you can use during the lesson to bridge the understanding gap for students:\n\n* **Multimeter** ➜ Kipimo cha nguvu za umeme (mita)\n* **MC4 Connector** ➜ Kiunganishi cha waya za sola\n* **Safety harness** ➜ Mshipi wa usalama (wakati wa kupanda paa)\n* **Circuit Board** ➜ Ubao wa nyaya/seketi\n* **Inverter** ➜ Kigeuza nguvu ya umeme (kutoka DC hadi AC)\n* **Battery Bank** ➜ Mlundiko wa betri za kuhifadhi umeme\n\n*Teaching Tip*: Use these terms interchangeably when students look confused by the English technical names.`;
      } else if (t.includes('challenge') || t.includes('practical') || t.includes('mtihani')) {
        aiText = `⚡ **5-Min Practical Challenge: "${copilotUnit.title}"**\n\n**Instructions for Students**:\n1. Divide into teams of two.\n2. One student must blindfold themselves, and the other must guide them purely by verbal instruction to correctly inspect safety gear / connect cables.\n3. **Goal**: Check off the inspection list in under 180 seconds.\n\n**Evaluation Criteria**: Did the team follow safety directives? (Checks the PPE outcomes for this module).`;
      } else if (t.includes('materials') || t.includes('low cost') || t.includes('vifaa')) {
        aiText = `🪵 **Low-Cost Local Materials Guide**\n\nInstead of buying expensive demo rigs, ask students to source these items locally:\n\n* **For mounting demos**: Scrap metal brackets or wood blocks from local carpentry shops.\n* **For wiring principles**: Discarded copper wire pieces from electrician yards.\n* **For solar test shading**: Cardboard sheets or umbrellas to block sunlight during Voc testing.\n\n*Benefit*: Teaches learners resourcefulness (Mtaani resilience).`;
      } else {
        aiText = `Habari! I am your PRISM Syllabus Co-pilot. I can help you deliver a masterclass on **${copilotUnit.title}**.\n\nTry clicking one of the quick query buttons below to generate local analogies, Swahili translations, or low-cost workshop materials guide.`;
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [...prev, aiMsg]);
      setIsAiTyping(false);
    }, 1200);
  };

  const openCopilotDrawer = (unit: CurriculumUnit) => {
    setCopilotUnit(unit);
    setChatHistory([
      {
        id: 'welcome',
        sender: 'ai',
        text: `Habari Mwalimu! I am your PRISM Co-pilot. Let's design a lesson plan or practical task sheet for **${unit.title}** (${unit.unit}). How can I support you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsCopilotOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 custom-scrollbar space-y-6 bg-[var(--md-sys-color-background)] relative">
      
      {/* Header with Offline Status Indicator & JSON Backup Exporter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)] pb-4">
        <PageHeader 
          title="Curriculum Hub" 
          subtitle="Manage and audit active syllabus modules, lessons, and student competency outcomes"
        />

        {/* Offline indicator & Export Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10.5px] font-black uppercase tracking-wider">
            <Wifi size={12} className="animate-pulse" /> Offline Active
          </div>
          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] text-[10px] font-bold transition-all active:scale-95 shadow-sm"
            title="Download JSON progress report backup"
          >
            <Download size={12} /> Export Backup
          </button>
        </div>
      </div>

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

        {/* Right Column: Velocity & Coverage */}
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

            {/* Velocity Predictor Card */}
            <div className="p-3 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10 flex items-start gap-2.5">
              <Clock size={16} className={clsx("flex-shrink-0 mt-0.5", velocityPrediction.isDelayed ? "text-red-500 animate-pulse" : "text-indigo-600 dark:text-indigo-400")} />
              <div>
                <h4 className="text-[10px] font-bold text-[var(--md-sys-color-on-surface)]">Syllabus Velocity Estimate</h4>
                <p className="text-[11px] font-black text-[var(--md-sys-color-primary)] mt-0.5 leading-none">{velocityPrediction.msg}</p>
                <p className="text-[8.5px] text-[var(--md-sys-color-on-surface-variant)] mt-1">{velocityPrediction.detail}</p>
                {velocityPrediction.isDelayed && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
                    Warning: Completion delayed past Term end
                  </span>
                )}
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
            const peerPairings = getPeerPairings(u.title);
            
            // Resolve Practical Tasks checklist
            const practicalTasks = LAB_TASKS_PRESETS[u.title] || LAB_TASKS_PRESETS[u.unit] || [
              'Review theoretical components',
              'Perform visual checks',
              'Draft terminal sketch plan'
            ];
            const completedTasks = progressState.completedLabTasks[u.title] || {};
            const completedTasksCount = Object.values(completedTasks).filter(Boolean).length;
            const tasksPct = Math.round((completedTasksCount / practicalTasks.length) * 100);

            const isCopied = copiedUnitTitle === u.title;

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
                    {/* Exporter Scheme button */}
                    <button
                      onClick={() => handleCopySchemeOfWork(u)}
                      className={clsx(
                        "flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border text-[9.5px] font-black uppercase tracking-wider transition-all",
                        isCopied 
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] border-[var(--md-sys-color-outline-variant)] active:scale-95"
                      )}
                      title="Copy KICD scheme of work lesson plan to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <ClipboardCheck size={11} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> Export Lesson Plan
                        </>
                      )}
                    </button>

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
                        
                        {/* FIRST ROW: Outcomes (Syllabus) vs Practical Tasks checklist */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Outcomes Checklist */}
                          <div className="space-y-2.5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1.5">
                              <ClipboardList size={12} /> Syllabus Sub-Outcomes checklist
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

                          {/* Vocational Practical tasks checklist */}
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1.5">
                                <Zap size={12} /> Workshop Practical Task Sheet
                              </h4>
                              <span className="text-[10px] font-bold text-[var(--md-sys-color-primary)]">{tasksPct}% complete</span>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 rounded-2xl p-4 space-y-2">
                              {practicalTasks.map((task, tIdx) => {
                                const isChecked = !!completedTasks[tIdx];
                                return (
                                  <div 
                                    key={tIdx}
                                    className="flex gap-2.5 items-start text-xs text-[var(--md-sys-color-on-surface)] cursor-pointer"
                                    onClick={() => toggleLabTaskChecked(u.title, tIdx)}
                                  >
                                    <div className="mt-0.5 flex-shrink-0 text-[var(--md-sys-color-primary)]">
                                      {isChecked ? <CheckSquare size={15} /> : <Square size={15} />}
                                    </div>
                                    <span className={clsx(isChecked && "opacity-60 line-through")}>{task}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* SECOND ROW: Class diagnostics Heatmap and peer pairing recommendations */}
                        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--md-sys-color-outline-variant)]/50 pb-3">
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1.5">
                                <Users size={12} /> Class Diagnostics & Tutor pairing recommendations
                              </h4>
                              <p className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                                Mapped target skill: <strong className="text-[var(--md-sys-color-primary)] font-mono">{getMappedCompetencyKey(u.title, activeSubject)}</strong>
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {mastery.avg !== null && (
                                <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[10.5px] font-black text-indigo-700 dark:text-indigo-400">
                                  Class average: {mastery.avg} / 4.0
                                </span>
                              )}
                              {onUpdateStudent && (
                                <button
                                  onClick={() => setActiveAssessUnit(u)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--md-sys-color-primary)] text-white text-[10px] font-bold transition-all active:scale-95 hover:opacity-90 shadow-sm"
                                >
                                  <Edit2 size={11} /> Quick Grade / Assess
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Student diagnostics list & peer recommendations */}
                          {activeStudents.length === 0 ? (
                            <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] italic text-center py-4">No student records registered for this subject.</p>
                          ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                              {/* Student Grid (2 cols) */}
                              <div className="xl:col-span-2 space-y-2">
                                <h5 className="text-[9px] font-black uppercase tracking-wider text-[var(--md-sys-color-secondary)]">Student Mastery Heatmap</h5>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {activeStudents.map(student => {
                                    const compKey = getMappedCompetencyKey(u.title, activeSubject);
                                    const score = (student.competencies?.[compKey] || 1) as 1 | 2 | 3 | 4;
                                    const levelStyle = COMPETENCY_LEVELS[score];
                                    
                                    return (
                                      <div 
                                        key={student.id}
                                        className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/60 flex flex-col justify-between"
                                      >
                                        <span className="text-[10.5px] font-bold text-[var(--md-sys-color-on-surface)] truncate leading-tight">{student.name}</span>
                                        <span className={clsx("mt-1.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border text-center", levelStyle.bg)}>
                                          {levelStyle.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Peer tutoring recommendation (1 col) */}
                              <div className="p-3 rounded-2xl bg-indigo-500/[0.02] border border-indigo-500/10 space-y-2.5">
                                <h5 className="text-[9px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                                  <Flame size={12} className="text-orange-500" /> Peer-Tutoring Pairs
                                </h5>
                                
                                <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                                  {peerPairings.length === 0 ? (
                                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] italic py-4 text-center">
                                      All students are at matching competency levels. No tutoring pairs needed!
                                    </p>
                                  ) : (
                                    peerPairings.map((pair, pIdx) => (
                                      <div 
                                        key={pIdx}
                                        className="p-2 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/50 text-[10.5px] leading-tight flex items-center justify-between"
                                      >
                                        <div className="truncate flex-1 pr-1">
                                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{pair.tutor.name}</span>
                                          <span className="block text-[8px] text-[var(--md-sys-color-secondary)]">Mastered Tutor</span>
                                        </div>
                                        <ArrowRight size={10} className="text-[var(--md-sys-color-secondary)] mx-1 flex-shrink-0" />
                                        <div className="truncate flex-1 pl-1 text-right">
                                          <span className="font-bold text-amber-600 dark:text-amber-400">{pair.learner.name}</span>
                                          <span className="block text-[8px] text-[var(--md-sys-color-secondary)]">Developing Learner</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* NITA / CDACC Trade Test Readiness Panel */}
                        <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] flex items-center gap-1.5">
                            <GraduationCap size={13} /> Trade Test & Assessment Grade Readiness Audit
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {activeStudents.map(student => {
                              const audit = getStudentReadiness(student, u);
                              return (
                                <div 
                                  key={student.id}
                                  className={clsx(
                                    "p-3 rounded-xl border text-xs leading-relaxed flex flex-col justify-between space-y-1.5",
                                    audit.readiness === 'ready' ? "bg-emerald-500/[0.02] border-emerald-500/20 text-[var(--md-sys-color-on-surface)]" :
                                    audit.readiness === 'risk' ? "bg-red-500/[0.02] border-red-500/20 text-[var(--md-sys-color-on-surface)] animate-pulse" :
                                    "bg-[var(--md-sys-color-surface-container-low)] border-[var(--md-sys-color-outline-variant)]/60 text-[var(--md-sys-color-on-surface)]"
                                  )}
                                >
                                  <div className="flex justify-between items-baseline gap-2">
                                    <span className="font-bold truncate">{student.name}</span>
                                    <span className={clsx(
                                      "px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wide",
                                      audit.readiness === 'ready' ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" :
                                      audit.readiness === 'risk' ? "bg-red-500/10 text-red-700 dark:text-red-400" :
                                      "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                    )}>
                                      {audit.readiness === 'ready' ? 'Ready' : audit.readiness === 'risk' ? 'Critical Risk' : 'Developing'}
                                    </span>
                                  </div>
                                  <p className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)] leading-tight">{audit.detail}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* THIRD ROW: Attached resources, lesson notes, schedule slot booking & AI drawer triggers */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]/60">
                          
                          {/* Timetable / scheduling card */}
                          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)]">Calendar Scheduling</h4>
                              <p className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)]">Book class sessions directly to the system timetable</p>
                            </div>

                            {onAddScheduleSlot ? (
                              <button
                                onClick={() => setActiveScheduleUnit(u)}
                                className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wide active:scale-95 shadow shadow-violet-500/10 hover:opacity-95 transition-all"
                              >
                                <Calendar size={13} /> Schedule New Session
                              </button>
                            ) : (
                              <div className="py-2 text-center text-xs text-[var(--md-sys-color-on-surface-variant)] italic">
                                Timetable integrations disabled
                              </div>
                            )}

                            <button
                              onClick={() => openCopilotDrawer(u)}
                              className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold transition-colors active:scale-95"
                            >
                              <Brain size={12} /> Open AI Delivery Assistant
                            </button>
                          </div>

                          {/* Link files resources */}
                          <div className="p-4 rounded-2xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] flex flex-col justify-between space-y-4">
                            <div className="space-y-1">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)]">Attached Resources</h4>
                              <p className="text-[9.5px] text-[var(--md-sys-color-on-surface-variant)]">Study notes and manuals linked to unit</p>
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
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)] leading-none">Lesson Notes</h4>
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

      {/* SIDEBAR AI CHAT DRAWER SANDBOX */}
      <AnimatePresence>
        {isCopilotOpen && copilotUnit && (
          <>
            {/* Backdrop filter */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCopilotOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline)] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain size={22} className="animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold font-google leading-none">PRISM Syllabus Co-pilot</h3>
                    <p className="text-[10px] text-indigo-200 mt-1 truncate max-w-[280px]">{copilotUnit.title}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCopilotOpen(false)}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-white transition-all"
                >
                  Close
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
                {chatHistory.map(msg => (
                  <div 
                    key={msg.id}
                    className={clsx(
                      "flex flex-col max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed",
                      msg.sender === 'user' 
                        ? "bg-[var(--md-sys-color-primary)] text-white ml-auto rounded-tr-none" 
                        : "bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60 mr-auto rounded-tl-none whitespace-pre-wrap"
                    )}
                  >
                    <div>{msg.text}</div>
                    <span className={clsx(
                      "block text-[8px] text-right mt-1 font-mono leading-none",
                      msg.sender === 'user' ? "text-white/70" : "text-[var(--md-sys-color-secondary)]"
                    )}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isAiTyping && (
                  <div className="bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60 mr-auto rounded-2xl rounded-tl-none p-3 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] animate-bounce delay-200" />
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Preset suggestion query buttons */}
              <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)]/60 bg-[var(--md-sys-color-surface-container-low)] space-y-1.5 flex-shrink-0">
                <p className="text-[9px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">Quick Prompts Suggestions</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSendCopilotMessage('Explain this using a simple local analogy')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[10px] font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all shadow-sm"
                  >
                    ⚡ Simple Analogy
                  </button>
                  <button
                    onClick={() => handleSendCopilotMessage('Generate a Swahili/English tool cheat sheet')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[10px] font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all shadow-sm"
                  >
                    🇰🇪 Swahili Vocab
                  </button>
                  <button
                    onClick={() => handleSendCopilotMessage('Create a 5-minute hands-on class challenge')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[10px] font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all shadow-sm"
                  >
                    ⏱️ 5-Min Challenge
                  </button>
                  <button
                    onClick={() => handleSendCopilotMessage('List low-cost materials for practical exercise')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[10px] font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all shadow-sm"
                  >
                    🪵 Low-Cost Materials
                  </button>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] flex-shrink-0 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about lesson delivery..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCopilotMessage()}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all"
                />
                <button
                  onClick={() => handleSendCopilotMessage()}
                  className="p-2.5 rounded-xl bg-[var(--md-sys-color-primary)] text-white hover:opacity-90 transition-all active:scale-95"
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
