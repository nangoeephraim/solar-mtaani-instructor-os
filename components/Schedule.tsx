import React, { useState, useMemo, useCallback } from 'react';
import { AppData, ScheduleSlot, Student, CurriculumUnit } from '../types';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Settings, Zap, Monitor,
  Sparkles, Edit3, CheckCircle2, XCircle, Users, Clock, Bell, Palette, LayoutGrid, List,
  Sun, Moon, Maximize2, Minimize2, Eye, EyeOff, Check, Copy, MoreVertical
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleProps {
  data: AppData;
  onUpdateSchedule: (scheduleId: string, status: ScheduleSlot['status']) => void;
  onUpdateStudent?: (student: Student, notify?: boolean) => void;
  onAddSlot?: (slot: Omit<ScheduleSlot, 'id'>) => void;
  onDeleteSlot?: (slotId: string) => void;
}

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

const Schedule: React.FC<ScheduleProps> = ({ data, onUpdateSchedule, onUpdateStudent, onAddSlot, onDeleteSlot }) => {
  // Core State
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'day' | 'week'>('week');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [isTemplateMode, setIsTemplateMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Customization State
  const [gridDensity, setGridDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [showCompletedClasses, setShowCompletedClasses] = useState(true);
  const [classColors, setClassColors] = useState<Record<string, number>>({});
  const [enableAnimations, setEnableAnimations] = useState(true);

  // New Slot State
  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 5, status: 'Pending'
  });

  const { showToast } = useToast();

  // --- Date Logic (Preserved) ---
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
      if (newDate.getDay() === 0) newDate.setDate(newDate.getDate() + direction);
      if (newDate.getDay() === 6) newDate.setDate(newDate.getDate() + direction);
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

  // --- Toggle Switch Component ---
  const ToggleSwitch = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button onClick={onChange} className="flex items-center gap-3 group">
      <div className={clsx(
        "w-12 h-7 rounded-full p-1 transition-all duration-300 ease-out",
        checked ? "bg-blue-600" : "bg-gray-300"
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
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden font-sans">

      {/* === HEADER === */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between flex-shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Timetable</h1>
              <p className="text-xs text-gray-500">{referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
            <button onClick={() => setView('day')} className={clsx("px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2", view === 'day' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <List size={16} /> Day
            </button>
            <button onClick={() => setView('week')} className={clsx("px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2", view === 'week' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <LayoutGrid size={16} /> Week
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => shiftDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={20} className="text-gray-600" /></button>
            <button onClick={jumpToToday} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">Today</button>
            <button onClick={() => shiftDate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={20} className="text-gray-600" /></button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* TEMPLATE MODE TOGGLE - Premium Style */}
          <div className={clsx(
            "flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-all",
            isTemplateMode
              ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 shadow-sm shadow-orange-100"
              : "bg-white border-gray-200 hover:border-gray-300"
          )}>
            <span className={clsx("text-sm font-semibold", isTemplateMode ? "text-orange-700" : "text-gray-500")}>
              {isTemplateMode ? '📐 Template Mode' : '📅 Schedule View'}
            </span>
            <ToggleSwitch
              checked={isTemplateMode}
              onChange={() => setIsTemplateMode(!isTemplateMode)}
              label=""
            />
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx("p-2.5 rounded-xl transition-all", showSettings ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100 text-gray-600")}
          >
            <Settings size={20} />
          </button>

          {/* Add Class */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add Class
          </button>
        </div>
      </header>

      {/* === MAIN LAYOUT === */}
      <div className="flex-1 flex overflow-hidden">

        {/* === SIDEBAR === */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">

          {/* Mini Calendar */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-gray-700">
                {referenceDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button onClick={() => { const d = new Date(referenceDate); d.setMonth(d.getMonth() - 1); setReferenceDate(d); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronLeft size={14} className="text-gray-500" /></button>
                <button onClick={() => { const d = new Date(referenceDate); d.setMonth(d.getMonth() + 1); setReferenceDate(d); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><ChevronRight size={14} className="text-gray-500" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="text-[10px] font-bold text-gray-400 py-1">{d}</span>)}
              {miniCalendarDays.map((day, i) => {
                if (!day) return <span key={i}></span>;
                const isSelected = getDateStr(day) === getDateStr(referenceDate);
                const isToday = getDateStr(day) === getDateStr(new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <button
                    key={i}
                    onClick={() => handleDateChange(day)}
                    className={clsx(
                      "w-8 h-8 rounded-full text-xs font-medium transition-all",
                      isSelected ? "bg-blue-600 text-white shadow-sm" : "",
                      isToday && !isSelected ? "bg-blue-100 text-blue-600 font-bold" : "",
                      !isSelected && !isToday && !isWeekend ? "hover:bg-gray-100 text-gray-700" : "",
                      isWeekend && !isSelected && !isToday ? "text-gray-400" : ""
                    )}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quick Filters */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Filters</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={showCompletedClasses} onChange={() => setShowCompletedClasses(!showCompletedClasses)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">Show completed classes</span>
              </label>
            </div>
          </div>

          {/* My Calendars */}
          <div className="p-4 flex-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">My Calendars</h3>
            <div className="space-y-2">
              {[
                { name: 'ICT Classes', color: 'bg-blue-500' },
                { name: 'Solar Classes', color: 'bg-orange-500' },
              ].map((cal, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className={clsx("w-3 h-3 rounded-sm", cal.color)}></div>
                  <span className="text-sm font-medium text-gray-700">{cal.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mascot */}
          <div className="p-4 text-center">
            <img
              src={isTemplateMode ? "/mascot-build.png" : "/mascot-chill.png"}
              alt="Mascot"
              className="w-28 h-28 mx-auto object-contain drop-shadow-lg mb-2 transition-all duration-500"
            />
            <p className="text-xs text-gray-500 font-medium">
              {isTemplateMode ? "Building your perfect schedule!" : "Ready for a productive day!"}
            </p>
          </div>
        </aside>

        {/* === TIME GRID === */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white border-l border-gray-100">
          {/* Day Headers */}
          <div className={clsx("grid border-b border-gray-200 flex-shrink-0 bg-gray-50", view === 'week' ? "grid-cols-[60px_repeat(5,1fr)]" : "grid-cols-[60px_1fr]")}>
            <div className="h-14 border-r border-gray-200"></div>
            {displayedDates.map(date => {
              const isToday = getDateStr(date) === getDateStr(new Date());
              return (
                <div key={date.toString()} className="h-14 flex flex-col items-center justify-center border-r border-gray-100">
                  <span className={clsx("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-blue-600" : "text-gray-400")}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div className={clsx(
                    "w-8 h-8 flex items-center justify-center rounded-full text-base font-semibold mt-0.5",
                    isToday ? "bg-blue-600 text-white" : "text-gray-700"
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
              <div className="border-r border-gray-200 bg-gray-50/50">
                {TIME_SLOTS.map(t => (
                  <div key={t} className={clsx("text-[11px] text-gray-400 text-right pr-3 pt-1 font-medium", gridDensity === 'compact' ? 'h-16' : 'h-20')}>
                    {t}
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {displayedDates.map((date, dateIdx) => {
                const slots = getVisibleSlots(date);
                const isToday = getDateStr(date) === getDateStr(new Date());
                return (
                  <div
                    key={dateIdx}
                    className={clsx("border-r border-gray-100 relative", isToday && "bg-blue-50/30")}
                    style={{ height: TIME_SLOTS.length * hourHeight }}
                  >
                    {/* Hour Lines */}
                    {TIME_SLOTS.map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-full border-t border-gray-100"
                        style={{ top: i * hourHeight }}
                      />
                    ))}

                    {/* Current Time Indicator */}
                    {isToday && currentTimeTop > 0 && (
                      <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none" style={{ top: currentTimeTop }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1"></div>
                        <div className="flex-1 h-0.5 bg-red-500"></div>
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
                        <motion.div
                          key={slot.id}
                          layoutId={enableAnimations ? slot.id : undefined}
                          initial={enableAnimations ? { opacity: 0, scale: 0.95 } : false}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={enableAnimations ? { scale: 1.02, zIndex: 10 } : undefined}
                          onClick={() => { setSelectedSlot(slot); setSelectedDate(date); }}
                          className={clsx(
                            "absolute inset-x-1 rounded-lg border-l-4 p-2.5 cursor-pointer overflow-hidden transition-shadow hover:shadow-lg group",
                            color.bg, color.border,
                            isCompleted && "opacity-60",
                            isCancelled && "opacity-40 line-through",
                            isOverride && !isTemplateMode && "ring-2 ring-blue-400 ring-offset-1",
                            isTemplateMode && "ring-2 ring-orange-300"
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
                            </div>
                            {(isOverride || isTemplateMode) && (
                              <div className="flex-shrink-0 ml-1">
                                {isOverride && !isTemplateMode && <Sparkles size={12} className="text-blue-500" />}
                                {isTemplateMode && <Edit3 size={12} className="text-orange-500" />}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Empty Cell Hint */}
                    {slots.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <div className="text-gray-300 text-xs font-medium">Click to add</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* === SETTINGS PANEL === */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">⚙️ Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-gray-200 rounded-lg"><XCircle size={18} className="text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Display</h4>
                <div className="space-y-3">
                  <ToggleSwitch checked={enableAnimations} onChange={() => setEnableAnimations(!enableAnimations)} label="Enable Animations" />
                  <ToggleSwitch checked={showCompletedClasses} onChange={() => setShowCompletedClasses(!showCompletedClasses)} label="Show Completed" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Grid Density</h4>
                <div className="flex gap-2">
                  <button onClick={() => setGridDensity('compact')} className={clsx("flex-1 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2", gridDensity === 'compact' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                    <Minimize2 size={14} /> Compact
                  </button>
                  <button onClick={() => setGridDensity('comfortable')} className={clsx("flex-1 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2", gridDensity === 'comfortable' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} onClick={() => setSelectedSlot(null)} className="fixed inset-0 bg-black z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Top Accent */}
              <div className={clsx("h-2", getSlotColor(selectedSlot).dot)} />

              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      {selectedSlot.subject === 'Solar' ? <Zap size={24} className="text-orange-500" fill="currentColor" /> : <Monitor size={24} className="text-blue-500" />}
                      {selectedSlot.subject} Class
                    </h2>
                    <p className="text-gray-500 mt-1">
                      Grade {selectedSlot.grade} • {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {selectedSlot.startTime}
                    </p>
                  </div>
                  <button onClick={() => setSelectedSlot(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle size={22} className="text-gray-400" /></button>
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
                    selectedSlot.status === 'Completed' ? "bg-green-100 text-green-700" :
                      selectedSlot.status === 'Cancelled' ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                  )}>
                    {selectedSlot.status}
                  </span>
                </div>

                {/* Quick Actions - Microsoft To-Do Style */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button
                    onClick={() => handleStatusChange('Completed')}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 text-green-700 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <CheckCircle2 size={22} />
                    <span className="font-bold">Complete</span>
                  </button>
                  <button
                    onClick={() => handleStatusChange('Cancelled')}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 text-red-600 hover:shadow-md hover:scale-[1.02] transition-all"
                  >
                    <XCircle size={22} />
                    <span className="font-bold">Cancel</span>
                  </button>
                </div>

                {/* Color Picker */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Color</h4>
                  <div className="flex gap-2">
                    {CLASS_COLORS.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => handleColorChange(selectedSlot.id, i)}
                        className={clsx(
                          "w-8 h-8 rounded-full transition-all",
                          c.dot,
                          classColors[selectedSlot.id] === i ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* More Options */}
                <div className="space-y-1 border-t border-gray-100 pt-4">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-gray-700 font-medium transition-colors">
                    <Users size={18} className="text-gray-400" /> View Attendance
                  </button>
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-xl flex items-center gap-3 text-gray-700 font-medium transition-colors">
                    <Copy size={18} className="text-gray-400" /> Duplicate Class
                  </button>
                  {onDeleteSlot && (
                    <button onClick={() => { onDeleteSlot(selectedSlot.id); setSelectedSlot(null); showToast('Class deleted', 'success'); }} className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-xl flex items-center gap-3 text-red-600 font-medium transition-colors">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-5">➕ Add New Class</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Subject</label>
                    <div className="flex gap-2">
                      {['Solar', 'ICT'].map(s => (
                        <button key={s} onClick={() => setNewSlot({ ...newSlot, subject: s as any })} className={clsx("flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all", newSlot.subject === s ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                          {s === 'Solar' ? '☀️' : '💻'} {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Grade</label>
                    <div className="flex gap-2 flex-wrap">
                      {[4, 5, 6, 7, 8].map(g => (
                        <button key={g} onClick={() => setNewSlot({ ...newSlot, grade: g })} className={clsx("w-12 h-10 rounded-lg font-bold text-sm border-2 transition-all", newSlot.grade === g ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Day</label>
                      <select value={newSlot.dayOfWeek} onChange={e => setNewSlot({ ...newSlot, dayOfWeek: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-0 outline-none">
                        {DAYS.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Time</label>
                      <select value={newSlot.startTime} onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:border-blue-400 focus:ring-0 outline-none">
                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Duration</label>
                    <div className="flex gap-2">
                      {[30, 60, 90, 120].map(d => (
                        <button key={d} onClick={() => setNewSlot({ ...newSlot, durationMinutes: d })} className={clsx("flex-1 py-2 rounded-lg font-semibold text-sm border-2 transition-all", newSlot.durationMinutes === d ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors">Cancel</button>
                  <button onClick={() => {
                    if (onAddSlot) onAddSlot(newSlot as any);
                    setShowAddModal(false);
                    showToast('Class added!', 'success');
                  }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                    Create Class
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Schedule;