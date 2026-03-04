import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AppData, ScheduleSlot, Student, StudentGroup } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { EDUCATION_LEVELS, STUDENT_GROUPS, getLevelsForGroup, getDefaultLevel, getLevelShortLabel } from '../constants/educationLevels';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Settings, Zap, Monitor,
  Sparkles, Edit3, CheckCircle2, XCircle, Users, Copy, LayoutGrid, List,
  Maximize2, Minimize2, Check, GripVertical, RefreshCw, AlertTriangle, Box,
  FileDown, Printer, Wand2, ArrowRight, Bell
} from 'lucide-react';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  DragEndEvent, useSensors, useSensor, PointerSensor,
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
import { detectConflicts, timeToMinutes, isHoliday, findBestSlot } from '../utils/scheduling';
import { notificationService } from '../services/notificationService';

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

  const [gridDensity, setGridDensity] = useLocalStorage<'compact' | 'comfortable'>('schedule_density', 'comfortable');
  const [showCompletedClasses, setShowCompletedClasses] = useLocalStorage<boolean>('schedule_show_completed', true);
  const [classColors, setClassColors] = useLocalStorage<Record<string, number>>('schedule_colors', {});
  const [enableAnimations, setEnableAnimations] = useLocalStorage<boolean>('schedule_animations', true);

  // Auto-detect mobile and force day-view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && view === 'week') setView('day');
    };
    window.addEventListener('resize', handleResize);
    // Force day-view on initial mobile load
    if (window.innerWidth < 768 && view === 'week') setView('day');
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Custom confirm dialog state to bypass window.confirm issues in webviews
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });


  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  // Jump to Now logic
  const scrollToNow = useCallback(() => {
    if (scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const hourHeight = gridDensity === 'compact' ? 68 : 88;
      // Center the current time somewhat
      const targetScroll = Math.max(0, (currentHour * hourHeight) - 200);
      scrollContainerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [gridDensity]);

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

  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
  }, [weekDates, referenceDate, view, data.schedule, showCompletedClasses, isTemplateMode]);

  const getSlotColor = (slot: ScheduleSlot) => {
    const idx = classColors[slot.id] ?? (slot.subject === 'Solar' ? 4 : 3);
    return CLASS_COLORS[idx] || CLASS_COLORS[3];
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
  const currentTimeTop = (currentHour * hourHeight) + ((currentMinute / 60) * hourHeight);

  // Auto-scroll to current time on mount (stopwatch animation)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const currentH = new Date().getHours();
    const currentM = new Date().getMinutes();
    // Scroll to 1 hour before current time, clamped to 0
    const targetHour = Math.max(0, currentH - 1);
    const targetOffset = (targetHour * hourHeight) + ((currentM / 60) * hourHeight);
    // Small delay so the DOM is ready, then smooth scroll
    const timeout = setTimeout(() => {
      container.scrollTo({ top: targetOffset, behavior: 'smooth' });
    }, 300);
    return () => clearTimeout(timeout);
  }, [hourHeight]);

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
        if (user?.role !== 'viewer') setShowAddModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, selectedSlot, confirmDialog.isOpen, user?.role]);

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

  if (!data) return null;

  return (
    <PageTransition>
      <div className="h-full pb-20 lg:pb-0 flex flex-col bg-[var(--md-sys-color-surface)] overflow-hidden font-sans">

        {/* === FLOATING HEADER BAR === */}
        <div className="flex-shrink-0 px-3 md:px-6 pt-3 md:pt-6 pb-2 md:pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-4 bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-3 md:p-4">

            <div className="flex items-center gap-3 md:gap-4 flex-1 w-full">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                <CalendarIcon size={isMobile ? 20 : 24} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-google font-bold text-[var(--md-sys-color-on-surface)] truncate">Schedule</h1>
                <p className="text-xs md:text-sm text-[var(--md-sys-color-secondary)] hidden sm:block">Manage classes & timetable</p>
              </div>
              {/* Mobile-only Add button */}
              {isMobile && user?.role !== 'viewer' && (
                <button onClick={() => setShowAddModal(true)} aria-label="Add Class" className="p-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl shadow-md flex-shrink-0">
                  <Plus size={20} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
              <div className="flex items-center bg-[var(--md-sys-color-surface-variant)] p-0.5 md:p-1 rounded-lg md:rounded-xl">
                <button onClick={() => setView('day')} aria-label="Day View" className={clsx("px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all", view === 'day' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]")}>Day</button>
                {!isMobile && (
                  <button onClick={() => setView('week')} aria-label="Week View" className={clsx("px-3 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all", view === 'week' ? "bg-[var(--md-sys-color-surface)] shadow-sm text-[var(--md-sys-color-on-surface)]" : "text-[var(--md-sys-color-secondary)]")}>Week</button>
                )}
              </div>
              <div className="w-px h-6 md:h-8 bg-[var(--md-sys-color-outline-variant)]" />
              <button onClick={handlePrint} aria-label="Print Schedule" className="p-2 md:p-2.5 rounded-lg md:rounded-xl text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"><Printer size={isMobile ? 18 : 20} /></button>
              <button onClick={() => setShowSettings(!showSettings)} aria-label="Settings" className={clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", showSettings ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}><Settings size={isMobile ? 18 : 20} /></button>
              <button onClick={() => syncToGoogle()} aria-label="Sync to Google Calendar" disabled={isSyncing} className={clsx("p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors", isSyncing ? "text-blue-500 bg-blue-50" : "text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}><RefreshCw size={isMobile ? 18 : 20} className={clsx(isSyncing && "animate-spin")} /></button>
              {!isMobile && user?.role !== 'viewer' && (
                <>
                  <button onClick={() => setIsTemplateMode(!isTemplateMode)} className={clsx("px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2", isTemplateMode ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                    <Edit3 size={16} /> {isTemplateMode ? 'Done Editing' : 'Edit Template'}
                  </button>
                  <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <Plus size={18} /> Add Class
                  </button>
                </>
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
          <aside className="w-72 flex-shrink-0 flex-col gap-6 hidden md:flex">
            {/* Nav Card */}
            <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-4">
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
            <div className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-6 flex flex-col items-center text-center">
              <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider w-full text-left mb-6">This Week's Progress</h3>
              <div className="relative mb-6">
                <ProgressRing pct={weeklyStats.pct} size={110} stroke={8} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-google font-black text-[var(--md-sys-color-on-surface)]">{weeklyStats.completed}</span>
                  <span className="text-[10px] font-medium text-[var(--md-sys-color-secondary)] uppercase bg-[var(--md-sys-color-surface)] px-1 relative -top-1">of {weeklyStats.totalClasses}</span>
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
          <main className="flex-1 flex flex-col bg-[var(--md-sys-color-surface)] rounded-2xl md:rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm overflow-hidden relative">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                    {FULL_DAY_HOURS.map(t => (
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
                      >
                        {/* Soft Dashed Hour Lines */}
                        {FULL_DAY_HOURS.map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-full border-t border-[var(--md-sys-color-outline-variant)] border-dashed opacity-50"
                            style={{ top: i * hourHeight }}
                          />
                        ))}

                        {/* Red NOW Indicator */}
                        {isToday && (
                          <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none group" style={{ top: currentTimeTop }} aria-current="time">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5 shadow-sm ring-4 ring-[var(--md-sys-color-surface)] relative">
                              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60"></div>
                            </div>
                            <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                            <div className="absolute left-4 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        )}

                        {/* Slots */}
                        {slots.map(slot => {
                          const startHour = parseInt(slot.startTime.split(':')[0]);
                          const startMin = parseInt(slot.startTime.split(':')[1] || '0');
                          const top = (startHour * hourHeight) + ((startMin / 60) * hourHeight);
                          const height = (slot.durationMinutes / 60) * hourHeight;
                          const color = getSlotColor(slot);
                          const isOverride = !!slot.overrideDate;
                          const isCompleted = slot.status === 'Completed';

                          return (
                            <DraggableSlot
                              key={slot.id}
                              slot={slot}
                              hourHeight={hourHeight}
                              onSlotClick={() => { setSelectedSlot(slot); setIsEditingSlot(false); setSelectedDate(date); }}
                              disabled={user?.role === 'viewer'}
                              className={clsx(
                                "rounded-2xl border-l-[6px] p-2.5 cursor-pointer overflow-hidden backdrop-blur-md transition-all group flex flex-col justify-between absolute left-1 right-2",
                                color.bg, color.border,
                                isCompleted ? "opacity-60 saturate-50" : "shadow-sm shadow-black/5 dark:shadow-black/20",
                                isOverride && !isTemplateMode && "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900",
                                isTemplateMode && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900 border-dashed"
                              )}
                              style={{ top, height: height - 4 }}
                            >
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex justify-between items-start gap-1">
                                  <div className={clsx("font-bold text-sm leading-tight flex items-center gap-1.5 truncate", color.text)}>
                                    {slot.subject === 'Solar' ? <Zap size={14} fill="currentColor" /> : <Monitor size={14} />}
                                    <span>{slot.subject}</span>
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
                                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/60 dark:bg-black/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-[var(--md-sys-color-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100"
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
                                          "w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110",
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
            </DndContext>
          </main>
        </div>

        {/* SETTINGS, DETAILS, ADD MODALS GO HERE... (Kept concise for brevity, styling improved) */}

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
                      <div className="flex gap-2">
                        {['Solar', 'ICT'].map(s => (
                          <button key={s} aria-pressed={newSlot.subject === s} onClick={() => setNewSlot({ ...newSlot, subject: s as any })} className={clsx("flex-1 py-3 rounded-2xl font-bold text-sm border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlot.subject === s ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {s === 'Solar' ? '☀️ ' : '💻 '} {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Student Group</label>
                      <div className="flex gap-2 flex-wrap">
                        {STUDENT_GROUPS.map(g => (
                          <button key={g} aria-pressed={newSlotGroup === g} onClick={() => { setNewSlotGroup(g); setNewSlot({ ...newSlot, grade: getDefaultLevel(g), studentGroup: g }); }} className={clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all focus-visible:ring-2 focus-visible:ring-violet-500", newSlotGroup === g ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300 shadow-sm" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Level</label>
                      <div className="flex gap-2 flex-wrap">
                        {getLevelsForGroup(newSlotGroup).map(lvl => (
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
                          <div className="flex gap-2">
                            {['Solar', 'ICT'].map(s => (
                              <button key={s} aria-pressed={editSlotData.subject === s} onClick={() => setEditSlotData({ ...editSlotData, subject: s as any })} className={clsx("flex-1 py-2.5 rounded-xl font-bold text-sm border transition-all", editSlotData.subject === s ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                                {s === 'Solar' ? '☀️ ' : '💻 '} {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Student Group</label>
                          <div className="flex gap-2 flex-wrap">
                            {STUDENT_GROUPS.map(g => (
                              <button key={g} aria-pressed={editSlotData.studentGroup === g} onClick={() => setEditSlotData({ ...editSlotData, studentGroup: g, grade: getDefaultLevel(g) })} className={clsx("px-3 py-2 rounded-xl font-bold text-xs border transition-all", editSlotData.studentGroup === g ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Level</label>
                          <div className="flex gap-2 flex-wrap">
                            {getLevelsForGroup(editSlotData.studentGroup || 'Academy').map(lvl => (
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
                            {selectedSlot.subject === 'Solar' ? <Zap size={24} className="text-orange-500" /> : <Monitor size={24} className="text-blue-500" />}
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