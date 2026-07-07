import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AppData, ScheduleSlot, Student, StudentGroup } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { EDUCATION_LEVELS, STUDENT_GROUPS, getLevelsForGroup, getDefaultLevel, getLevelShortLabel, getStudentGroups } from '../constants/educationLevels';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Settings, Zap, Monitor,
  Sparkles, Edit3, CheckCircle2, XCircle, Users, Copy, LayoutGrid, List,
  Maximize2, Minimize2, Check, GripVertical, RefreshCw, AlertTriangle, Box,
  FileDown, Printer, Wand2, ArrowRight, Bell, BookOpen, Brain, Cpu
} from 'lucide-react';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  DragEndEvent, useSensors, useSensor, PointerSensor, TouchSensor,
  DragStartEvent
} from '@dnd-kit/core';
import clsx from 'clsx';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import { useGoogleLogin } from '@react-oauth/google';
import { syncScheduleToGoogle } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';
import { DraggableSlot, DroppableDayColumn } from './ScheduleDnD';
import { detectConflicts, timeToMinutes, isHoliday, findBestSlot, recommendResources, calculateResourceUtilization } from '../utils/scheduling';
import { notificationService } from '../services/notificationService';
import { useTheme } from '../contexts/ThemeContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const getSubjectIcon = (subject: string, size = 14) => {
  const normalized = (subject || '').toLowerCase();
  if (normalized.includes('solar') || normalized.includes('energy') || normalized.includes('electrical')) {
    return <Zap size={size} fill="currentColor" />;
  }
  if (normalized.includes('ict') || normalized.includes('computer') || normalized.includes('tech') || normalized.includes('digital')) {
    return <Monitor size={size} />;
  }
  return <BookOpen size={size} />;
};

const getSubjectIconLarge = (subject: string, size = 24) => {
  const normalized = (subject || '').toLowerCase();
  if (normalized.includes('solar') || normalized.includes('energy') || normalized.includes('electrical')) {
    return <Zap size={size} className="text-orange-500" />;
  }
  if (normalized.includes('ict') || normalized.includes('computer') || normalized.includes('tech') || normalized.includes('digital')) {
    return <Monitor size={size} className="text-blue-500" />;
  }
  return <BookOpen size={size} className="text-violet-500" />;
};

const getSubjectEmoji = (subject: string) => {
  const normalized = (subject || '').toLowerCase();
  if (normalized.includes('solar') || normalized.includes('energy') || normalized.includes('electrical')) return '☀️';
  if (normalized.includes('ict') || normalized.includes('computer') || normalized.includes('tech') || normalized.includes('digital')) return '💻';
  if (normalized.includes('math')) return '🧮';
  if (normalized.includes('english') || normalized.includes('kiswahili') || normalized.includes('language') || normalized.includes('french')) return '🗣️';
  if (normalized.includes('science') || normalized.includes('physics') || normalized.includes('chemistry') || normalized.includes('biology')) return '🔬';
  if (normalized.includes('art') || normalized.includes('creative') || normalized.includes('music')) return '🎨';
  if (normalized.includes('history') || normalized.includes('geography') || normalized.includes('social')) return '🌍';
  if (normalized.includes('agriculture')) return '🌾';
  if (normalized.includes('business')) return '💼';
  return '📚';
};

interface ScheduleProps {
  data: AppData;
  onUpdateSchedule: (scheduleId: string, status: ScheduleSlot['status']) => void;
  onUpdateStudent?: (student: Student, notify?: boolean) => void;
  onAddSlot?: (slot: Omit<ScheduleSlot, 'id'>) => void;
  onEditSlot?: (slot: ScheduleSlot) => void;
  onDeleteSlot?: (slotId: string) => void;
  onResetSchedule?: () => void;
  onNavigate?: (view: string) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const FULL_DAY_HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const TIME_OPTIONS_15MIN = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const CLASS_COLORS = [
  { name: 'Coral', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-l-red-500', text: 'text-red-700 dark:text-red-400', accent: '#ef4444', dot: 'bg-red-500' },
  { name: 'Mint', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', accent: '#10b981', dot: 'bg-emerald-500' },
  { name: 'Lavender', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-l-violet-500', text: 'text-violet-700 dark:text-violet-400', accent: '#8b5cf6', dot: 'bg-violet-500' },
  { name: 'Sky', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-l-blue-500', text: 'text-blue-700 dark:text-blue-400', accent: '#3b82f6', dot: 'bg-blue-500' },
  { name: 'Amber', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-l-orange-500', text: 'text-orange-700 dark:text-orange-400', accent: '#f97316', dot: 'bg-orange-500' },
  { name: 'Rose', bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-l-pink-500', text: 'text-pink-700 dark:text-pink-400', accent: '#ec4899', dot: 'bg-pink-500' },
];

const ProgressRing: React.FC<{ pct: number; size?: number; stroke?: number }> = ({ pct, size = 64, stroke = 5 }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--md-sys-color-outline-variant)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ring-grad-sched)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * pct) / 100 }}
        transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="ring-grad-sched" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const Schedule: React.FC<ScheduleProps> = ({ data, onUpdateSchedule, onUpdateStudent, onAddSlot, onEditSlot, onDeleteSlot, onResetSchedule, onNavigate }) => {
  const { preferences } = useTheme();
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [isEditingSlot, setIsEditingSlot] = useState(false);
  const [editSlotData, setEditSlotData] = useState<ScheduleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useLocalStorage<'day' | 'week'>('schedule_view', 'week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [notifyStudents, setNotifyStudents] = useState(false);
  const [customDuration, setCustomDuration] = useState<number | ''>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const subjects = useMemo(() => {
    return preferences?.customSubjects && preferences.customSubjects.length > 0
      ? preferences.customSubjects
      : ['Solar', 'ICT'];
  }, [preferences?.customSubjects]);

  const [gridDensity, setGridDensity] = useLocalStorage<'compact' | 'comfortable'>('schedule_density', 'comfortable');
  const [showCompletedClasses, setShowCompletedClasses] = useLocalStorage<boolean>('schedule_show_completed', true);
  const [classColors, setClassColors] = useLocalStorage<Record<string, number>>('schedule_colors', {});
  const [enableAnimations, setEnableAnimations] = useLocalStorage<boolean>('schedule_animations', true);

  // Auto-detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // Custom confirm dialog state to bypass window.confirm issues in webviews
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const [workingHoursOnly, setWorkingHoursOnly] = useLocalStorage<boolean>('schedule_working_hours_only', true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const { startWorkingHour, endWorkingHour } = useMemo(() => {
    if (!workingHoursOnly || !data.schedule || data.schedule.length === 0) {
      return { startWorkingHour: 7, endWorkingHour: 19 }; // Default 7:00 to 19:00 (7 AM to 7 PM)
    }
    let minHour = 9;
    let maxHour = 17;
    data.schedule.forEach(slot => {
      if (slot.status === 'Cancelled') return;
      const hour = parseInt(slot.startTime.split(':')[0]);
      const durationHours = Math.ceil(slot.durationMinutes / 60);
      const endHour = hour + durationHours;
      if (hour < minHour) minHour = hour;
      if (endHour > maxHour) maxHour = endHour;
    });
    // Add 1 hour padding on both ends, clamp between 0 and 24
    return {
      startWorkingHour: Math.max(0, minHour - 1),
      endWorkingHour: Math.min(24, maxHour + 1)
    };
  }, [data.schedule, workingHoursOnly]);

  const displayedHours = useMemo(() => {
    const hours: string[] = [];
    const count = endWorkingHour - startWorkingHour;
    for (let i = 0; i < count; i++) {
      const h = startWorkingHour + i;
      hours.push(`${String(h).padStart(2, '0')}:00`);
    }
    return hours;
  }, [startWorkingHour, endWorkingHour]);

  // Intercept back button to close modals or settings
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (showSettings) {
        e.preventDefault();
        setShowSettings(false);
      } else if (showAddModal) {
        e.preventDefault();
        setShowAddModal(false);
      } else if (selectedSlot) {
        e.preventDefault();
        setSelectedSlot(null);
        setIsEditingSlot(false);
      } else if (confirmDialog.isOpen) {
        e.preventDefault();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('app-back-button', handleBackButton);
    return () => window.removeEventListener('app-back-button', handleBackButton);
  }, [showSettings, showAddModal, selectedSlot, confirmDialog.isOpen]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  // Jump to Now logic
  const scrollToNow = useCallback(() => {
    if (scrollContainerRef.current) {
      const currentH = new Date().getHours();
      const displayHour = currentH - (workingHoursOnly ? startWorkingHour : 0);
      const hourHeight = gridDensity === 'compact' ? 68 : 88;
      // Center the current time somewhat
      const targetScroll = Math.max(0, (displayHour * hourHeight) - 200);
      scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [gridDensity, workingHoursOnly, startWorkingHour]);

  // Scroll to now on initial mount
  useEffect(() => {
    const t = setTimeout(scrollToNow, 300);
    return () => clearTimeout(t);
  }, [scrollToNow]);



  const syncToGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        // @ts-ignore
        const { successCount, failCount, updatedSchedule, lastEventLink } = await syncScheduleToGoogle(
          data.schedule,
          tokenResponse.access_token,
          weekDates
        );
        if (successCount === 0 && failCount === 0) {
          showToast('ℹ️ No classes found to sync for this week.', 'info');
        } else if (failCount === 0) {
          showToast(`✅ Synced ${successCount} classes to Google Calendar!`, 'success');
          const calendarUrl = `https://calendar.google.com/calendar/u/0/r/week`;
          window.open(calendarUrl, '_blank');
        } else {
          showToast(`⚠️ Synced ${successCount}, but ${failCount} failed. Check console (F12) for details.`, 'warning');
        }
      } catch (error) {
        console.error('Google Calendar sync error:', error);
        showToast('Failed to sync. Please check your console (F12).', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
    onError: (errorResponse) => {
      console.error('Google Login error:', errorResponse);
      showToast(`Google Login Failed: ${errorResponse.error_description || 'Unknown error'}`, 'error');
      setIsSyncing(false);
    },
    onNonOAuthError: (nonOAuthError) => {
      console.error('Google Login Non-OAuth Error:', nonOAuthError);
      showToast('Google Login Error. Pop-up might have been blocked.', 'error');
      setIsSyncing(false);
    }
  });

  const handlePrint = () => window.print();

  const handleExportPDF = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    showToast('Generating high-fidelity PDF report...', 'info');
    
    // Small delay to let rendering update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: (preferences?.theme === 'dark' || (preferences?.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? '#0b0f19' : '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const title = `PRISM_OS_Schedule_${view.toUpperCase()}_${getDateStr(referenceDate)}`;
      pdf.save(`${title}.pdf`);
      showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('PDF export error:', error);
      showToast('Failed to generate PDF. Trying direct print fallback...', 'warning');
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleDuplicateSlot = () => {
    if (!selectedSlot || !onAddSlot) return;
    const nextDay = (selectedSlot.dayOfWeek % 7) + 1;
    const duplicate: Omit<ScheduleSlot, 'id'> = {
      dayOfWeek: nextDay,
      startTime: selectedSlot.startTime,
      durationMinutes: selectedSlot.durationMinutes,
      grade: selectedSlot.grade,
      studentGroup: selectedSlot.studentGroup,
      subject: selectedSlot.subject,
      status: 'Pending',
      resourceIds: selectedSlot.resourceIds,
    };
    onAddSlot(duplicate);
    setSelectedSlot(null);
    showToast(`Class duplicated to ${DAYS[nextDay - 1]}`, 'success');
  };

  const getStudentCount = useCallback((slot: ScheduleSlot) => {
    return data.students.filter(s => s.grade === slot.grade && s.subject === slot.subject).length;
  }, [data.students]);

  const [newSlotGroup, setNewSlotGroup] = useState<StudentGroup>('Academy');
  const [newSlotDurationMode, setNewSlotDurationMode] = useState<'preset' | 'custom'>('preset');
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', studentGroup: 'Academy', status: 'Pending'
  });

  const openAddModal = useCallback(() => {
    const availableGroups = getStudentGroups(preferences?.institutionType);
    const defaultGroup = availableGroups[0] || 'Academy';
    const defaultLevel = getDefaultLevel(defaultGroup, preferences?.institutionType);
    setNewSlotGroup(defaultGroup);
    setNewSlot({
      dayOfWeek: 1,
      startTime: '09:00',
      durationMinutes: 60,
      subject: (preferences?.defaultSubject || subjects[0] || 'Solar') as any,
      grade: defaultLevel,
      studentGroup: defaultGroup,
      status: 'Pending'
    });
    setShowAddModal(true);
  }, [preferences, subjects]);

  const { showToast } = useToast();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleSuggestSlot = () => {
    const bestTime = findBestSlot(newSlot.durationMinutes || 60, data.schedule);
    if (bestTime) {
      setNewSlot(prev => ({ ...prev, startTime: bestTime }));
      showToast(`Found best time: ${bestTime}`, 'success');
    } else {
      showToast('No clear slot found', 'error');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    if (!over) return;
    const activeSlot = active.data.current?.slot as ScheduleSlot;
    const overId = over.id as string;
    const targetDayIndex = parseInt(overId.split('-')[1]);
    if (!activeSlot) return;

    const heightPerMinute = hourHeight / 60;
    const minutesDelta = Math.round(delta.y / heightPerMinute / 15) * 15;

    const [hours, mins] = activeSlot.startTime.split(':').map(Number);
    const currentMinutes = hours * 60 + mins;
    let newTotalMinutes = currentMinutes + minutesDelta;

    const minTime = 0;
    const maxTime = 23 * 60 + 45; // 23:45
    newTotalMinutes = Math.max(minTime, Math.min(newTotalMinutes, maxTime));

    const newHours = Math.floor(newTotalMinutes / 60);
    const newMins = newTotalMinutes % 60;
    const newStartTime = `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;

    if (activeSlot.dayOfWeek !== targetDayIndex || activeSlot.startTime !== newStartTime) {
      const targetDate = weekDates.find(d => d.getDay() === targetDayIndex) || new Date();
      const dateStr = getDateStr(targetDate);

      const existingSlotsOnTargetDay = data.schedule.filter(s => {
        if (s.overrideDate === dateStr && s.status !== 'Cancelled') return true;
        if (s.dayOfWeek === targetDayIndex && !s.overrideDate && s.status !== 'Cancelled') {
          const isOverridden = data.schedule.some(override =>
            override.replacesSlotId === s.id && override.overrideDate === dateStr
          );
          return !isOverridden;
        }
        return false;
      });

      const conflicts = detectConflicts({
        id: activeSlot.id,
        startTime: newStartTime,
        durationMinutes: activeSlot.durationMinutes,
        resourceIds: activeSlot.resourceIds
      }, existingSlotsOnTargetDay);

      const commitMove = () => {
        if (!activeSlot.overrideDate && onAddSlot) {
          const override: Omit<ScheduleSlot, 'id'> = {
            ...activeSlot, overrideDate: dateStr, startTime: newStartTime,
            dayOfWeek: targetDayIndex, replacesSlotId: activeSlot.id, status: 'Pending'
          };
          onAddSlot(override);
          showToast(`Class moved to ${dateStr} at ${newStartTime}`, 'success');
        } else if (activeSlot.overrideDate && onAddSlot) {
          const override: Omit<ScheduleSlot, 'id'> = {
            ...activeSlot, overrideDate: dateStr, startTime: newStartTime,
            dayOfWeek: targetDayIndex, replacesSlotId: activeSlot.replacesSlotId, status: 'Pending'
          };
          onAddSlot(override);
          showToast(`Class rescheduled to ${newStartTime}`, 'success');
        }
      };

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(c => c.message).join('\n');
        setConfirmDialog({
          isOpen: true,
          title: 'Conflicts Detected',
          message: `The following conflicts were found:\n${conflictMessages}\n\nProceed anyway?`,
          onConfirm: () => {
            commitMove();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        });
        return;
      }

      commitMove();
    }
  };

  const getDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMondayOfWeek = useCallback((date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }, []);

  const handleDateChange = (date: Date) => {
    const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    setReferenceDate(newDate);
    setView('day');
  };

  const jumpToToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setReferenceDate(d);
  };

  const shiftDate = (direction: number) => {
    const newDate = new Date(referenceDate);
    if (view === 'week') newDate.setDate(newDate.getDate() + (direction * 7));
    else newDate.setDate(newDate.getDate() + direction);
    setReferenceDate(newDate);
  };

  const weekDates = useMemo(() => {
    const monday = getMondayOfWeek(referenceDate);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [referenceDate, getMondayOfWeek]);



  const displayedDates = view === 'week' ? weekDates : [referenceDate];

  const getSlotDateContext = (): string => {
    if (selectedDate) return getDateStr(selectedDate);
    if (selectedSlot?.overrideDate) return selectedSlot.overrideDate;
    if (selectedSlot) {
      const d = weekDates.find(wd => wd.getDay() === selectedSlot.dayOfWeek);
      return d ? getDateStr(d) : getDateStr(new Date());
    }
    return getDateStr(new Date());
  };

  const getVisibleSlots = (date: Date): ScheduleSlot[] => {
    const dayOfWeek = date.getDay();
    const dateStr = getDateStr(date);
    const recurring = data.schedule.filter(s => s.dayOfWeek === dayOfWeek && !s.overrideDate);
    if (isTemplateMode) return recurring;
    const overrides = data.schedule.filter(s => s.overrideDate === dateStr);
    const replacedIds = new Set(overrides.filter(o => o.replacesSlotId).map(o => o.replacesSlotId));
    let result = [...recurring.filter(r => !replacedIds.has(r.id)), ...overrides];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        (s.subject || '').toLowerCase().includes(term) || 
        (s.grade || '').toLowerCase().includes(term)
      );
    }
    if (filterSubject !== 'All') {
      result = result.filter(s => s.subject === filterSubject);
    }
    if (filterGrade !== 'All') {
      result = result.filter(s => s.grade === filterGrade);
    }
    if (filterStatus !== 'All') {
      result = result.filter(s => s.status === filterStatus);
    }
    if (!showCompletedClasses) result = result.filter(s => s.status !== 'Completed');
    return result;
  };

  // Memoize visible slots per date for performance
  const memoizedVisibleSlots = useMemo(() => {
    const map = new Map<string, ScheduleSlot[]>();
    for (const date of (view === 'week' ? weekDates : [referenceDate])) {
      map.set(getDateStr(date), getVisibleSlots(date));
    }
    return map;
  }, [weekDates, referenceDate, view, data.schedule, showCompletedClasses, isTemplateMode, searchTerm, filterSubject, filterGrade, filterStatus]);

  const [schedulerTheme, setSchedulerTheme] = useLocalStorage<'indigo' | 'emerald' | 'cyberpunk' | 'amber' | 'rose'>('schedule_theme', 'indigo');

  // WebGL 3D Workload Canvas Integration
  const [webglSupported, setWebglSupported] = useState(true);
  const [webglContextLost, setWebglContextLost] = useState(false);

  // WebGL theme color helper
  const getWebGLThemeColor = (themeName: string) => {
    // webgl theme color mapping
    switch (themeName) {
      case 'cyberpunk': return [0.93, 0.27, 0.60, 1.0]; // pink neon
      case 'emerald': return [0.06, 0.73, 0.51, 1.0]; // green
      case 'amber': return [0.98, 0.45, 0.09, 1.0]; // amber
      case 'rose': return [0.93, 0.28, 0.60, 1.0]; // rose
      case 'indigo':
      default:
        return [0.55, 0.36, 0.96, 1.0]; // classic indigo
    }
  };

  useEffect(() => {
    const canvas = document.getElementById('workload-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    // workload-3d-canvas check for empty schedule handling
    const isEmpty = !data.schedule || data.schedule.length === 0;

    // workload-3d-canvas clamp function for bar heights
    const clamp = (val: number, minVal: number, maxVal: number) => Math.max(minVal, Math.min(val, maxVal));

    const getBarHeights = () => {
      if (isEmpty) {
        return [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05];
      }
      const counts = [0, 0, 0, 0, 0, 0, 0];
      data.schedule.forEach(slot => {
        if (slot.status !== 'Cancelled') {
          const dayIndex = slot.dayOfWeek - 1; // 1 to 7 maps to 0 to 6
          if (dayIndex >= 0 && dayIndex < 7) {
            counts[dayIndex]++;
          }
        }
      });
      return counts.map(c => clamp(c * 0.3, 0.05, 1.5));
    };

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      setWebglSupported(false);
      const fallback = document.getElementById('webgl-fallback');
      if (fallback) fallback.classList.remove('hidden');
      return;
    }

    setWebglSupported(true);

    // Setup WebGL2 program and buffers
    const vsSource = `#version 300 es
    in vec3 aPosition;
    in vec3 aNormal;
    uniform mat4 uProjectionMatrix;
    uniform mat4 uModelViewMatrix;
    out vec3 vNormal;
    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
      vNormal = aNormal;
    }`;

    const fsSource = `#version 300 es
    precision mediump float;
    in vec3 vNormal;
    uniform vec4 uColor;
    out vec4 fragColor;
    void main() {
      vec3 normal = normalize(vNormal);
      float light = dot(normal, normalize(vec3(0.5, 1.0, 0.5))) * 0.4 + 0.6;
      fragColor = vec4(uColor.rgb * light, uColor.a);
    }`;

    function compileShader(glContext: WebGL2RenderingContext, source: string, type: number) {
      const shader = glContext.createShader(type);
      if (!shader) return null;
      glContext.shaderSource(shader, source);
      glContext.compileShader(shader);
      if (!glContext.getShaderParameter(shader, glContext.COMPILE_STATUS)) {
        console.error(glContext.getShaderInfoLog(shader));
        glContext.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (vs && fs && program) {
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
      }
    }

    const vertices = new Float32Array([
      // Front
      -0.5, 0.0,  0.5,
       0.5, 0.0,  0.5,
       0.5, 1.0,  0.5,
      -0.5, 1.0,  0.5,
      // Back
      -0.5, 0.0, -0.5,
      -0.5, 1.0, -0.5,
       0.5, 1.0, -0.5,
       0.5, 0.0, -0.5,
      // Top
      -0.5, 1.0,  0.5,
       0.5, 1.0,  0.5,
       0.5, 1.0, -0.5,
      -0.5, 1.0, -0.5,
      // Bottom
      -0.5, 0.0,  0.5,
      -0.5, 0.0, -0.5,
       0.5, 0.0, -0.5,
       0.5, 0.0,  0.5,
      // Right
       0.5, 0.0,  0.5,
       0.5, 0.0, -0.5,
       0.5, 1.0, -0.5,
       0.5, 1.0,  0.5,
      // Left
      -0.5, 0.0,  0.5,
      -0.5, 1.0,  0.5,
      -0.5, 1.0, -0.5,
      -0.5, 0.0, -0.5,
    ]);

    const normals = new Float32Array([
      0,0,1,  0,0,1,  0,0,1,  0,0,1,
      0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
      0,1,0,  0,1,0,  0,1,0,  0,1,0,
      0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
      1,0,0,  1,0,0,  1,0,0,  1,0,0,
      -1,0,0, -1,0,0, -1,0,0, -1,0,0,
    ]);

    const indices = new Uint16Array([
      0, 1, 2,     0, 2, 3,
      4, 5, 6,     4, 6, 7,
      8, 9, 10,    8, 10, 11,
      12, 13, 14,  12, 14, 15,
      16, 17, 18,  16, 18, 19,
      20, 21, 22,  20, 22, 23
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    // Matrix projection helpers
    function getOrtho(left: number, right: number, bottom: number, top: number, near: number, far: number) {
      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);
      return [
        -2 * lr, 0, 0, 0,
        0, -2 * bt, 0, 0,
        0, 0, 2 * nf, 0,
        (left + right) * lr, (top + bottom) * bt, (far + near) * nf, 1
      ];
    }

    function rotateY(angle: number) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1
      ];
    }

    function rotateX(angle: number) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return [
        1, 0, 0, 0,
        0, c, s, 0,
        0, -s, c, 0,
        0, 0, 0, 1
      ];
    }

    function translation(x: number, y: number, z: number) {
      return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
      ];
    }

    // Scale matrix builder
    function scale(sx: number, sy: number, sz: number) {
      return [
        sx, 0, 0, 0,
        0, sy, 0, 0,
        0, 0, sz, 0,
        0, 0, 0, 1
      ];
    }

    function multiply(a: number[], b: number[]): number[] {
      const out = new Array(16);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          let sum = 0;
          for (let i = 0; i < 4; i++) {
            sum += a[i * 4 + row] * b[col * 4 + i];
          }
          out[col * 4 + row] = sum;
        }
      }
      return out;
    }

    // Orbit controls variables for rotation camera/columns
    let angleY = 0.5;
    let angleX = 0.3;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      angleY += deltaX * 0.01;
      angleX += deltaY * 0.01;
      angleX = clamp(angleX, -Math.PI / 3, Math.PI / 3);
    };

    const handlePointerUp = (e: PointerEvent) => {
      isDragging = false;
      canvas.releasePointerCapture(e.pointerId);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);

    // WebGL context lost & restored handlers
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglContextLost(true);
      cancelAnimationFrame(animationFrameId);
    };

    const handleContextRestored = () => {
      setWebglContextLost(false);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    let animationFrameId: number;
    
    // webgl redraw function to draw 3D bars based on theme color and schedule
    const renderWebGL = () => {
      if (!gl || !program) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent background
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      gl.useProgram(program);

      const aspect = width / height;
      const pMatrix = getOrtho(-2.5 * aspect, 2.5 * aspect, -1.5, 2.5, -10, 10);

      const uProjectionMatrixLoc = gl.getUniformLocation(program, 'uProjectionMatrix');
      const uModelViewMatrixLoc = gl.getUniformLocation(program, 'uModelViewMatrix');
      const uColorLoc = gl.getUniformLocation(program, 'uColor');

      gl.uniformMatrix4fv(uProjectionMatrixLoc, false, new Float32Array(pMatrix));

      // Bind position attribute
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(aPositionLoc);
      gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);

      // Bind normal attribute
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      const aNormalLoc = gl.getAttribLocation(program, 'aNormal');
      gl.enableVertexAttribArray(aNormalLoc);
      gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

      const barHeights = getBarHeights();
      const themeColor = getWebGLThemeColor(schedulerTheme);

      // Draw 7 daily columns representing workload
      for (let i = 0; i < 7; i++) {
        const xOffset = (i - 3) * 0.65;
        const h = barHeights[i];

        const tMat = translation(xOffset, -0.8, 0.0);
        const rxMat = rotateX(angleX);
        const ryMat = rotateY(angleY);
        const sMat = scale(0.4, h, 0.4);

        let mvMat = multiply(tMat, rxMat);
        mvMat = multiply(mvMat, ryMat);
        mvMat = multiply(mvMat, sMat);

        gl.uniformMatrix4fv(uModelViewMatrixLoc, false, new Float32Array(mvMat));
        gl.uniform4fv(uColorLoc, new Float32Array(themeColor));

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      }
    };

    const tick = () => {
      renderWebGL();
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      if (gl) {
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(normalBuffer);
        gl.deleteBuffer(indexBuffer);
        gl.deleteProgram(program);
      }
    };
  }, [data.schedule, schedulerTheme]);

  const [showOptimizer, setShowOptimizer] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Dynamic slot colors based on theme
  const getDynamicSlotColor = (slot: ScheduleSlot, idx: number) => {
    if (schedulerTheme === 'cyberpunk') {
      const neonPalettes = [
        { name: 'Pink Neon', bg: 'bg-slate-950/90 dark:bg-slate-900/95', border: 'border-l-pink-500', text: 'text-pink-400', accent: '#ec4899', dot: 'bg-pink-500' },
        { name: 'Cyan Neon', bg: 'bg-slate-950/90 dark:bg-slate-900/95', border: 'border-l-cyan-400', text: 'text-cyan-400', accent: '#06b6d4', dot: 'bg-cyan-500' },
        { name: 'Purple Neon', bg: 'bg-slate-950/90 dark:bg-slate-900/95', border: 'border-l-purple-500', text: 'text-purple-400', accent: '#a855f7', dot: 'bg-purple-500' },
        { name: 'Green Neon', bg: 'bg-slate-950/90 dark:bg-slate-900/95', border: 'border-l-green-400', text: 'text-green-400', accent: '#4ade80', dot: 'bg-green-500' },
        { name: 'Yellow Neon', bg: 'bg-slate-950/90 dark:bg-slate-900/95', border: 'border-l-yellow-400', text: 'text-yellow-400', accent: '#facc15', dot: 'bg-yellow-500' },
        { name: 'Orange Neon', bg: 'bg-slate-950/90 dark:bg-slate-900/95', border: 'border-l-orange-500', text: 'text-orange-400', accent: '#f97316', dot: 'bg-orange-500' },
      ];
      return neonPalettes[idx % neonPalettes.length];
    }
    return CLASS_COLORS[idx % CLASS_COLORS.length];
  };

  const getThemeClasses = () => {
    switch (schedulerTheme) {
      case 'cyberpunk':
        return {
          bg: 'bg-slate-950 text-slate-100 border-white/10',
          card: 'bg-slate-900/90 dark:bg-slate-950/80 border-white/20 text-slate-200',
          accent: 'text-pink-500 border-pink-500',
          gradient: 'from-pink-500 via-purple-600 to-cyan-500',
          primaryBtn: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.55)]',
          badge: 'bg-pink-900/30 text-pink-300 border-pink-500/30'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-white/10',
          card: 'bg-white/80 dark:bg-slate-900/80 border-white/20 text-slate-800 dark:text-slate-200',
          accent: 'text-emerald-600 dark:text-emerald-400 border-emerald-500',
          gradient: 'from-emerald-500 via-teal-600 to-cyan-500',
          primaryBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-white/10',
          card: 'bg-white/80 dark:bg-slate-900/80 border-white/20 text-slate-800 dark:text-slate-200',
          accent: 'text-amber-600 dark:text-amber-400 border-amber-500',
          gradient: 'from-amber-500 via-orange-600 to-red-500',
          primaryBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/10',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30'
        };
      case 'rose':
        return {
          bg: 'bg-rose-50/20 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-white/10',
          card: 'bg-white/80 dark:bg-slate-900/80 border-white/20 text-slate-800 dark:text-slate-200',
          accent: 'text-rose-600 dark:text-rose-400 border-rose-500',
          gradient: 'from-rose-500 via-pink-600 to-red-500',
          primaryBtn: 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/10',
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/30'
        };
      default:
        return {
          bg: 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-white/10',
          card: 'bg-[var(--md-sys-color-surface)] border-white/20 text-[var(--md-sys-color-on-surface)]',
          accent: 'text-violet-650 border-violet-500',
          gradient: 'from-violet-500 via-indigo-600 to-blue-500',
          primaryBtn: 'bg-[var(--md-sys-color-primary)] text-white hover:opacity-90 transition-all shadow-md',
          badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800/30'
        };
    }
  };

  const diagnostics = useMemo(() => {
    const issues: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
    let score = 100;

    const holidayClashes = data.schedule.filter(s => {
      if (s.status === 'Cancelled') return false;
      const dateStr = s.overrideDate || getSlotDateContextForSlot(s);
      return isHoliday(new Date(dateStr), data.holidays || []);
    });
    if (holidayClashes.length > 0) {
      score -= holidayClashes.length * 12;
      issues.push({
        type: 'error',
        message: `${holidayClashes.length} classes conflict with public holiday dates.`
      });
    }

    let resourceClashCount = 0;
    data.schedule.forEach(slot => {
      if (slot.status === 'Cancelled') return;
      const dateStr = slot.overrideDate || getSlotDateContextForSlot(slot);
      const daySlots = data.schedule.filter(s => {
        if (s.id === slot.id) return false;
        if (s.status === 'Cancelled') return false;
        if (s.overrideDate === dateStr) return true;
        if (s.dayOfWeek === slot.dayOfWeek && !s.overrideDate) {
          const isOverridden = data.schedule.some(o => o.replacesSlotId === s.id && o.overrideDate === dateStr);
          return !isOverridden;
        }
        return false;
      });
      const clashes = detectConflicts(slot, daySlots);
      if (clashes.length > 0) {
        resourceClashCount++;
      }
    });
    if (resourceClashCount > 0) {
      score -= Math.min(40, resourceClashCount * 10);
      issues.push({
        type: 'error',
        message: `${resourceClashCount} room/asset schedule conflicts detected.`
      });
    }

    Object.entries(data.curriculum || {}).forEach(([subject, units]) => {
      const count = data.schedule.filter(s => s.subject === subject && s.status !== 'Cancelled').length;
      if (count === 0) {
        score -= 10;
        issues.push({
          type: 'warning',
          message: `${subject}: Critical gap (0 syllabus units allocated).`
        });
      } else if (count < units.length / 2) {
        score -= 5;
        issues.push({
          type: 'warning',
          message: `${subject}: Low coverage (${count}/${units.length} syllabus sessions allocated).`
        });
      }
    });

    const dayCounts: Record<string, number> = {};
    data.schedule.forEach(slot => {
      if (slot.status === 'Cancelled') return;
      const key = slot.dayOfWeek;
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    });
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > 6) {
        score -= 8;
        issues.push({
          type: 'warning',
          message: `High class load on day ${day} (${count} sessions).`
        });
      }
    });

    score = Math.max(15, score);
    return { score, issues };
  }, [data.schedule, data.curriculum, data.holidays, weekDates]);

  const handleAutoOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const holidaySlots = data.schedule.filter(s => {
        if (s.status === 'Cancelled') return false;
        const dateStr = s.overrideDate || getSlotDateContextForSlot(s);
        return isHoliday(new Date(dateStr), data.holidays || []);
      });
      holidaySlots.forEach(slot => {
        if (onUpdateSchedule) {
          onUpdateSchedule(slot.id, 'Cancelled');
        }
      });
      setIsOptimizing(false);
      showToast('Optimization complete: Cancelled classes on public holidays.', 'success');
      setShowOptimizer(false);
    }, 1500);
  };

  const getSlotColor = (slot: ScheduleSlot) => {
    let colorIdx = 3;
    if (classColors[slot.id] !== undefined) {
      colorIdx = classColors[slot.id];
    } else {
      const sub = slot.subject || '';
      let hash = 0;
      for (let i = 0; i < sub.length; i++) {
        hash = sub.charCodeAt(i) + ((hash << 5) - hash);
      }
      colorIdx = Math.abs(hash) % CLASS_COLORS.length;
    }
    return getDynamicSlotColor(slot, colorIdx);
  };

  const handleStatusChange = (status: ScheduleSlot['status'], slotOverride?: ScheduleSlot) => {
    const slotToUpdate = slotOverride || selectedSlot;
    if (!slotToUpdate) return;

    if (isTemplateMode) {
      onUpdateSchedule(slotToUpdate.id, status);
      if (!slotOverride) setSelectedSlot({ ...slotToUpdate, status });
      showToast(`Template updated`, 'success');
      return;
    }

    if (!slotToUpdate.overrideDate && onAddSlot) {
      const targetDateStr = slotOverride ? getSlotDateContextForSlot(slotToUpdate) : getSlotDateContext();
      const override: Omit<ScheduleSlot, 'id'> = {
        ...slotToUpdate, status, overrideDate: targetDateStr, replacesSlotId: slotToUpdate.id
      };
      onAddSlot(override);
      if (!slotOverride) setSelectedSlot(null);
      showToast(`Class marked as ${status}`, 'success');
    } else {
      onUpdateSchedule(slotToUpdate.id, status);
      if (!slotOverride) setSelectedSlot({ ...slotToUpdate, status });
      showToast(`Class marked as ${status}`, 'success');
    }
  };

  // Helper for quick toggle
  const getSlotDateContextForSlot = (slot: ScheduleSlot): string => {
    const d = weekDates.find(wd => wd.getDay() === slot.dayOfWeek);
    return d ? getDateStr(d) : getDateStr(new Date());
  };

  const handleColorChange = (slotId: string, colorIdx: number) => {
    setClassColors(prev => ({ ...prev, [slotId]: colorIdx }));
  };

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const hourHeight = gridDensity === 'compact' ? 68 : 88;
  const displayCurrentHour = currentHour - (workingHoursOnly ? startWorkingHour : 0);
  const currentTimeTop = (displayCurrentHour * hourHeight) + ((currentMinute / 60) * hourHeight);

  // Auto-scroll to current time on mount (stopwatch animation)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const currentH = new Date().getHours();
    const currentM = new Date().getMinutes();
    const displayHour = currentH - (workingHoursOnly ? startWorkingHour : 0);
    // Scroll to 1 hour before current time, clamped to 0
    const targetHour = Math.max(0, displayHour - 1);
    const targetOffset = (targetHour * hourHeight) + ((currentM / 60) * hourHeight);
    // Small delay so the DOM is ready, then smooth scroll
    const timeout = setTimeout(() => {
      container.scrollTo({ top: targetOffset, behavior: 'smooth' });
    }, 300);
    return () => clearTimeout(timeout);
  }, [hourHeight, workingHoursOnly, startWorkingHour]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
        else if (selectedSlot) setSelectedSlot(null);
        else if (confirmDialog.isOpen) setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (user?.role !== 'viewer') openAddModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, selectedSlot, confirmDialog.isOpen, user?.role, openAddModal]);

  const recommendedResourcesList = useMemo(() => {
    if (!selectedSlot || !data.resources) return [];
    const studentCount = getStudentCount(selectedSlot);
    return recommendResources(
      {
        startTime: selectedSlot.startTime,
        durationMinutes: selectedSlot.durationMinutes,
        dayOfWeek: selectedSlot.dayOfWeek,
        studentCount
      },
      data.resources,
      data.schedule
    );
  }, [selectedSlot, data.resources, data.schedule, getStudentCount]);

  const handleToggleResource = (resourceId: string) => {
    if (!selectedSlot || !onEditSlot) return;
    const currentIds = selectedSlot.resourceIds || [];
    const newIds = currentIds.includes(resourceId)
      ? currentIds.filter(id => id !== resourceId)
      : [...currentIds, resourceId];
    
    const updatedSlot = { ...selectedSlot, resourceIds: newIds };
    onEditSlot(updatedSlot);
    setSelectedSlot(updatedSlot);
    showToast(currentIds.includes(resourceId) ? 'Resource removed' : 'Resource assigned', 'success');
  };

  const miniCalendarDays = useMemo(() => {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPadding; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [referenceDate]);

  const daysWithClasses = useMemo(() => {
    const set = new Set<string>();
    if (!data?.schedule) return set;
    data.schedule.forEach(s => {
      if (s.overrideDate) set.add(s.overrideDate);
      else {
        miniCalendarDays.forEach(day => {
          if (day && day.getDay() === s.dayOfWeek) set.add(getDateStr(day));
        });
      }
    });
    return set;
  }, [data.schedule, miniCalendarDays]);

  const weeklyStats = useMemo(() => {
    let totalClasses = 0, completed = 0, pending = 0, cancelled = 0;
    if (!weekDates) return { totalClasses: 0, completed: 0, pending: 0, cancelled: 0, pct: 0 };
    weekDates.forEach(date => {
      const slots = getVisibleSlots(date);
      totalClasses += slots.length;
      slots.forEach(s => {
        if (s.status === 'Completed') completed++;
        else if (s.status === 'Cancelled') cancelled++;
        else pending++;
      });
    });
    const pct = totalClasses > 0 ? (completed / totalClasses) * 100 : 0;
    return { totalClasses, completed, pending, cancelled, pct };
  }, [weekDates, data.schedule, showCompletedClasses, isTemplateMode]);

  const daySlotsChronological = useMemo(() => {
    const slots = getVisibleSlots(referenceDate);
    return [...slots].sort((a, b) => {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
  }, [referenceDate, data.schedule, searchTerm, filterSubject, filterGrade, filterStatus, showCompletedClasses]);

  if (!data) return null;

  const theme = getThemeClasses();

  return (
    <PageTransition>
      <div className={clsx("h-full pb-20 lg:pb-0 flex flex-col overflow-hidden font-sans transition-colors duration-500 relative backdrop-blur-lg", theme.bg)}>
        {/* Glowing Neon Orbs in Background */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-cyan-500/10 via-violet-500/5 to-transparent blur-[140px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />

        {/* === FLOATING HEADER BAR === */}
        <div className="flex-shrink-0 px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
          <div className={clsx("flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 rounded-2xl md:rounded-3xl border shadow-sm p-3 md:p-4 transition-all duration-500", theme.card)}>

            <div className="flex items-center gap-3 md:gap-4 flex-1 w-full">
              <div className={clsx("w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-md flex-shrink-0 transition-all duration-500", theme.gradient)}>
                <CalendarIcon size={isMobile ? 20 : 24} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] truncate">Schedule</h1>
                <p className="text-xs md:text-sm text-[var(--md-sys-color-secondary)] hidden sm:block">Manage classes & timetable</p>
              </div>
              {/* Mobile-only Add button */}
              {isMobile && user?.role !== 'viewer' && (
                <button onClick={openAddModal} aria-label="Add Class" className="p-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl shadow-md flex-shrink-0">
                  <Plus size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <div className="flex items-center bg-[var(--md-sys-color-surface-variant)] p-0.5 md:p-1 rounded-lg md:rounded-xl">
                <button onClick={() => setView('day')} aria-label="Day View" className={clsx("px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all", view === 'day' ? "bg-[var(--md-sys-color-surface)] dark:bg-slate-800 shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]")}>Day</button>
                <button onClick={() => setView('week')} aria-label="Week View" className={clsx("px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all", view === 'week' ? "bg-[var(--md-sys-color-surface)] dark:bg-slate-800 shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]")}>Week</button>
              </div>
              <div className="w-px h-6 md:h-8 bg-[var(--md-sys-color-outline-variant)]" />
              <button onClick={handlePrint} aria-label="Print Schedule" className="p-2 md:p-2.5 rounded-lg md:rounded-xl text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"><Printer size={isMobile ? 18 : 20} /></button>
              <button onClick={handleExportPDF} aria-label="Export PDF" disabled={isExporting} className={clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", isExporting ? "text-violet-500 bg-violet-50 animate-pulse" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}><FileDown size={isMobile ? 18 : 20} /></button>
              <button onClick={() => setShowSettings(!showSettings)} aria-label="Settings" className={clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", showSettings ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}><Settings size={isMobile ? 18 : 20} /></button>
              <button onClick={() => syncToGoogle()} aria-label="Sync to Google Calendar" disabled={isSyncing} className={clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", isSyncing ? "text-blue-500 bg-blue-50" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}><RefreshCw size={isMobile ? 18 : 20} className={clsx(isSyncing && "animate-spin")} /></button>

              {/* Dynamic Theme Engine Pills */}
              <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-variant)]/60 px-2 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]/40 flex-shrink-0">
                <span className="text-[10px] font-black text-[var(--md-sys-color-secondary)] uppercase select-none hidden lg:inline">Theme:</span>
                <div className="flex gap-1">
                  {[
                    { id: 'indigo', name: 'Classic', color: 'bg-indigo-500' },
                    { id: 'emerald', name: 'Forest', color: 'bg-emerald-500' },
                    { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-gradient-to-br from-pink-500 to-cyan-500' },
                    { id: 'amber', name: 'Solar', color: 'bg-amber-500' },
                    { id: 'rose', name: 'Sunset', color: 'bg-rose-500' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSchedulerTheme(t.id as any)}
                      title={`${t.name} Theme`}
                      className={clsx(
                        "w-4 h-4 rounded-full transition-all duration-300 relative border",
                        t.color,
                        schedulerTheme === t.id ? "ring-2 ring-[var(--md-sys-color-primary)] scale-110 border-white" : "border-transparent opacity-75 hover:opacity-100 hover:scale-105"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* AI Optimization Badge */}
              <button
                onClick={() => setShowOptimizer(!showOptimizer)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-500/10 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex-shrink-0"
              >
                <Sparkles size={13} className="animate-pulse" />
                <span>Optimize</span>
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-md text-[9px] font-black ml-1">
                  {diagnostics.score}
                </span>
              </button>
              {!isMobile && user?.role !== 'viewer' && (
                <>
                  <button onClick={() => setIsTemplateMode(!isTemplateMode)} className={clsx("px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", isTemplateMode ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                    <Edit3 size={16} /> {isTemplateMode ? 'Done Editing' : 'Edit Template'}
                  </button>
                  <button onClick={openAddModal} className="px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <Plus size={18} /> Add Class
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* === FILTER & SEARCH BAR === */}
        <div className="flex-shrink-0 px-3 md:px-6 pb-2">
          <div className={clsx("flex flex-col sm:flex-row gap-3 rounded-2xl border shadow-sm p-3 transition-colors duration-500", theme.card)}>
            
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search classes by subject, grade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-xs font-semibold text-[var(--md-sys-color-on-surface)]"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)] w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
              
              {/* Subject Filter */}
              <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-variant)] px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] font-extrabold text-[var(--md-sys-color-secondary)] uppercase">Subject</span>
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-bold text-[var(--md-sys-color-on-surface)] outline-none cursor-pointer"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[var(--md-sys-color-surface-variant)] px-3 py-1.5 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                <span className="text-[10px] font-extrabold text-[var(--md-sys-color-secondary)] uppercase">Status</span>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-bold text-[var(--md-sys-color-on-surface)] outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Working Hours Toggle */}
              <button
                onClick={() => setWorkingHoursOnly(!workingHoursOnly)}
                className={clsx(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                  workingHoursOnly 
                    ? "bg-violet-100 border-violet-300 text-violet-850 dark:bg-violet-900/30 dark:border-violet-800" 
                    : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                )}
              >
                <Zap size={12} className={workingHoursOnly ? "text-violet-650" : ""} />
                {workingHoursOnly ? "Working Hours Grid" : "24 Hour Grid"}
              </button>

              {/* Clear Filters (if active) */}
              {(searchTerm || filterSubject !== 'All' || filterStatus !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterSubject('All');
                    setFilterStatus('All');
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-750 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

          </div>
        </div>

        {/* === MOBILE DATE NAVIGATION STRIP === */}
        {isMobile && (
          <div className="flex-shrink-0 px-3 pb-2">
            <div className="flex items-center justify-between bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-sm px-3 py-2">
              <button onClick={() => shiftDate(-1)} aria-label="Previous Day" className="p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                <ChevronLeft size={20} className="text-[var(--md-sys-color-secondary)]" />
              </button>
              <div className="flex items-center gap-2">
                <button onClick={jumpToToday} className="text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg hover:bg-violet-100">Today</button>
                <span className="text-sm font-google font-bold text-[var(--md-sys-color-on-surface)]">
                  {referenceDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <button onClick={scrollToNow} className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 flex items-center gap-1"><Zap size={10} /> Now</button>
              </div>
              <button onClick={() => shiftDate(1)} aria-label="Next Day" className="p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                <ChevronRight size={20} className="text-[var(--md-sys-color-secondary)]" />
              </button>
            </div>
          </div>
        )}

        {/* === MAIN CONTENT === */}
        <div className="flex-1 flex overflow-hidden px-3 md:px-6 pb-3 md:pb-6 gap-3 md:gap-6">

          {/* === SIDEBAR (Desktop only) === */}
          <aside className="w-72 flex-shrink-0 flex-col gap-6 hidden md:flex backdrop-blur bg-white/10">
            {/* Nav Card */}
            <div className={clsx("rounded-3xl border shadow-sm p-4 transition-colors duration-500", theme.card)}>
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-sm font-google font-bold text-[var(--md-sys-color-on-surface)]">
                  {referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => shiftDate(-1)} aria-label="Previous Week" className="p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg"><ChevronLeft size={16} className="text-[var(--md-sys-color-secondary)]" /></button>
                  <button onClick={jumpToToday} aria-label="Go to Today" className="text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-2 rounded-lg hover:bg-violet-100">Today</button>
                  <button onClick={scrollToNow} aria-label="Jump to Now Line" className="text-[10px] uppercase font-bold text-red-600 bg-red-50 px-2 rounded-lg hover:bg-red-100 ml-1 flex items-center gap-1"><Zap size={10} /> Now</button>
                  <button onClick={() => shiftDate(1)} aria-label="Next Week" className="p-1 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg"><ChevronRight size={16} className="text-[var(--md-sys-color-secondary)]" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-2 text-center mb-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-bold text-[var(--md-sys-color-secondary)]">{d}</span>)}
                {miniCalendarDays.map((day, i) => {
                  if (!day) return <span key={i}></span>;
                  const dateStr = getDateStr(day);
                  const isSelected = view === 'week' ? weekDates.some(wd => getDateStr(wd) === dateStr) : dateStr === getDateStr(referenceDate);
                  const hasClasses = daysWithClasses.has(dateStr);
                  const isToday = dateStr === getDateStr(new Date());
                  return (
                    <button
                      key={i}
                      onClick={() => handleDateChange(day)}
                      aria-label={`Select ${day.toDateString()}`}
                      tabIndex={0}
                      className={clsx(
                        "w-8 h-8 rounded-full text-xs font-semibold mx-auto transition-all relative flex items-center justify-center focus-visible:ring-2 focus-visible:ring-violet-500",
                        isSelected ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 ring-1 ring-violet-300" : "hover:bg-[var(--md-sys-color-surface-variant)]",
                        isToday && !isSelected && "text-violet-600 font-bold",
                        !isSelected && !isToday && "text-[var(--md-sys-color-on-surface)]"
                      )}
                    >
                      {day.getDate()}
                      {hasClasses && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Weekly Summary Card */}
            <div className={clsx("rounded-3xl border shadow-sm p-6 flex flex-col items-center text-center transition-colors duration-500", theme.card)}>
              <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider w-full text-left mb-6">This Week's Progress</h3>
              <div className="relative mb-6">
                <ProgressRing pct={weeklyStats.pct} size={110} stroke={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-google font-black text-[var(--md-sys-color-on-surface)]">{weeklyStats.completed}</span>
                  <span className="text-[10px] font-medium text-[var(--md-sys-color-secondary)] uppercase bg-[var(--md-sys-color-surface)] dark:bg-slate-800 px-1 relative -top-1">of {weeklyStats.totalClasses}</span>
                </div>
              </div>
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]/50 px-3 py-2 rounded-xl">
                  <span className="text-sm font-semibold flex items-center gap-2 text-green-600"><CheckCircle2 size={16} /> Completed</span>
                  <span className="font-bold text-green-700">{weeklyStats.completed}</span>
                </div>
                <div className="flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]/50 px-3 py-2 rounded-xl">
                  <span className="text-sm font-semibold flex items-center gap-2 text-amber-600"><RefreshCw size={16} /> Pending</span>
                  <span className="font-bold text-amber-700">{weeklyStats.pending}</span>
                </div>
              </div>
            </div>

            {/* 3D Workload density visualizer workload-3d-canvas */}
            <div className={clsx("rounded-3xl border shadow-sm p-4 flex flex-col gap-3 transition-colors duration-500", theme.card)}>
              <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-2">
                <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Box size={14} className="text-violet-500" /> Workload Intensity
                </h3>
                <span className="text-[10px] font-black text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full uppercase">
                  3D View
                </span>
              </div>
              <canvas id="workload-canvas" className="w-full h-48 rounded-2xl bg-slate-950/40 border border-white/10 shadow-inner"></canvas>
              {!webglSupported && (
                <div className="text-xs text-red-500 text-center font-medium mt-1">
                  WebGL not supported on this device.
                </div>
              )}
              {webglContextLost && (
                <div className="text-xs text-amber-500 text-center font-medium mt-1">
                  WebGL context lost. Restoring...
                </div>
              )}
            </div>

            {/* Syllabus Integration Advisor Card */}
            <div className={clsx("rounded-3xl border shadow-sm p-5 flex flex-col gap-4 transition-colors duration-500", theme.card)}>
              <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-3">
                <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Brain size={14} className="text-violet-500" /> Syllabus Alignment
                </h3>
                <span className="text-[10px] font-black text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400 px-2 py-0.5 rounded-full uppercase">
                  Live Sync
                </span>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {Object.entries(data.curriculum || {}).map(([subject, units]) => {
                  const scheduledCount = data.schedule.filter(s => s.subject === subject && s.status !== 'Cancelled').length;
                  const totalUnits = units.length || 1;
                  const percent = Math.min(100, Math.round((scheduledCount / totalUnits) * 100));
                  
                  return (
                    <div key={subject} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-[140px]" title={subject}>
                          {subject}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--md-sys-color-secondary)]">
                          {scheduledCount}/{totalUnits} units
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden relative border border-[var(--md-sys-color-outline-variant)]">
                        <div 
                          className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            percent === 100 ? "bg-green-500" : percent > 50 ? "bg-violet-500" : percent > 0 ? "bg-amber-500" : "bg-slate-300"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {percent === 0 && (
                        <p className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 animate-pulse">
                          ⚠️ Under-allocated: No classes scheduled
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resource Capacity Heatmap */}
            <div className={clsx("rounded-3xl border shadow-sm p-5 flex flex-col gap-4 transition-colors duration-500", theme.card)}>
              <div className="flex items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] pb-3">
                <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={14} className="text-violet-500" /> Lab & Resource Load
                </h3>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase">
                  Heatmap
                </span>
              </div>
              
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {(data.resources || []).map(res => {
                  // Count sessions assigned to this resource in the active week
                  const assignedSlots = weekDates.flatMap(d => {
                    const dateStr = getDateStr(d);
                    const dayOfWeek = d.getDay();
                    
                    return data.schedule.filter(s => {
                      if (!s.resourceIds?.includes(res.id)) return false;
                      if (s.status === 'Cancelled') return false;
                      
                      if (s.overrideDate === dateStr) return true;
                      if (s.dayOfWeek === dayOfWeek && !s.overrideDate) {
                        const isOverridden = data.schedule.some(o => o.replacesSlotId === s.id && o.overrideDate === dateStr);
                        return !isOverridden;
                      }
                      return false;
                    });
                  });
                  
                  const usageCount = assignedSlots.length;
                  const targetLoad = 6;
                  const percent = Math.min(100, Math.round((usageCount / targetLoad) * 100));
                  
                  return (
                    <div key={res.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--md-sys-color-on-surface)] truncate max-w-[130px]" title={res.name}>
                          {res.name}
                        </span>
                        <span className="text-[10px] font-medium text-[var(--md-sys-color-secondary)]">
                          {usageCount} classes • {percent}% load
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden relative border border-[var(--md-sys-color-outline-variant)]">
                        <div 
                          className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            percent > 80 ? "bg-gradient-to-r from-red-500 to-orange-500" : percent > 40 ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-gradient-to-r from-emerald-500 to-teal-500"
                          )}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {percent > 80 && (
                        <p className="text-[9px] text-red-500 font-bold flex items-center gap-0.5 animate-pulse">
                          🔥 Heavy usage: High risk of scheduling conflict
                        </p>
                      )}
                    </div>
                  );
                })}
                {(data.resources || []).length === 0 && (
                  <p className="text-xs text-[var(--md-sys-color-secondary)] italic text-center py-4">
                    No active labs or equipment configured.
                  </p>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-4 space-y-4">
                <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Settings size={14} /> Timetable Settings
                </h3>

                {/* Grid Density */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Grid Density</span>
                  <div className="flex bg-[var(--md-sys-color-surface-variant)] p-0.5 rounded-lg">
                    <button
                      onClick={() => setGridDensity('compact')}
                      className={clsx("px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                        gridDensity === 'compact' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]"
                      )}
                    >Compact</button>
                    <button
                      onClick={() => setGridDensity('comfortable')}
                      className={clsx("px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                        gridDensity === 'comfortable' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]"
                      )}
                    >Comfortable</button>
                  </div>
                </div>

                {/* Show Completed */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Show Completed</span>
                  <input type="checkbox" checked={showCompletedClasses} onChange={() => setShowCompletedClasses(!showCompletedClasses)} className="w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)]" />
                </label>

                {/* Animations */}
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Animations</span>
                  <input type="checkbox" checked={enableAnimations} onChange={() => setEnableAnimations(!enableAnimations)} className="w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)]" />
                </label>

                {/* Factory Reset */}
                {onResetSchedule && user?.role !== 'viewer' && (
                  <div className="pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Factory Reset Timetable?',
                          message: 'This will delete ALL custom classes and restore the default timetable template. This cannot be undone. Continue?',
                          onConfirm: () => {
                            if (onResetSchedule) onResetSchedule();
                            setShowSettings(false);
                            showToast('Timetable reset to factory defaults', 'info');
                          }
                        });
                      }}
                      className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl flex items-center justify-center gap-2 text-red-600 font-bold text-sm transition-colors"
                    >
                      <Trash2 size={16} /> Factory Reset Timetable
                    </button>
                    <p className="text-[11px] text-[var(--md-sys-color-secondary)] mt-2 text-center">Restores the default schedule template</p>
                  </div>
                )}
              </div>
            )}

            {/* Show Completed (always visible) */}
            <div className="flex items-center justify-between px-2 pt-2">
              <label className="text-sm font-medium text-[var(--md-sys-color-on-surface)] cursor-pointer flex items-center gap-2">
                <input type="checkbox" checked={showCompletedClasses} onChange={() => setShowCompletedClasses(!showCompletedClasses)} className="w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)]" />
                Show Completed
              </label>
            </div>
          </aside>

          {/* === TIME GRID CONTAINER === */}
          <main ref={printAreaRef} className={clsx("flex-1 flex flex-col rounded-2xl md:rounded-3xl border shadow-sm overflow-hidden relative transition-colors duration-500", theme.card)}>
            {view === 'day' ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
                
                {/* Day Header Info */}
                <div className="flex items-center justify-between mb-4 border-b border-[var(--md-sys-color-outline-variant)] pb-4">
                  <div>
                    <h2 className="text-lg font-google font-bold text-[var(--md-sys-color-on-surface)]">
                      {referenceDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                    <p className="text-xs text-[var(--md-sys-color-secondary)]">
                      {daySlotsChronological.length} classes scheduled for today
                    </p>
                  </div>
                  
                  {isHoliday(referenceDate, data.holidays || []) && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-xl animate-pulse">
                      🎉 Public Holiday
                    </span>
                  )}
                </div>

                {/* Holiday alert if holiday */}
                {(() => {
                  const holiday = isHoliday(referenceDate, data.holidays || []);
                  if (holiday) {
                    return (
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 text-center max-w-md mx-auto my-8">
                        <span className="text-4xl block mb-3">🎉</span>
                        <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 uppercase">{holiday.name}</h3>
                        <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1.5 leading-relaxed">
                          This day is marked as a holiday. Regular classes are suspended.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Agenda List */}
                {daySlotsChronological.length > 0 ? (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {daySlotsChronological.map(slot => {
                      const color = getSlotColor(slot);
                      const isCompleted = slot.status === 'Completed';
                      const isCancelled = slot.status === 'Cancelled';
                      const dateStr = getDateStr(referenceDate);
                      
                      // Check conflicts
                      const daySlots = data.schedule.filter(s => {
                        if (s.id === slot.id) return false;
                        if (s.status === 'Cancelled') return false;
                        if (s.overrideDate === dateStr) return true;
                        if (s.dayOfWeek === slot.dayOfWeek && !s.overrideDate) {
                          const isOverridden = data.schedule.some(o => o.replacesSlotId === s.id && o.overrideDate === dateStr);
                          return !isOverridden;
                        }
                        return false;
                      });
                      const slotConflicts = detectConflicts(slot, daySlots);
                      const hasConflict = slotConflicts.length > 0;

                      // Check if ongoing
                      const startMin = timeToMinutes(slot.startTime);
                      const endMin = startMin + slot.durationMinutes;
                      const nowMin = now.getHours() * 60 + now.getMinutes();
                      const isToday = dateStr === getDateStr(new Date());
                      const isOngoing = isToday && nowMin >= startMin && nowMin < endMin;
                      
                      let progressPercent = 0;
                      if (isOngoing) {
                        progressPercent = ((nowMin - startMin) / slot.durationMinutes) * 100;
                      }

                      return (
                        <div
                          key={slot.id}
                          onClick={() => { setSelectedSlot(slot); setIsEditingSlot(false); setSelectedDate(referenceDate); }}
                          className={clsx(
                            "group cursor-pointer rounded-3xl border-l-[8px] bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm hover:shadow-lg hover:border-[var(--md-sys-color-primary-container)] hover:scale-[1.01] transition-all duration-300 p-4 md:p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 relative overflow-hidden",
                            color.border,
                            isCompleted && "opacity-60 saturate-50",
                            isCancelled && "border-l-red-500 opacity-50 bg-red-50/5",
                            isOngoing && "ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-slate-900 shadow-md shadow-violet-500/10",
                            hasConflict && "ring-2 ring-red-550 border-red-500"
                          )}
                          style={{
                            boxShadow: isCompleted ? 'none' : `0 6px 20px -6px ${color.accent}12, inset 0 1px 0 0 rgba(255,255,255,0.2)`
                          }}
                        >
                          {/* Ongoing gradient pulse */}
                          {isOngoing && (
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-transparent animate-pulse pointer-events-none" />
                          )}

                          {/* Time Axis Column */}
                          <div className="flex md:flex-col items-center md:items-start justify-between md:justify-center border-b md:border-b-0 md:border-r border-[var(--md-sys-color-outline-variant)] pb-3 md:pb-0 md:pr-6 md:min-w-[140px] flex-shrink-0">
                            <div>
                              <p className="text-base md:text-lg font-google font-bold text-[var(--md-sys-color-on-surface)]">
                                {slot.startTime}
                              </p>
                              <p className="text-xs text-[var(--md-sys-color-secondary)] font-medium mt-0.5">
                                {slot.durationMinutes} minutes
                              </p>
                            </div>
                            
                            {/* Live ongoing tracker */}
                            {isOngoing && (
                              <span className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 animate-pulse border border-red-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Ongoing
                              </span>
                            )}
                          </div>

                          {/* Subject & Details Column */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={clsx("p-2 rounded-xl bg-white dark:bg-slate-800 shadow-inner flex items-center justify-center", color.text)}>
                                {getSubjectIcon(slot.subject, 18)}
                              </span>
                              <h3 className="text-base md:text-lg font-google font-bold text-[var(--md-sys-color-on-surface)] group-hover:text-violet-650 transition-colors">
                                {slot.subject}
                              </h3>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[var(--md-sys-color-secondary)] uppercase">
                                {getLevelShortLabel(slot.studentGroup || 'Academy', String(slot.grade))}
                              </span>
                              {slot.overrideDate && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase rounded-full border border-blue-150">
                                  Rescheduled
                                </span>
                              )}
                            </div>

                            {/* Assigned Resources List */}
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="text-[10px] font-extrabold text-[var(--md-sys-color-secondary)] uppercase">Assets:</span>
                              {slot.resourceIds && slot.resourceIds.length > 0 ? (
                                slot.resourceIds.map(resId => {
                                  const res = data.resources?.find(r => r.id === resId);
                                  if (!res) return null;
                                  return (
                                    <span key={resId} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[var(--md-sys-color-secondary)] text-[10px] font-medium border border-[var(--md-sys-color-outline-variant)]">
                                      <Box size={10} /> {res.name}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[10px] text-[var(--md-sys-color-secondary)] italic">None assigned</span>
                              )}
                            </div>

                            {/* Conflict Message */}
                            {hasConflict && (
                              <div className="bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 rounded-xl p-2.5 flex items-start gap-2 max-w-lg">
                                <AlertTriangle size={14} className="text-red-550 flex-shrink-0 mt-0.5 animate-pulse" />
                                <div className="text-[11px] leading-relaxed text-red-800 dark:text-red-300">
                                  <p className="font-bold">Schedule Conflict Detected:</p>
                                  <ul className="list-disc pl-3.5 space-y-0.5 mt-0.5">
                                    {slotConflicts.map((c, i) => <li key={i}>{c.message}</li>)}
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Stats & Actions Column */}
                          <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-[var(--md-sys-color-outline-variant)] pt-3 md:pt-0">
                            
                            {/* Students Attend count */}
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-black text-[var(--md-sys-color-on-surface)] flex items-center justify-end gap-1">
                                  <Users size={14} className="text-[var(--md-sys-color-secondary)]" /> {getStudentCount(slot)}
                                </p>
                                <p className="text-[10px] text-[var(--md-sys-color-secondary)] uppercase font-extrabold tracking-wider">Students</p>
                              </div>
                              
                              {/* Status Badge */}
                              <span className={clsx(
                                "px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border",
                                isCompleted && "bg-green-55 border-green-150 text-green-700 dark:bg-green-900/20 dark:border-green-800",
                                isCancelled && "bg-red-50 border-red-150 text-red-750 dark:bg-red-900/20 dark:border-green-800",
                                !isCompleted && !isCancelled && "bg-amber-50 border-amber-150 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800"
                              )}>
                                {slot.status}
                              </span>
                            </div>

                            {/* Ongoing Lesson Progress Circle */}
                            {isOngoing && (
                              <div className="w-10 h-10 relative flex-shrink-0 flex items-center justify-center hidden sm:flex">
                                <svg width="36" height="36" className="-rotate-90">
                                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--md-sys-color-outline-variant)" strokeWidth="3" />
                                  <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={2 * Math.PI * 14} strokeDashoffset={2 * Math.PI * 14 - (2 * Math.PI * 14 * progressPercent) / 100} strokeLinecap="round" />
                                </svg>
                                <span className="absolute text-[8px] font-extrabold text-[var(--md-sys-color-on-surface)]">
                                  {Math.round(progressPercent)}%
                                </span>
                              </div>
                            )}

                            {/* Direct Actions */}
                            {user?.role !== 'viewer' && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => handleStatusChange(isCompleted ? 'Pending' : 'Completed', slot)}
                                  className={clsx(
                                    "p-2 rounded-xl transition-all hover:scale-105 border cursor-pointer",
                                    isCompleted 
                                      ? "bg-green-500 text-white border-green-600 shadow-sm" 
                                      : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-green-50 border-transparent hover:text-green-600 hover:border-green-150"
                                  )}
                                  title={isCompleted ? "Mark Pending" : "Mark Completed"}
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    setConfirmDialog({
                                      isOpen: true,
                                      title: 'Cancel Lesson Session?',
                                      message: `Are you sure you want to cancel the scheduled ${slot.subject} class?`,
                                      onConfirm: () => handleStatusChange('Cancelled', slot)
                                    });
                                  }}
                                  className="p-2 bg-[var(--md-sys-color-surface-variant)] hover:bg-red-50 text-[var(--md-sys-color-secondary)] hover:text-red-500 border border-transparent hover:border-red-150 rounded-xl transition-all hover:scale-105 cursor-pointer"
                                  title="Cancel lesson"
                                >
                                  <XCircle size={14} />
                                </button>
                              </div>
                            )}

                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-[var(--md-sys-color-surface-variant)]/30 rounded-3xl border border-[var(--md-sys-color-outline-variant)] border-dashed max-w-lg mx-auto my-8 flex flex-col items-center">
                    <span className="text-5xl block mb-4">🌴</span>
                    <h3 className="text-lg font-google font-bold text-[var(--md-sys-color-on-surface)]">No classes scheduled</h3>
                    <p className="text-xs text-[var(--md-sys-color-secondary)] mt-1.5 max-w-xs leading-relaxed">
                      Go ahead and schedule a new class session using the "Add Class" button above.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              /* Week View DndContext Grid */
              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden select-none touch-pan-x">
                  <div className={clsx("flex-1 flex flex-col", view === 'week' && "min-w-[850px] md:min-w-0")}>
                    {/* Day Headers (Sticky) */}
                    <div className={clsx("grid border-b border-[var(--md-sys-color-outline-variant)] flex-shrink-0 bg-[var(--md-sys-color-surface)] z-10", view === 'week' ? "grid-cols-[50px_repeat(7,1fr)] md:grid-cols-[70px_repeat(7,1fr)]" : "grid-cols-[50px_1fr] md:grid-cols-[70px_1fr]")}>
                      <div className="h-12 md:h-16 border-r border-[var(--md-sys-color-outline-variant)] flex items-center justify-center">
                        <span className="text-[9px] md:text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-widest">GMT+3</span>
                      </div>
                      {displayedDates.map(date => {
                        const isToday = getDateStr(date) === getDateStr(new Date());
                        return (
                          <div key={date.toString()} className="h-12 md:h-16 flex flex-col items-center justify-center border-r border-[var(--md-sys-color-outline-variant)] relative">
                            {isToday && <div className="absolute top-0 w-full h-1 bg-violet-500 rounded-t-xl" />}
                            <span className={clsx("text-[10px] md:text-xs font-medium uppercase tracking-wider", isToday ? "text-violet-600" : "text-[var(--md-sys-color-secondary)]")}>
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={clsx("text-base md:text-xl font-google font-bold mt-0.5", isToday ? "text-violet-700" : "text-[var(--md-sys-color-on-surface)]")}>
                              {date.getDate()}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Scrollable Area */}
                    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-[var(--md-sys-color-surface)] hide-scrollbar bg-grid-pattern">
                      <div className={clsx("grid min-h-full", view === 'week' ? "grid-cols-[50px_repeat(7,1fr)] md:grid-cols-[70px_repeat(7,1fr)]" : "grid-cols-[50px_1fr] md:grid-cols-[70px_1fr]")}>

                        {/* Time Axis */}
                        <div className="border-r border-[var(--md-sys-color-outline-variant)] relative bg-[var(--md-sys-color-surface-variant)]/30">
                          {displayedHours.map(t => (
                            <div key={t} className="text-[10px] md:text-xs text-[var(--md-sys-color-secondary)] text-right pr-1.5 md:pr-3 -mt-2 font-medium" style={{ height: hourHeight }}>
                              {t}
                            </div>
                          ))}
                        </div>

                        {/* Day Columns */}
                        {displayedDates.map((date, dateIdx) => {
                          const slots = memoizedVisibleSlots.get(getDateStr(date)) || [];
                          const isToday = getDateStr(date) === getDateStr(new Date());
                          const holiday = isHoliday(date, data.holidays || []);

                          return (
                            <DroppableDayColumn
                              key={dateIdx}
                              date={date}
                              dateIdx={dateIdx}
                              hourHeight={hourHeight}
                              holiday={holiday}
                              hoursCount={displayedHours.length}
                            >
                              {/* Soft Dashed Hour Lines */}
                              {displayedHours.map((_, i) => (
                                <div
                                  key={i}
                                  className="absolute w-full border-t border-[var(--md-sys-color-outline-variant)] border-dashed opacity-50"
                                  style={{ top: i * hourHeight }}
                                />
                              ))}

                              {/* Red NOW Indicator */}
                              {isToday && (
                                <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none group" style={{ top: currentTimeTop }} aria-current="time">
                                  <div className="w-3.5 h-3.5 rounded-full bg-red-550 -ml-1.5 shadow-[0_0_10px_#ef4444] ring-4 ring-[var(--md-sys-color-surface)] relative">
                                    <div className="absolute inset-0 rounded-full bg-red-555 animate-ping opacity-75"></div>
                                  </div>
                                  <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] relative">
                                    <div className="absolute top-[2px] left-0 right-0 h-40 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />
                                  </div>
                                  <div className="absolute left-6 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              )}

                              {/* Slots */}
                              {slots.map(slot => {
                                const startHour = parseInt(slot.startTime.split(':')[0]);
                                const startMin = parseInt(slot.startTime.split(':')[1] || '0');
                                const displayHour = startHour - (workingHoursOnly ? startWorkingHour : 0);
                                const top = (displayHour * hourHeight) + ((startMin / 60) * hourHeight);
                                const height = (slot.durationMinutes / 60) * hourHeight;
                                const color = getSlotColor(slot);
                                const isOverride = !!slot.overrideDate;
                                const isCompleted = slot.status === 'Completed';
                                const dateStr = getDateStr(date);

                                // Check conflicts for this slot
                                const daySlots = data.schedule.filter(s => {
                                  if (s.id === slot.id) return false;
                                  if (s.status === 'Cancelled') return false;
                                  if (s.overrideDate === dateStr) return true;
                                  if (s.dayOfWeek === slot.dayOfWeek && !s.overrideDate) {
                                    const isOverridden = data.schedule.some(o => o.replacesSlotId === s.id && o.overrideDate === dateStr);
                                    return !isOverridden;
                                  }
                                  return false;
                                });
                                const slotConflicts = detectConflicts(slot, daySlots);
                                const hasConflict = slotConflicts.length > 0;

                                return (
                                  <DraggableSlot
                                    key={slot.id}
                                    slot={slot}
                                    hourHeight={hourHeight}
                                    onSlotClick={() => { setSelectedSlot(slot); setIsEditingSlot(false); setSelectedDate(date); }}
                                    disabled={user?.role === 'viewer'}
                                    className={clsx(
                                      "rounded-2xl border-l-[6px] p-2.5 cursor-pointer overflow-hidden backdrop-blur-md transition-transform duration-200 group flex flex-col justify-between absolute left-1 right-2 hover:scale-[1.02] hover:z-30 shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]",
                                      color.bg, color.border,
                                      isCompleted ? "opacity-60 saturate-50" : "shadow-sm shadow-black/5 dark:shadow-black/20",
                                      isOverride && !isTemplateMode && "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900",
                                      isTemplateMode && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900 border-dashed",
                                      hasConflict && "ring-2 ring-red-500 ring-offset-1 dark:ring-offset-slate-900 border-l-red-650"
                                    )}
                                    style={{ 
                                      top, 
                                      height: height - 4,
                                      boxShadow: isCompleted ? 'none' : `0 6px 16px -4px ${color.accent}30, inset 0 1px 0 0 rgba(255,255,255,0.2)`
                                    }}
                                  >
                                    <div className="flex-1 min-w-0 flex flex-col">
                                      <div className="flex justify-between items-start gap-1">
                                        <div className={clsx("font-bold text-sm leading-tight flex items-center gap-1.5 truncate", color.text)}>
                                          {getSubjectIcon(slot.subject, 14)}
                                          <span>{slot.subject}</span>
                                          {hasConflict && <span title="Schedule conflict detected"><AlertTriangle size={12} className="text-red-550 animate-pulse flex-shrink-0" /></span>}
                                        </div>

                                        {/* Edit Efficiency: Quick Action Toggle + Delete */}
                                        {user?.role !== 'viewer' && (
                                          <div className="flex-shrink-0 flex items-center gap-0.5 z-20">
                                            {onDeleteSlot && (
                                              <button
                                                aria-label="Delete class"
                                                title="Delete class"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfirmDialog({
                                                    isOpen: true,
                                                    title: 'Delete Class?',
                                                    message: 'Are you sure you want to permanently delete this class from your schedule?',
                                                    onConfirm: () => {
                                                      onDeleteSlot(slot.id);
                                                      showToast('Class deleted', 'success');
                                                    }
                                                  });
                                                }}
                                                className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/60 dark:bg-black/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-[var(--md-sys-color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                                              >
                                                <Trash2 size={12} />
                                              </button>
                                            )}
                                            <button
                                              aria-label="Toggle Complete Status"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(isCompleted ? 'Pending' : 'Completed', slot);
                                              }}
                                              className={clsx(
                                                "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer",
                                                isCompleted ? "bg-green-500 text-white" : "bg-white/60 dark:bg-black/20 hover:bg-green-100 text-[var(--md-sys-color-secondary)] opacity-0 group-hover:opacity-100"
                                              )}
                                            >
                                              <Check size={14} strokeWidth={isCompleted ? 3 : 2} />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                      <div className={clsx("text-xs font-semibold mt-0.5", color.text, "opacity-80")}>
                                        {getLevelShortLabel(slot.studentGroup || 'Academy', String(slot.grade))} • {slot.startTime}
                                      </div>

                                      <div className="flex items-center gap-1.5 mt-auto pt-1">
                                        <span className={clsx("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md", color.text, "bg-white/40 dark:bg-black/20")}>
                                          <Users size={10} /> {getStudentCount(slot)}
                                        </span>
                                        {isOverride && <Sparkles size={10} className="text-blue-500 ml-auto" />}
                                      </div>
                                    </div>
                                  </DraggableSlot>
                                );
                              })}
                            </DroppableDayColumn>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </DndContext>
            )}
          </main>
        </div>

        <AnimatePresence>
          {showAddModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[420px] max-h-[85vh] overflow-y-auto bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl shadow-2xl z-50 border border-[var(--md-sys-color-outline-variant)]"
              >
                <div className="h-2 bg-gradient-to-r from-violet-500 to-indigo-600" />
                <div className="p-6">
                  <h3 className="text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] mb-6 flex items-center gap-2">
                    <Plus size={24} className="text-violet-600" /> New Class Session
                  </h3>

                  <div className="space-y-5">
                    {/* Quick Selection Pills */}
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Subject</label>
                      <div className="flex gap-2 flex-wrap">
                        {subjects.map(s => (
                          <button key={s} aria-pressed={newSlot.subject === s} onClick={() => setNewSlot({ ...newSlot, subject: s as any })} className={clsx("px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlot.subject === s ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {getSubjectEmoji(s)} {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {getStudentGroups(preferences?.institutionType).length > 1 && (
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Student Group</label>
                        <div className="flex gap-2 flex-wrap">
                          {getStudentGroups(preferences?.institutionType).map(g => (
                            <button key={g} aria-pressed={newSlotGroup === g} onClick={() => { setNewSlotGroup(g); setNewSlot({ ...newSlot, grade: getDefaultLevel(g, preferences?.institutionType), studentGroup: g }); }} className={clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlotGroup === g ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">
                        {preferences?.terminology?.classLabel || 'Level'}
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {getLevelsForGroup(newSlotGroup, preferences?.institutionType).map(lvl => (
                          <button key={lvl.id} aria-pressed={newSlot.grade === lvl.id} onClick={() => setNewSlot({ ...newSlot, grade: lvl.id })} className={clsx("px-3 py-2.5 rounded-2xl font-bold text-sm border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlot.grade === lvl.id ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {lvl.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Day</label>
                        <select aria-label="Select Day" value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })} className="w-full px-4 py-3 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none cursor-pointer">
                          {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase">Time</label>
                          <button onClick={handleSuggestSlot} className="text-[10px] text-violet-600 font-bold hover:underline py-0.5 px-1 rounded focus-visible:ring-2">Auto-fill</button>
                        </div>
                        <select aria-label="Select Time" value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} className="w-full px-4 py-3 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none cursor-pointer">
                          {TIME_OPTIONS_15MIN.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Duration Picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Duration</label>
                      <div className="flex gap-2 flex-wrap">
                        {DURATION_OPTIONS.map(d => (
                          <button
                            key={d}
                            aria-pressed={newSlotDurationMode === 'preset' && newSlot.durationMinutes === d}
                            onClick={() => { setNewSlotDurationMode('preset'); setNewSlot({ ...newSlot, durationMinutes: d }); }}
                            className={clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500",
                              newSlotDurationMode === 'preset' && newSlot.durationMinutes === d
                                ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm"
                                : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                            )}
                          >
                            {d} min
                          </button>
                        ))}
                        <button
                          aria-pressed={newSlotDurationMode === 'custom'}
                          onClick={() => setNewSlotDurationMode('custom')}
                          className={clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500",
                            newSlotDurationMode === 'custom'
                              ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm"
                              : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                          )}
                        >
                          Custom
                        </button>
                      </div>
                      {newSlotDurationMode === 'custom' && (
                        <input
                          type="number"
                          min={5}
                          max={480}
                          placeholder="Minutes"
                          aria-label="Custom duration in minutes"
                          value={customDuration}
                          onChange={e => {
                            const v = parseInt(e.target.value);
                            setCustomDuration(e.target.value === '' ? '' : v);
                            if (!isNaN(v) && v > 0) setNewSlot({ ...newSlot, durationMinutes: v });
                          }}
                          className="mt-2 w-full px-4 py-3 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 pt-6 border-t border-[var(--md-sys-color-outline-variant)]">
                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-2xl font-bold hover:bg-[var(--md-sys-color-outline-variant)] transition-colors focus-visible:ring-2 focus-visible:ring-violet-500">Cancel</button>
                    <button onClick={() => { if (onAddSlot) onAddSlot(newSlot as any); setShowAddModal(false); showToast('Class Created', 'success'); }} className="flex-1 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl font-bold shadow-md hover:shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--md-sys-color-primary)]">Create</button>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* Slot Details Modal (Restyled) */}
          {selectedSlot && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSlot(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[400px] max-h-[85vh] overflow-y-auto bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl shadow-2xl z-50 border border-[var(--md-sys-color-outline-variant)]"
              >
                <div className={clsx("h-3 w-full", getSlotColor(selectedSlot).dot)} />
                <div className="p-6">
                  {isEditingSlot && editSlotData ? (
                    // EDIT MODE
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                          <Edit3 size={24} className="text-violet-600" /> Edit Class Details
                        </h3>
                        <button onClick={() => setIsEditingSlot(false)} aria-label="Cancel Edit" className="p-2 bg-[var(--md-sys-color-surface-variant)] rounded-full hover:bg-[var(--md-sys-color-outline-variant)] transition-colors"><XCircle size={20} className="text-[var(--md-sys-color-secondary)]" /></button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Subject</label>
                          <div className="flex gap-2 flex-wrap">
                            {subjects.map(s => (
                              <button key={s} aria-pressed={editSlotData.subject === s} onClick={() => setEditSlotData({ ...editSlotData, subject: s as any })} className={clsx("px-3 py-2 rounded-xl font-bold text-sm border transition-all", editSlotData.subject === s ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                                {getSubjectEmoji(s)} {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {getStudentGroups(preferences?.institutionType).length > 1 && (
                          <div>
                            <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Student Group</label>
                            <div className="flex gap-2 flex-wrap">
                              {getStudentGroups(preferences?.institutionType).map(g => (
                                <button key={g} aria-pressed={editSlotData.studentGroup === g} onClick={() => setEditSlotData({ ...editSlotData, studentGroup: g, grade: getDefaultLevel(g, preferences?.institutionType) })} className={clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all", editSlotData.studentGroup === g ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">
                            {preferences?.terminology?.classLabel || 'Level'}
                          </label>
                          <div className="flex gap-2 flex-wrap">
                            {getLevelsForGroup(editSlotData.studentGroup || 'Academy', preferences?.institutionType).map(lvl => (
                              <button key={lvl.id} aria-pressed={editSlotData.grade === lvl.id} onClick={() => setEditSlotData({ ...editSlotData, grade: lvl.id })} className={clsx("px-3 py-2 rounded-xl font-bold text-sm border transition-all", editSlotData.grade === lvl.id ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}
                              >
                                {lvl.shortLabel}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Day</label>
                            <select aria-label="Select Day" value={editSlotData.dayOfWeek} onChange={e => setEditSlotData({ ...editSlotData, dayOfWeek: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer">
                              {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Time</label>
                            <select aria-label="Select Time" value={editSlotData.startTime} onChange={e => setEditSlotData({ ...editSlotData, startTime: e.target.value })} className="w-full px-3 py-2.5 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer">
                              {TIME_OPTIONS_15MIN.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Duration Picker (Edit) */}
                        <div>
                          <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Duration</label>
                          <div className="flex gap-2 flex-wrap">
                            {DURATION_OPTIONS.map(d => (
                              <button
                                key={d}
                                aria-pressed={editSlotData.durationMinutes === d}
                                onClick={() => setEditSlotData({ ...editSlotData, durationMinutes: d })}
                                className={clsx("px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500",
                                  editSlotData.durationMinutes === d
                                    ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm"
                                    : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                )}
                              >
                                {d}m
                              </button>
                            ))}
                          </div>
                          {!DURATION_OPTIONS.includes(editSlotData.durationMinutes) && (
                            <input
                              type="number"
                              min={5}
                              max={480}
                              aria-label="Custom duration in minutes"
                              value={editSlotData.durationMinutes}
                              onChange={e => {
                                const v = parseInt(e.target.value);
                                if (!isNaN(v) && v > 0) setEditSlotData({ ...editSlotData, durationMinutes: v });
                              }}
                              className="mt-2 w-full px-3 py-2 border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            />
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl border border-violet-100 dark:border-violet-800/30">
                        <div className="flex items-center gap-2">
                          <Bell size={16} className="text-violet-600" />
                          <span className="text-sm font-bold text-violet-900 dark:text-violet-300">Notify students of changes</span>
                        </div>
                        <input type="checkbox" aria-label="Notify students" checked={notifyStudents} onChange={(e) => setNotifyStudents(e.target.checked)} className="w-4 h-4 rounded text-violet-600 border-[var(--md-sys-color-outline)] cursor-pointer" />
                      </div>

                      <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--md-sys-color-outline-variant)]">
                        <button onClick={() => setIsEditingSlot(false)} className="flex-1 py-2.5 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold transition-colors">Cancel</button>
                        <button onClick={async () => {
                          if (onEditSlot) onEditSlot(editSlotData);
                          setSelectedSlot(editSlotData);
                          setIsEditingSlot(false);

                          if (notifyStudents) {
                            showToast('Broadcasting schedule update...', 'info');
                            const success = await notificationService.sendRemoteNotification({
                              title: 'Schedule Update',
                              body: `Your ${editSlotData.subject} class on ${DAYS[editSlotData.dayOfWeek - 1]} at ${editSlotData.startTime} has been updated.`,
                              type: 'push'
                            });
                            if (success) showToast('Students notified', 'success');
                          }
                        }} className="flex-1 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold shadow-md transition-all">Save Changes</button>
                      </div>
                    </>
                  ) : (
                    // VIEW MODE
                    <>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                            {getSubjectIconLarge(selectedSlot.subject, 24)}
                            {selectedSlot.subject} Class
                          </h2>
                          <p className="text-sm font-medium text-[var(--md-sys-color-secondary)] mt-1">
                            {getLevelShortLabel(selectedSlot.studentGroup || 'Academy', String(selectedSlot.grade))} • {selectedDate?.toLocaleDateString('en-US', { weekday: 'long' })} • {selectedSlot.startTime}
                          </p>
                        </div>
                        <button onClick={() => setSelectedSlot(null)} aria-label="Close Details" className="p-2 bg-[var(--md-sys-color-surface-variant)] rounded-full hover:bg-[var(--md-sys-color-outline-variant)] transition-colors"><XCircle size={20} className="text-[var(--md-sys-color-secondary)]" /></button>
                      </div>

                      {user?.role !== 'viewer' && (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <button onClick={() => handleStatusChange('Completed')} className={clsx("flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all focus-visible:ring-2", selectedSlot.status === 'Completed' ? "bg-green-100 text-green-800 ring-2 ring-green-400" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-outline-variant)]")}>
                            <CheckCircle2 size={24} /> <span className="text-[11px] font-bold uppercase">Complete</span>
                          </button>
                          <button onClick={() => handleStatusChange('Pending')} className={clsx("flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all focus-visible:ring-2", selectedSlot.status === 'Pending' ? "bg-amber-100 text-amber-800 ring-2 ring-amber-400" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-outline-variant)]")}>
                            <RefreshCw size={24} /> <span className="text-[11px] font-bold uppercase">Pending</span>
                          </button>
                          <button onClick={() => handleStatusChange('Cancelled')} className={clsx("flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all focus-visible:ring-2", selectedSlot.status === 'Cancelled' ? "bg-red-100 text-red-800 ring-2 ring-red-400" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-outline-variant)]")}>
                            <XCircle size={24} /> <span className="text-[11px] font-bold uppercase">Cancel</span>
                          </button>
                        </div>
                      )}

                      <div className="space-y-2 border-t border-[var(--md-sys-color-outline-variant)] pt-4">
                        <button onClick={() => { setSelectedSlot(null); onNavigate?.('attendance'); }} className="w-full text-left px-4 py-3 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-outline-variant)] rounded-2xl flex items-center justify-between text-[var(--md-sys-color-on-surface)] font-bold transition-colors">
                          <span className="flex items-center gap-3"><Users size={18} className="text-violet-500" /> View Attendance ({getStudentCount(selectedSlot)})</span>
                          <ArrowRight size={16} className="text-[var(--md-sys-color-secondary)]" />
                        </button>

                        {user?.role !== 'viewer' && (
                          <div className="flex gap-2">
                            <button onClick={() => { setEditSlotData(selectedSlot); setIsEditingSlot(true); }} className="flex-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-primary-container)] rounded-2xl flex items-center justify-center gap-2 text-[var(--md-sys-color-on-surface)] font-bold transition-colors">
                              <Edit3 size={18} /> Edit Details
                            </button>
                            <button onClick={handleDuplicateSlot} className="flex-1 px-4 py-3 bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-primary-container)] rounded-2xl flex items-center justify-center gap-2 text-[var(--md-sys-color-on-surface)] font-bold transition-colors">
                              <Copy size={18} /> Duplicate
                            </button>
                            {onDeleteSlot && (
                              <button onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Class Permanently?',
                                  message: 'Are you sure you want to permanently delete this class?',
                                  onConfirm: () => {
                                    onDeleteSlot(selectedSlot.id);
                                    setSelectedSlot(null);
                                    showToast('Class deleted', 'success');
                                  }
                                });
                              }} className="px-4 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold transition-colors" title="Delete this class">
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Custom Confirmation Dialog */}
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 m-auto w-full max-w-sm h-fit bg-[var(--md-sys-color-surface)] dark:bg-slate-900 rounded-[28px] shadow-2xl z-50 border border-[var(--md-sys-color-outline-variant)] overflow-hidden"
              >
                <div className="p-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6 mx-auto">
                    <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-google font-bold text-center text-[var(--md-sys-color-on-surface)] mb-3">{confirmDialog.title}</h2>
                  <p className="text-[15px] leading-relaxed text-center text-[var(--md-sys-color-secondary)] mb-8">{confirmDialog.message}</p>
                  <div className="flex gap-4">
                    <button onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-3.5 rounded-2xl font-bold bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] transition-all">
                      Cancel
                    </button>
                    <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }} className="flex-1 px-4 py-3.5 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Schedule;
