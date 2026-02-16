import React, { useState, useMemo, useCallback } from 'react';
import { AppData, ScheduleSlot, Student } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Settings, Zap, Monitor,
  Sparkles, Edit3, CheckCircle2, XCircle, Users, Copy, LayoutGrid, List,
  Maximize2, Minimize2, Check, GripVertical, RefreshCw, AlertTriangle, Box,
  FileDown, Printer, Wand2
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragEndEvent,
  useSensors,
  useSensor,
  PointerSensor,
  DragStartEvent
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import PageHeader from './PageHeader';
import { useGoogleLogin } from '@react-oauth/google';
import { syncScheduleToGoogle } from '../services/calendarService';
import { useAuth } from '../contexts/AuthContext';

interface ScheduleProps {
  data: AppData;
  onUpdateSchedule: (scheduleId: string, status: ScheduleSlot['status']) => void;
  onUpdateStudent?: (student: Student, notify?: boolean) => void;
  onAddSlot?: (slot: Omit<ScheduleSlot, 'id'>) => void;
  onDeleteSlot?: (slotId: string) => void;
  onNavigate?: (view: string) => void;
}

import { DraggableSlot, DroppableDayColumn } from './ScheduleDnD';
import { detectConflicts, timeToMinutes, isHoliday, findBestSlot } from '../utils/scheduling';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const CLASS_COLORS = [
  { name: 'Coral', bg: 'bg-red-50', border: 'border-l-red-500', text: 'text-red-700', accent: '#ef4444', dot: 'bg-red-500' },
  { name: 'Mint', bg: 'bg-emerald-50', border: 'border-l-emerald-500', text: 'text-emerald-700', accent: '#10b981', dot: 'bg-emerald-500' },
  { name: 'Lavender', bg: 'bg-violet-50', border: 'border-l-violet-500', text: 'text-violet-700', accent: '#8b5cf6', dot: 'bg-violet-500' },
  { name: 'Sky', bg: 'bg-blue-50', border: 'border-l-blue-500', text: 'text-blue-700', accent: '#3b82f6', dot: 'bg-blue-500' },
  { name: 'Amber', bg: 'bg-orange-50', border: 'border-l-orange-500', text: 'text-orange-700', accent: '#f97316', dot: 'bg-orange-500' },
  { name: 'Rose', bg: 'bg-pink-50', border: 'border-l-pink-500', text: 'text-pink-700', accent: '#ec4899', dot: 'bg-pink-500' },
];

const Schedule: React.FC<ScheduleProps> = ({ data, onUpdateSchedule, onUpdateStudent, onAddSlot, onDeleteSlot, onNavigate }) => {
  // Core State
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useLocalStorage<'day' | 'week'>('schedule_view', 'week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user } = useAuth();

  const syncToGoogle = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        const { successCount, failCount, updatedSchedule } = await syncScheduleToGoogle(
          data.schedule,
          tokenResponse.access_token,
          weekDates
        );
        if (failCount === 0) {
          showToast(`✅ Synced ${successCount} classes to Google Calendar!`, 'success');
        } else {
          showToast(`Synced ${successCount}, ${failCount} failed. Check console.`, 'info');
        }
      } catch (error) {
        console.error('Google Calendar sync error:', error);
        showToast('Failed to sync with Google Calendar', 'error');
      } finally {
        setIsSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
    onError: (errorResponse) => {
      console.error('Google Login error:', errorResponse);
      showToast('Google Login Failed. Please try again.', 'error');
      setIsSyncing(false);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  // --- Duplicate Slot ---
  const handleDuplicateSlot = () => {
    if (!selectedSlot || !onAddSlot) return;
    const nextDay = (selectedSlot.dayOfWeek % 5) + 1; // Cycle Mon(1)->Fri(5)
    const duplicate: Omit<ScheduleSlot, 'id'> = {
      dayOfWeek: nextDay,
      startTime: selectedSlot.startTime,
      durationMinutes: selectedSlot.durationMinutes,
      grade: selectedSlot.grade,
      subject: selectedSlot.subject,
      status: 'Pending',
      resourceIds: selectedSlot.resourceIds,
    };
    onAddSlot(duplicate);
    setSelectedSlot(null);
    showToast(`Class duplicated to ${DAYS[nextDay - 1]}`, 'success');
  };

  // --- Student count per slot ---
  const getStudentCount = useCallback((slot: ScheduleSlot) => {
    return data.students.filter(s => s.grade === slot.grade && s.subject === slot.subject).length;
  }, [data.students]);

  // Customization State (Persisted)
  const [gridDensity, setGridDensity] = useLocalStorage<'compact' | 'comfortable'>('schedule_density', 'comfortable');
  const [showCompletedClasses, setShowCompletedClasses] = useLocalStorage<boolean>('schedule_show_completed', true);
  const [classColors, setClassColors] = useLocalStorage<Record<string, number>>('schedule_colors', {});
  const [enableAnimations, setEnableAnimations] = useLocalStorage<boolean>('schedule_animations', true);

  // New Slot State
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 5, status: 'Pending'
  });

  const { showToast } = useToast();

  // --- DnD Sensors ---
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleSuggestSlot = () => {
    // Find best slot for the pending new slot
    const bestTime = findBestSlot(newSlot.durationMinutes || 60, data.schedule);
    if (bestTime) {
      setNewSlot(prev => ({ ...prev, startTime: bestTime }));
      showToast(`Found best time: ${bestTime}`, 'success');
    } else {
      showToast('No clear slot found', 'error');
    }
  };

  // ... customization state ...

  // ... DnD Sensors ...

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (!over) return;

    const activeSlot = active.data.current?.slot as ScheduleSlot;
    const overId = over.id as string; // 'day-1'
    const targetDayIndex = parseInt(overId.split('-')[1]);

    if (!activeSlot) return;

    // Calculate new time
    const heightPerMinute = hourHeight / 60;
    const minutesDelta = Math.round(delta.y / heightPerMinute / 15) * 15; // Snap to 15m

    const [hours, mins] = activeSlot.startTime.split(':').map(Number);
    const currentMinutes = hours * 60 + mins;
    let newTotalMinutes = currentMinutes + minutesDelta;

    // Clamping (08:00 - 16:00 start times)
    const minTime = 8 * 60;
    const maxTime = 16 * 60; // Last class starts at 16:00
    newTotalMinutes = Math.max(minTime, Math.min(newTotalMinutes, maxTime));

    const newHours = Math.floor(newTotalMinutes / 60);
    const newMins = newTotalMinutes % 60;
    const newStartTime = `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;



    // If day changed or time changed
    if (activeSlot.dayOfWeek !== targetDayIndex || activeSlot.startTime !== newStartTime) {

      // --- Conflict Detection ---
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
        resourceIds: activeSlot.resourceIds // Check resources too
      }, existingSlotsOnTargetDay);

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(c => c.message).join('\n');
        const proceed = window.confirm(`Conflicts detected:\n${conflictMessages}\n\nProceed anyway?`);
        if (!proceed) return;
      }

      // Handle rescheduling logic
      if (!activeSlot.overrideDate && onAddSlot) {
        const override: Omit<ScheduleSlot, 'id'> = {
          ...activeSlot,
          overrideDate: dateStr,
          startTime: newStartTime,
          dayOfWeek: targetDayIndex,
          replacesSlotId: activeSlot.id,
          status: 'Pending'
        };
        onAddSlot(override);
        showToast(`Class moved to ${dateStr} at ${newStartTime}`, 'success');
      }
      else if (activeSlot.overrideDate && onAddSlot) {
        // ... existing override logic ...
        const override: Omit<ScheduleSlot, 'id'> = {
          ...activeSlot,
          overrideDate: dateStr,
          startTime: newStartTime,
          dayOfWeek: targetDayIndex,
          replacesSlotId: activeSlot.replacesSlotId,
          status: 'Pending'
        };
        onAddSlot(override);
        showToast(`Class rescheduled to ${newStartTime}`, 'success');
      }
    }
  };


  // --- Date Logic ---
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
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setReferenceDate(newDate);
  };

  // --- Data Helpers ---
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
    const activeRecurring = recurring.filter(r => !replacedIds.has(r.id));
    let result = [...activeRecurring, ...overrides];
    if (!showCompletedClasses) {
      result = result.filter(s => s.status !== 'Completed');
    }
    return result;
  };

  const getSlotColor = (slot: ScheduleSlot) => {
    const idx = classColors[slot.id] ?? (slot.subject === 'Solar' ? 4 : 3);
    return CLASS_COLORS[idx] || CLASS_COLORS[3];
  };

  // --- Actions ---
  const handleStatusChange = (status: ScheduleSlot['status']) => {
    if (!selectedSlot) return;
    if (isTemplateMode) {
      onUpdateSchedule(selectedSlot.id, status);
      setSelectedSlot({ ...selectedSlot, status });
      showToast(`Template updated`, 'success');
      return;
    }
    if (!selectedSlot.overrideDate && onAddSlot) {
      const targetDateStr = getSlotDateContext();
      const override: Omit<ScheduleSlot, 'id'> = {
        ...selectedSlot, status, overrideDate: targetDateStr, replacesSlotId: selectedSlot.id
      };
      onAddSlot(override);
      setSelectedSlot(null);
      showToast(`Override created for ${targetDateStr}`, 'success');
    } else {
      onUpdateSchedule(selectedSlot.id, status);
      setSelectedSlot({ ...selectedSlot, status });
      showToast('Status updated', 'success');
    }
  };

  const handleColorChange = (slotId: string, colorIdx: number) => {
    setClassColors(prev => ({ ...prev, [slotId]: colorIdx }));
  };

  // --- Current Time Indicator ---
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const hourHeight = gridDensity === 'compact' ? 64 : 80;
  const currentTimeTop = currentHour >= 8 && currentHour <= 16
    ? ((currentHour - 8) * hourHeight) + ((currentMinute / 60) * hourHeight)
    : -100;

  // --- Mini Calendar ---
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

  // --- Days with classes (for mini-cal dots) ---
  const daysWithClasses = useMemo(() => {
    const set = new Set<string>();
    data.schedule.forEach(s => {
      if (s.overrideDate) {
        set.add(s.overrideDate);
      } else {
        // For recurring, mark all dates in the displayed month
        miniCalendarDays.forEach(day => {
          if (day && day.getDay() === s.dayOfWeek) {
            set.add(getDateStr(day));
          }
        });
      }
    });
    return set;
  }, [data.schedule, miniCalendarDays]);

  // --- Weekly Summary Stats ---
  const weeklyStats = useMemo(() => {
    let totalClasses = 0, completed = 0, pending = 0, cancelled = 0;
    weekDates.forEach(date => {
      const slots = getVisibleSlots(date);
      totalClasses += slots.length;
      slots.forEach(s => {
        if (s.status === 'Completed') completed++;
        else if (s.status === 'Cancelled') cancelled++;
        else pending++;
      });
    });
    return { totalClasses, completed, pending, cancelled };
  }, [weekDates, data.schedule, showCompletedClasses, isTemplateMode]);

  // --- Toggle Switch Component ---
  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button onClick={onChange} className="flex items-center gap-3 group">
      <div className={clsx(
        "w-12 h-7 rounded-full p-1 transition-all duration-300 ease-out",
        checked ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline)]"
      )}>
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={clsx(
            "w-5 h-5 rounded-full bg-white shadow-md",
            checked ? "ml-auto" : "ml-0"
          )}
        />
      </div>
      <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)]">{label}</span>
    </button>
  );

  return (
    <PageTransition>
      <div className="h-full flex flex-col bg-gradient-to-br from-[var(--md-sys-color-surface)] to-[var(--md-sys-color-surface-variant)] overflow-hidden font-sans">

        {/* === HEADER AREA === */}
        <div className="flex-shrink-0 bg-[var(--md-sys-color-surface)] border-b border-[var(--md-sys-color-outline)] shadow-sm z-20 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>

          <div className="p-4 relative z-10">
            <PageHeader
              title="Class Schedule"
              subtitle="Manage your timetable and classes"
              icon={CalendarIcon}
              color="text-violet-600"
              action={
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="p-2.5 rounded-xl transition-all border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:text-blue-600 hover:shadow-sm"
                    title="Print / Export PDF"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={clsx(
                      "p-2.5 rounded-xl transition-all border border-transparent",
                      showSettings
                        ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]"
                        : "bg-[var(--md-sys-color-surface)] hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] border-[var(--md-sys-color-outline)]"
                    )}
                    title="Settings"
                  >
                    <Settings size={20} />
                  </button>
                  <button
                    onClick={() => syncToGoogle()}
                    disabled={isSyncing}
                    className={clsx(
                      "p-2.5 rounded-xl transition-all border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]",
                      isSyncing
                        ? "text-violet-500 bg-violet-50"
                        : "hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:text-violet-600 hover:shadow-sm"
                    )}
                    title="Sync to Google Calendar"
                  >
                    <RefreshCw size={20} className={clsx(isSyncing && "animate-spin")} />
                  </button>
                  {user?.role !== 'viewer' && (
                    <>
                      <button
                        onClick={() => setIsTemplateMode(!isTemplateMode)}
                        className={clsx(
                          "px-4 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 shadow-sm",
                          isTemplateMode
                            ? "bg-amber-100 text-amber-900 border-amber-200 shadow-amber-500/20"
                            : "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-variant)]"
                        )}
                      >
                        <Edit3 size={16} />
                        {isTemplateMode ? 'Done Editing' : 'Edit Template'}
                      </button>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-[1.02] transition-all flex items-center gap-2"
                      >
                        <Plus size={18} /> Add Class
                      </button>
                    </>
                  )}
                </div>
              }
            />

            {/* Controls Bar */}
            <div className="flex items-center justify-between mt-4">
              {/* View Switcher - Segmented Control */}
              <div className="flex bg-[var(--md-sys-color-surface-variant)]/50 p-1 rounded-xl border border-[var(--md-sys-color-outline)]/50">
                <button
                  onClick={() => setView('day')}
                  className={clsx(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    view === 'day'
                      ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm scale-100"
                      : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                  )}
                >
                  <List size={14} /> Day
                </button>
                <button
                  onClick={() => setView('week')}
                  className={clsx(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    view === 'week'
                      ? "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm scale-100"
                      : "text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]"
                  )}
                >
                  <LayoutGrid size={14} /> Week
                </button>
              </div>

              {/* Date Navigation */}
              <div className="flex items-center gap-2 bg-[var(--md-sys-color-surface)] px-2 py-1 rounded-xl border border-[var(--md-sys-color-outline)] shadow-sm">
                <button
                  onClick={() => shiftDate(-1)}
                  className="p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors text-[var(--md-sys-color-secondary)]"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)] min-w-[140px] text-center font-google">
                  {referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => shiftDate(1)}
                  className="p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors text-[var(--md-sys-color-secondary)]"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="w-px h-4 bg-[var(--md-sys-color-outline)] mx-1"></div>
                <button
                  onClick={jumpToToday}
                  className="px-3 py-1 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors uppercase tracking-wide"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === MAIN LAYOUT === */}
        <div className="flex-1 flex overflow-hidden">

          {/* === SIDEBAR === */}
          <aside className="w-72 flex-shrink-0 bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline)] flex flex-col overflow-y-auto hidden md:flex">

            {/* Mini Calendar */}
            <div className="p-4 border-b border-[var(--md-sys-color-outline)]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  {referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <button onClick={() => { const d = new Date(referenceDate); d.setMonth(d.getMonth() - 1); setReferenceDate(d); }} className="p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg" aria-label="Previous Month"><ChevronLeft size={14} className="text-[var(--md-sys-color-secondary)]" /></button>
                  <button onClick={() => { const d = new Date(referenceDate); d.setMonth(d.getMonth() + 1); setReferenceDate(d); }} className="p-1.5 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg" aria-label="Next Month"><ChevronRight size={14} className="text-[var(--md-sys-color-secondary)]" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] py-1">{d}</span>)}
                {miniCalendarDays.map((day, i) => {
                  if (!day) return <span key={i}></span>;
                  const isSelected = getDateStr(day) === getDateStr(referenceDate);
                  const hasClasses = daysWithClasses.has(getDateStr(day));
                  const isToday = getDateStr(day) === getDateStr(new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  return (
                    <button
                      key={i}
                      onClick={() => handleDateChange(day)}
                      className={clsx(
                        "w-8 h-8 rounded-full text-xs font-medium transition-all relative",
                        isSelected ? "bg-violet-600 text-white shadow-md shadow-violet-500/30" : "",
                        isToday && !isSelected ? "bg-violet-100 text-violet-700 font-bold" : "",
                        !isSelected && !isToday && !isWeekend ? "hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)]" : "",
                        isWeekend && !isSelected && !isToday ? "text-[var(--md-sys-color-secondary)]" : ""
                      )}
                    >
                      {day.getDate()}
                      {hasClasses && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="p-4 border-b border-[var(--md-sys-color-outline)]">
              <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-3">Filters</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={showCompletedClasses} onChange={() => setShowCompletedClasses(!showCompletedClasses)} className="w-4 h-4 rounded border-[var(--md-sys-color-outline)] text-violet-600 focus:ring-violet-500" />
                  <span className="text-sm text-[var(--md-sys-color-on-surface)] group-hover:text-violet-600 transition-colors">Show completed classes</span>
                </label>
              </div>
            </div>

            {/* My Calendars */}
            <div className="p-4 border-b border-[var(--md-sys-color-outline)]">
              <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-3">My Calendars</h3>
              <div className="space-y-2">
                {[
                  { name: 'ICT Classes', color: 'bg-blue-500' },
                  { name: 'Solar Classes', color: 'bg-orange-500' },
                ].map((cal, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] cursor-pointer transition-colors">
                    <div className={clsx("w-3 h-3 rounded-sm", cal.color)}></div>
                    <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{cal.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Summary Stats */}
            <div className="p-4 border-b border-[var(--md-sys-color-outline)]">
              <h3 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-3">This Week</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--md-sys-color-on-surface)] font-medium">Total Classes</span>
                  <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">{weeklyStats.totalClasses}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle2 size={12} /> Completed</span>
                  <span className="text-sm font-bold text-green-600">{weeklyStats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-amber-600 font-medium flex items-center gap-1.5"><CalendarIcon size={12} /> Pending</span>
                  <span className="text-sm font-bold text-amber-600">{weeklyStats.pending}</span>
                </div>
                {weeklyStats.cancelled > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-red-500 font-medium flex items-center gap-1.5"><XCircle size={12} /> Cancelled</span>
                    <span className="text-sm font-bold text-red-500">{weeklyStats.cancelled}</span>
                  </div>
                )}
                {/* Progress bar */}
                {weeklyStats.totalClasses > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-2 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${(weeklyStats.completed / weeklyStats.totalClasses) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-1 text-right">
                      {Math.round((weeklyStats.completed / weeklyStats.totalClasses) * 100)}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mascot */}
            <div className="p-4 text-center flex-1 flex flex-col justify-end">
              <img
                src={isTemplateMode ? "/mascot-build.png" : "/mascot-chill.png"}
                alt="Mascot"
                className="w-24 h-24 mx-auto object-contain drop-shadow-lg mb-2 transition-all duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <p className="text-xs text-[var(--md-sys-color-secondary)] font-medium">
                {isTemplateMode ? "Building your perfect schedule!" : "Ready for a productive day!"}
              </p>
            </div>
          </aside>

          {/* === TIME GRID === */}
          <main className="flex-1 flex flex-col overflow-hidden bg-[var(--md-sys-color-surface)] border-l border-[var(--md-sys-color-outline)] relative">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              {/* Day Headers */}
              <div className={clsx("grid border-b border-[var(--md-sys-color-outline)] flex-shrink-0 bg-[var(--md-sys-color-surface-variant)]", view === 'week' ? "grid-cols-[60px_repeat(5,1fr)]" : "grid-cols-[60px_1fr]")}>
                <div className="h-14 border-r border-[var(--md-sys-color-outline)]"></div>
                {displayedDates.map(date => {
                  const isToday = getDateStr(date) === getDateStr(new Date());
                  return (
                    <div key={date.toString()} className="h-14 flex flex-col items-center justify-center border-r border-[var(--md-sys-color-outline)]">
                      <span className={clsx("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-violet-600" : "text-[var(--md-sys-color-secondary)]")}>
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <div className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-full text-base font-semibold mt-0.5",
                        isToday ? "bg-violet-600 text-white shadow-md shadow-violet-500/30" : "text-[var(--md-sys-color-on-surface)]"
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Scrollable Grid */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className={clsx("grid min-h-full", view === 'week' ? "grid-cols-[60px_repeat(5,1fr)]" : "grid-cols-[60px_1fr]")}>

                  {/* Time Axis */}
                  <div className="border-r border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/50">
                    {TIME_SLOTS.map(t => (
                      <div key={t} className={clsx("text-[11px] text-[var(--md-sys-color-secondary)] text-right pr-3 pt-1 font-medium", gridDensity === 'compact' ? 'h-16' : 'h-20')}>
                        {t}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  {displayedDates.map((date, dateIdx) => {
                    const slots = getVisibleSlots(date);
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
                        {/* Hour Lines */}
                        {TIME_SLOTS.map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-full border-t border-gray-100 dark:border-gray-800"
                            style={{ top: i * hourHeight }}
                          />
                        ))}

                        {/* Current Time Indicator - Enhanced */}
                        {isToday && currentTimeTop > 0 && (
                          <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none group" style={{ top: currentTimeTop }}>
                            <div className="w-3 h-3 rounded-full bg-rose-500 -ml-1.5 shadow-sm ring-2 ring-white dark:ring-slate-900 relative">
                              <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75"></div>
                            </div>
                            <div className="flex-1 h-[2px] bg-gradient-to-r from-rose-500 to-transparent opacity-80"></div>
                            <div className="absolute right-0 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-l-md font-bold shadow-sm translate-x-full group-hover:translate-x-0 transition-transform">
                              NOW
                            </div>
                          </div>
                        )}

                        {/* Slots */}
                        {slots.map(slot => {
                          const startHour = parseInt(slot.startTime.split(':')[0]);
                          const startMin = parseInt(slot.startTime.split(':')[1] || '0');
                          const top = ((startHour - 8) * hourHeight) + ((startMin / 60) * hourHeight);
                          const height = (slot.durationMinutes / 60) * hourHeight;
                          const color = getSlotColor(slot);
                          const isOverride = !!slot.overrideDate;
                          const isCompleted = slot.status === 'Completed';
                          const isCancelled = slot.status === 'Cancelled';

                          return (
                            <DraggableSlot
                              key={slot.id}
                              slot={slot}
                              hourHeight={hourHeight}
                              onSlotClick={() => { setSelectedSlot(slot); setSelectedDate(date); }}
                              disabled={user?.role === 'viewer'}
                              className={clsx(
                                "rounded-xl border-l-4 px-3 py-2 cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg hover:z-10 group backdrop-blur-[2px]",
                                color.bg, color.border,
                                isCompleted && "opacity-60 grayscale-[30%]",
                                isCancelled && "opacity-40 line-through grayscale",
                                isOverride && !isTemplateMode && "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900",
                                isTemplateMode && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900 dashed-border"
                              )}
                              style={{ top, height: height - 4 }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className={clsx("font-bold text-sm flex items-center gap-1.5 truncate", color.text)}>
                                    {slot.subject === 'Solar' ? <Zap size={12} fill="currentColor" /> : <Monitor size={12} />}
                                    <span>{slot.subject}</span>
                                    {isCompleted && <Check size={12} className="text-green-600" />}
                                  </div>
                                  <div className={clsx("text-xs mt-0.5", color.text, "opacity-75")}>
                                    Grade {slot.grade} • {slot.startTime}
                                  </div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Users size={10} className={clsx(color.text, "opacity-60")} />
                                    <span className={clsx("text-[10px] font-medium", color.text, "opacity-60")}>
                                      {getStudentCount(slot)} student{getStudentCount(slot) !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  {/* Resource Indicators */}
                                  {slot.resourceIds && slot.resourceIds.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                                      {slot.resourceIds.slice(0, 2).map(resId => {
                                        const resource = data.resources?.find(r => r.id === resId);
                                        if (!resource) return null;
                                        const isMaintenance = resource.status === 'maintenance';
                                        return (
                                          <span
                                            key={resId}
                                            className={clsx(
                                              "text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5",
                                              isMaintenance
                                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                                                : "bg-white/50 text-gray-600 dark:bg-black/20 dark:text-gray-300"
                                            )}
                                            title={isMaintenance ? `${resource.name} is under maintenance` : resource.name}
                                          >
                                            {resource.type === 'room' ? <LayoutGrid size={8} /> : <Box size={8} />}
                                            {resource.name.substring(0, 8)}
                                            {isMaintenance && <AlertTriangle size={8} className="text-orange-500" />}
                                          </span>
                                        );
                                      })}
                                      {slot.resourceIds.length > 2 && (
                                        <span className="text-[9px] text-gray-500">+{slot.resourceIds.length - 2}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {(isOverride || isTemplateMode) && (
                                  <div className="flex-shrink-0 ml-1">
                                    {isOverride && !isTemplateMode && <Sparkles size={12} className="text-blue-500" />}
                                    {isTemplateMode && <Edit3 size={12} className="text-orange-500" />}
                                  </div>
                                )}
                              </div>
                            </DraggableSlot>
                          );
                        })}

                        {/* Empty Cell Hint */}
                        {slots.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="text-gray-300 text-xs font-medium">Drop class here</div>
                          </div>
                        )}
                      </DroppableDayColumn>
                    );
                  })}
                </div>
              </div>
            </DndContext>
          </main>
        </div>

        {/* === SETTINGS PANEL === */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-16 right-4 w-80 bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl border border-[var(--md-sys-color-outline)] z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--md-sys-color-outline)] flex justify-between items-center bg-[var(--md-sys-color-surface-variant)]">
                <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">⚙️ Settings</h3>
                <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-[var(--md-sys-color-surface)] rounded-lg" aria-label="Close Settings"><XCircle size={18} className="text-[var(--md-sys-color-secondary)]" /></button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-3">Display</h4>
                  <div className="space-y-3">
                    <ToggleSwitch checked={enableAnimations} onChange={() => setEnableAnimations(!enableAnimations)} label="Enable Animations" />
                    <ToggleSwitch checked={showCompletedClasses} onChange={() => setShowCompletedClasses(!showCompletedClasses)} label="Show Completed" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-3">Grid Density</h4>
                  <div className="flex gap-2">
                    <button onClick={() => setGridDensity('compact')} className={clsx("flex-1 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2", gridDensity === 'compact' ? "bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]" : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                      <Minimize2 size={14} /> Compact
                    </button>
                    <button onClick={() => setGridDensity('comfortable')} className={clsx("flex-1 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2", gridDensity === 'comfortable' ? "bg-[var(--md-sys-color-primary-container)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]" : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                      <Maximize2 size={14} /> Comfortable
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === SLOT DETAIL MODAL === */}
        <AnimatePresence>
          {selectedSlot && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSlot(null)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Top Accent */}
                <div className={clsx("h-2", getSlotColor(selectedSlot).dot)} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                        {selectedSlot.subject === 'Solar' ? <Zap size={24} className="text-orange-500" fill="currentColor" /> : <Monitor size={24} className="text-blue-500" />}
                        {selectedSlot.subject} Class
                      </h2>
                      <p className="text-[var(--md-sys-color-secondary)] mt-1">
                        Grade {selectedSlot.grade} • {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {selectedSlot.startTime}
                      </p>
                    </div>
                    <button onClick={() => setSelectedSlot(null)} className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-colors" aria-label="Close Details"><XCircle size={22} className="text-[var(--md-sys-color-secondary)]" /></button>
                  </div>

                  {/* Mode Badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {isTemplateMode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                        <Edit3 size={12} /> Editing Template
                      </span>
                    )}
                    {selectedSlot.overrideDate && !isTemplateMode && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                        <Sparkles size={12} /> Override for this date
                      </span>
                    )}
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
                      selectedSlot.status === 'Completed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        selectedSlot.status === 'Cancelled' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)]"
                    )}>
                      {selectedSlot.status}
                    </span>
                  </div>

                  {/* Quick Actions - Microsoft To-Do Style */}
                  {user?.role !== 'viewer' && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <button
                        onClick={() => handleStatusChange('Completed')}
                        className={clsx(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border hover:shadow-md hover:scale-[1.02] transition-all",
                          selectedSlot.status === 'Completed'
                            ? "bg-green-100 border-green-300 text-green-800 ring-2 ring-green-400"
                            : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-700"
                        )}
                      >
                        <CheckCircle2 size={20} />
                        <span className="font-bold text-sm">Complete</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange('Pending')}
                        className={clsx(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border hover:shadow-md hover:scale-[1.02] transition-all",
                          selectedSlot.status === 'Pending'
                            ? "bg-amber-100 border-amber-300 text-amber-800 ring-2 ring-amber-400"
                            : "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 text-amber-700"
                        )}
                      >
                        <RefreshCw size={20} />
                        <span className="font-bold text-sm">Pending</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange('Cancelled')}
                        className={clsx(
                          "flex items-center justify-center gap-2 p-3 rounded-xl border hover:shadow-md hover:scale-[1.02] transition-all",
                          selectedSlot.status === 'Cancelled'
                            ? "bg-red-100 border-red-300 text-red-800 ring-2 ring-red-400"
                            : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-600"
                        )}
                      >
                        <XCircle size={20} />
                        <span className="font-bold text-sm">Cancel</span>
                      </button>
                    </div>
                  )}

                  {/* Color Picker */}
                  {user?.role !== 'viewer' && (
                    <div className="mb-5">
                      <h4 className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-2">Color</h4>
                      <div className="flex gap-2">
                        {CLASS_COLORS.map((c, i) => (
                          <button
                            key={i}
                            title={`Color ${i + 1}`}
                            onClick={() => handleColorChange(selectedSlot.id, i)}
                            className={clsx(
                              "w-8 h-8 rounded-full transition-all",
                              c.dot,
                              classColors[selectedSlot.id] === i ? "ring-2 ring-offset-2 ring-[var(--md-sys-color-outline)] scale-110" : "hover:scale-110"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* More Options */}
                  <div className="space-y-1 border-t border-[var(--md-sys-color-outline)] pt-4">
                    {/* Student count info */}
                    <div className="px-4 py-2 text-xs text-[var(--md-sys-color-secondary)] flex items-center gap-2">
                      <Users size={14} />
                      <span>{getStudentCount(selectedSlot)} student{getStudentCount(selectedSlot) !== 1 ? 's' : ''} enrolled</span>
                    </div>
                    <button
                      onClick={() => { setSelectedSlot(null); onNavigate?.('attendance'); }}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl flex items-center gap-3 text-[var(--md-sys-color-on-surface)] font-medium transition-colors"
                    >
                      <Users size={18} className="text-[var(--md-sys-color-secondary)]" /> View Attendance
                    </button>
                    {user?.role !== 'viewer' && (
                      <button
                        onClick={handleDuplicateSlot}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl flex items-center gap-3 text-[var(--md-sys-color-on-surface)] font-medium transition-colors"
                      >
                        <Copy size={18} className="text-[var(--md-sys-color-secondary)]" /> Duplicate Class
                      </button>
                    )}
                    {onDeleteSlot && user?.role === 'admin' && (
                      <button onClick={() => { onDeleteSlot(selectedSlot.id); setSelectedSlot(null); showToast('Class deleted', 'success'); }} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 text-red-600 font-medium transition-colors">
                        <Trash2 size={18} /> Delete Class
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* === ADD CLASS MODAL === */}
        <AnimatePresence>
          {showAddModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl z-50 overflow-hidden"
              >
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] mb-5">➕ Add New Class</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Subject</label>
                      <div className="flex gap-2">
                        {['Solar', 'ICT'].map(s => (
                          <button key={s} onClick={() => setNewSlot({ ...newSlot, subject: s as any })} className={clsx("flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all", newSlot.subject === s ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400" : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] hover:border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {s === 'Solar' ? '☀️' : '💻'} {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Grade</label>
                      <div className="flex gap-2 flex-wrap">
                        {[4, 5, 6, 7, 8].map(g => (
                          <button key={g} onClick={() => setNewSlot({ ...newSlot, grade: g })} className={clsx("w-12 h-10 rounded-lg font-bold text-sm border-2 transition-all", newSlot.grade === g ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400" : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] hover:border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Day</label>
                        <select aria-label="Select Day" value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-0 outline-none">
                          {DAYS.map((d, i) => <option key={i} value={i + 1} className="bg-[var(--md-sys-color-surface)]">{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase">Time</label>
                          <button onClick={handleSuggestSlot} className="text-[10px] flex items-center gap-1 text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md font-bold hover:bg-violet-100 transition-colors">
                            <Wand2 size={10} /> Suggest
                          </button>
                        </div>
                        <select aria-label="Select Time" value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} className="w-full px-3 py-2.5 border-2 border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-0 outline-none">
                          {TIME_SLOTS.map(t => <option key={t} value={t} className="bg-[var(--md-sys-color-surface)]">{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Duration</label>
                      <div className="flex gap-2">
                        {[30, 60, 90, 120].map(d => (
                          <button key={d} onClick={() => setNewSlot({ ...newSlot, durationMinutes: d })} className={clsx("flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all", newSlot.durationMinutes === d ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-400" : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] hover:border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]")}>
                            {d}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase mb-1.5">Resources</label>
                      <div className="flex flex-wrap gap-2">
                        {(!data.resources || data.resources.length === 0) ? (
                          <p className="text-xs text-gray-400 italic">No resources available. Add them in the Resources tab.</p>
                        ) : (
                          data.resources.map(resource => {
                            const isSelected = newSlot.resourceIds?.includes(resource.id);
                            return (
                              <button
                                key={resource.id}
                                onClick={() => {
                                  const current = newSlot.resourceIds || [];
                                  const updated = isSelected
                                    ? current.filter(id => id !== resource.id)
                                    : [...current, resource.id];
                                  setNewSlot({ ...newSlot, resourceIds: updated });
                                }}
                                className={clsx(
                                  "px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5",
                                  isSelected
                                    ? "bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400"
                                    : "border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                )}
                              >
                                {resource.type === 'room' ? <LayoutGrid size={12} /> : resource.type === 'equipment' ? <Monitor size={12} /> : <Box size={12} />}
                                {resource.name}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-surface-variant)] rounded-xl font-semibold transition-colors">Cancel</button>
                    <button onClick={() => {
                      if (onAddSlot) onAddSlot(newSlot as any);
                      setShowAddModal(false);
                      showToast('Class added!', 'success');
                    }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                      Create Class
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div >
    </PageTransition >
  );
};

export default Schedule;