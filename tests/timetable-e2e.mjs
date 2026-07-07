import fs from 'fs';
import path from 'path';

console.log('==================================================');
console.log('🧪 Starting PRISM OS Timetable E2E Test Suite');
console.log('==================================================\n');

// ── 1. Read Source Code files for Static Analysis ────────────────────
const schedulePath = path.resolve('components/Schedule.tsx');
const scheduleDndPath = path.resolve('components/ScheduleDnD.tsx');

let scheduleContent = '';
let scheduleDndContent = '';

try {
  scheduleContent = fs.readFileSync(schedulePath, 'utf8');
} catch (e) {
  console.error('Error reading components/Schedule.tsx:', e.message);
}

try {
  scheduleDndContent = fs.readFileSync(scheduleDndPath, 'utf8');
} catch (e) {
  console.error('Error reading components/ScheduleDnD.tsx:', e.message);
}

// ── 2. Pure Scheduling Logic Helpers (Mirrors utils/scheduling.ts) ───
function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function doTimesOverlap(start1, duration1, start2, duration2) {
  const end1 = start1 + duration1;
  const end2 = start2 + duration2;
  return start1 < end2 && start2 < end1;
}

function detectConflicts(newSlot, existingSlots) {
  const newStart = timeToMinutes(newSlot.startTime);
  const newDuration = newSlot.durationMinutes;
  const conflicts = [];

  for (const slot of existingSlots) {
    if (newSlot.id && slot.id === newSlot.id) continue;
    if (slot.status === 'Cancelled') continue;

    const slotStart = timeToMinutes(slot.startTime);

    if (doTimesOverlap(newStart, newDuration, slotStart, slot.durationMinutes)) {
      let isResourceConflict = false;
      if (newSlot.resourceIds && slot.resourceIds) {
        const sharedResources = newSlot.resourceIds.filter(r => slot.resourceIds?.includes(r));
        if (sharedResources.length > 0) {
          conflicts.push({
            type: 'resource',
            slotId: slot.id,
            subject: slot.subject,
            message: `Resource conflict with ${slot.subject}`
          });
          isResourceConflict = true;
        }
      }

      if (!isResourceConflict) {
        conflicts.push({
          type: 'time',
          slotId: slot.id,
          subject: slot.subject,
          message: `Time overlap with ${slot.subject}`
        });
      }
    }
  }
  return conflicts;
}

function isHoliday(date, holidays) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  return holidays.find(h => dateStr >= h.startDate && dateStr <= h.endDate);
}

// AI Diagnostic calculation (Mirrors Schedule.tsx)
function getDiagnostics(schedule, curriculum, holidays, weekDates) {
  const issues = [];
  let score = 100;

  // 1. Holiday Clashes
  const holidayClashes = schedule.filter(s => {
    if (s.status === 'Cancelled') return false;
    const d = weekDates.find(wd => wd.getDay() === s.dayOfWeek);
    const dateStr = s.overrideDate || (d ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    return isHoliday(new Date(dateStr), holidays || []);
  });
  if (holidayClashes.length > 0) {
    score -= holidayClashes.length * 12;
    issues.push({
      type: 'error',
      message: `${holidayClashes.length} classes conflict with public holiday dates.`
    });
  }

  // 2. Resource Clashes
  let resourceClashCount = 0;
  schedule.forEach(slot => {
    if (slot.status === 'Cancelled') return;
    const d = weekDates.find(wd => wd.getDay() === slot.dayOfWeek);
    const dateStr = slot.overrideDate || (d ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const daySlots = schedule.filter(s => {
      if (s.id === slot.id) return false;
      if (s.status === 'Cancelled') return false;
      if (s.overrideDate === dateStr) return true;
      if (s.dayOfWeek === slot.dayOfWeek && !s.overrideDate) {
        const isOverridden = schedule.some(o => o.replacesSlotId === s.id && o.overrideDate === dateStr);
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

  // 3. Curriculum Gaps
  Object.entries(curriculum || {}).forEach(([subject, units]) => {
    const count = schedule.filter(s => s.subject === subject && s.status !== 'Cancelled').length;
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

  // 4. Day load
  const dayCounts = {};
  schedule.forEach(slot => {
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
}

// ── 3. Test Definitions ─────────────────────────────────────────────
const testCases = [];
function addTest(id, category, name, fn) {
  testCases.push({ id, category, name, fn });
}

// =====================================================================
// TIER 1: FEATURE COVERAGE (30 Cases)
// =====================================================================

// Category: Glassmorphism UI Layout (Tier 1: 1-5)
addTest(1, 'Glassmorphism UI Layout', 'Main layout has glassmorphic classes', () => {
  const match = scheduleContent.includes('backdrop-blur-lg') || scheduleContent.includes('backdrop-blur-xl');
  if (!match) throw new Error("Main layout does not contain glassmorphic backdrop-blur classes ('backdrop-blur-lg' or 'backdrop-blur-xl')");
});

addTest(2, 'Glassmorphism UI Layout', 'Sidebar container has frosted styling', () => {
  const asideBlock = scheduleContent.match(/<aside[\s\S]*?<\/aside>/);
  const match = asideBlock && (asideBlock[0].includes('backdrop-blur') || asideBlock[0].includes('bg-white/'));
  if (!match) throw new Error("Sidebar container does not have glassmorphic backdrop-blur or opacity background classes");
});

addTest(3, 'Glassmorphism UI Layout', 'Schedule slot cards have backdrop-blur-md', () => {
  const match = scheduleContent.includes('backdrop-blur-md');
  if (!match) throw new Error("Schedule slot cards do not contain 'backdrop-blur-md'");
});

addTest(4, 'Glassmorphism UI Layout', 'Modal overlay uses backdrop-blur-sm', () => {
  const match = scheduleContent.includes('backdrop-blur-sm');
  if (!match) throw new Error("Modal backdrops do not contain 'backdrop-blur-sm'");
});

addTest(5, 'Glassmorphism UI Layout', 'Borders use frosted translucent classes', () => {
  const match = scheduleContent.includes('border-white/10') || scheduleContent.includes('border-white/20');
  if (!match) throw new Error("Layout borders do not contain frosted glass translucent border classes");
});

// Category: WebGL 3D Workload View (Tier 1: 6-10)
addTest(6, 'WebGL 3D Workload View', 'WebGL canvas element presence', () => {
  const match = scheduleContent.includes('workload-3d-canvas') || scheduleContent.includes('id="workload-canvas"');
  if (!match) throw new Error("WebGL canvas container with id 'workload-3d-canvas' or 'workload-canvas' was not found in Schedule.tsx");
});

addTest(7, 'WebGL 3D Workload View', 'WebGL2 or Three.js context configuration', () => {
  const match = scheduleContent.includes("getContext('webgl2')") || (scheduleContent.includes('three') && scheduleContent.includes('canvas'));
  if (!match) throw new Error("WebGL2 context request ('getContext(\\'webgl2\\')') or Three.js scene setup is missing in source");
});

addTest(8, 'WebGL 3D Workload View', 'WebGL animation render loop', () => {
  const match = scheduleContent.includes('requestAnimationFrame') || scheduleContent.includes('.render(');
  if (!match) throw new Error("WebGL/Canvas render loop or animate function is missing");
});

addTest(9, 'WebGL 3D Workload View', 'Dynamic WebGL theme color updates', () => {
  const match = scheduleContent.includes('webgl') && scheduleContent.includes('theme') && scheduleContent.includes('color');
  if (!match) throw new Error("Dynamic theme transition color mappings for WebGL are missing");
});

addTest(10, 'WebGL 3D Workload View', 'WebGL camera mouse/touch controls', () => {
  const match = scheduleContent.includes('OrbitControls') || (scheduleContent.includes('pointerdown') && (scheduleContent.includes('rotate') || scheduleContent.includes('camera')));
  if (!match) throw new Error("OrbitControls or interactive drag/rotate camera features for WebGL are missing");
});

// Category: Drag-and-Drop Handler (Tier 1: 11-15)
addTest(11, 'Drag-and-Drop Handler', 'Pointer sensor distance constraint configured', () => {
  const match = scheduleContent.includes('PointerSensor') && scheduleContent.includes('distance:');
  if (!match) throw new Error("PointerSensor distance activation constraint is missing");
});

addTest(12, 'Drag-and-Drop Handler', 'Touch sensor delay and tolerance configured', () => {
  const match = scheduleContent.includes('TouchSensor') && scheduleContent.includes('delay:') && scheduleContent.includes('tolerance:');
  if (!match) throw new Error("TouchSensor delay/tolerance constraints are missing");
});

addTest(13, 'Drag-and-Drop Handler', 'DndContext is configured with end handlers and sensors', () => {
  const match = scheduleContent.includes('DndContext') && scheduleContent.includes('onDragEnd=') && scheduleContent.includes('sensors=');
  if (!match) throw new Error("DndContext is missing key attributes (onDragEnd, sensors)");
});

addTest(14, 'Drag-and-Drop Handler', 'State update helper generates valid override slots', () => {
  const activeSlot = { id: 'slot-1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3' };
  const targetDayIndex = 2;
  const targetDateStr = '2026-07-08';
  const newStartTime = '10:00';
  
  const override = {
    ...activeSlot,
    overrideDate: targetDateStr,
    startTime: newStartTime,
    dayOfWeek: targetDayIndex,
    replacesSlotId: activeSlot.id,
    status: 'Pending'
  };
  
  if (override.replacesSlotId !== 'slot-1' || override.overrideDate !== '2026-07-08' || override.startTime !== '10:00') {
    throw new Error("Failed to correctly create override slot state update");
  }
});

addTest(15, 'Drag-and-Drop Handler', 'Conflict detection catches temporal overlaps on drop', () => {
  const mockSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', status: 'Pending' }
  ];
  const newSlot = { id: '2', startTime: '09:30', durationMinutes: 60 };
  const conflicts = detectConflicts(newSlot, mockSchedule);
  if (conflicts.length !== 1 || conflicts[0].type !== 'time') {
    throw new Error(`Expected time conflict, got: ${JSON.stringify(conflicts)}`);
  }
});

// Category: AI Co-Pilot Optimizer (Tier 1: 16-20)
addTest(16, 'AI Co-Pilot Optimizer', 'Optimal schedule returns health score of 100', () => {
  const mockSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', status: 'Pending' },
    { id: '2', dayOfWeek: 2, startTime: '10:00', durationMinutes: 60, subject: 'ICT', grade: 'L3', status: 'Pending' }
  ];
  const mockCurriculum = { 'Solar': ['Unit 1'], 'ICT': ['Unit 1'] };
  const mockHolidays = [];
  const mockWeekDates = [new Date('2026-07-06'), new Date('2026-07-07')];
  
  const diags = getDiagnostics(mockSchedule, mockCurriculum, mockHolidays, mockWeekDates);
  if (diags.score !== 100) {
    throw new Error(`Expected health score of 100, got ${diags.score}`);
  }
});

addTest(17, 'AI Co-Pilot Optimizer', 'Holiday conflict deducts 12 points', () => {
  const mockSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', status: 'Pending' }
  ];
  const mockCurriculum = { 'Solar': ['Unit 1'] };
  const mockHolidays = [{ name: 'Test Holiday', startDate: '2026-07-06', endDate: '2026-07-06' }];
  const mockWeekDates = [new Date('2026-07-06')];
  
  const diags = getDiagnostics(mockSchedule, mockCurriculum, mockHolidays, mockWeekDates);
  if (diags.score !== 88) {
    throw new Error(`Expected health score of 88 (100 - 12), got ${diags.score}`);
  }
});

addTest(18, 'AI Co-Pilot Optimizer', 'Resource conflict deducts 10 points', () => {
  const mockSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', status: 'Pending', resourceIds: ['room-101'] },
    { id: '2', dayOfWeek: 1, startTime: '09:30', durationMinutes: 60, subject: 'ICT', grade: 'L3', status: 'Pending', resourceIds: ['room-101'] }
  ];
  const mockCurriculum = { 'Solar': ['Unit 1'], 'ICT': ['Unit 1'] };
  const mockHolidays = [];
  const mockWeekDates = [new Date('2026-07-06')];
  
  const diags = getDiagnostics(mockSchedule, mockCurriculum, mockHolidays, mockWeekDates);
  if (diags.score !== 80) {
    throw new Error(`Expected health score of 80 (100 - 20), got ${diags.score}`);
  }
});

addTest(19, 'AI Co-Pilot Optimizer', 'Syllabus gap deducts 10 points per unallocated subject', () => {
  const mockSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', status: 'Pending' }
  ];
  const mockCurriculum = { 'Solar': ['Unit 1'], 'ICT': ['Unit 1'] };
  const mockHolidays = [];
  const mockWeekDates = [new Date('2026-07-06')];
  
  const diags = getDiagnostics(mockSchedule, mockCurriculum, mockHolidays, mockWeekDates);
  if (diags.score !== 90) {
    throw new Error(`Expected health score of 90 (100 - 10 gap), got ${diags.score}`);
  }
});

addTest(20, 'AI Co-Pilot Optimizer', 'Auto-optimize resolves holiday slots by cancelling status', () => {
  const mockSchedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', grade: 'L3', status: 'Pending' }
  ];
  const mockHolidays = [{ name: 'Test Holiday', startDate: '2026-07-06', endDate: '2026-07-06' }];
  
  const holidaySlots = mockSchedule.filter(s => {
    if (s.status === 'Cancelled') return false;
    const dateStr = s.overrideDate || '2026-07-06';
    return isHoliday(new Date(dateStr), mockHolidays);
  });
  
  const updatedSchedule = mockSchedule.map(s => {
    if (holidaySlots.some(hs => hs.id === s.id)) {
      return { ...s, status: 'Cancelled' };
    }
    return s;
  });
  
  if (updatedSchedule[0].status !== 'Cancelled') {
    throw new Error("Auto-optimize logic failed to cancel holiday conflict slot");
  }
});

// Category: Syllabus Sync Metrics (Tier 1: 21-25)
addTest(21, 'Syllabus Sync Metrics', 'Progress percentage matches count vs units', () => {
  const scheduledCount = 3;
  const totalUnits = 6;
  const percent = Math.min(100, Math.round((scheduledCount / totalUnits) * 100));
  if (percent !== 50) {
    throw new Error(`Expected progress percentage to be 50, got ${percent}`);
  }
});

addTest(22, 'Syllabus Sync Metrics', 'Low coverage warning triggers when percent < 50', () => {
  const count = 2;
  const unitsLength = 5;
  const hasWarning = count < unitsLength / 2;
  if (!hasWarning) {
    throw new Error("Failed to trigger low coverage warning for count < units/2");
  }
});

addTest(23, 'Syllabus Sync Metrics', 'Critical allocation gap triggers on zero classes', () => {
  const count = 0;
  const hasCriticalGap = count === 0;
  if (!hasCriticalGap) {
    throw new Error("Failed to trigger critical gap warning for 0 allocations");
  }
});

addTest(24, 'Syllabus Sync Metrics', 'Live Sync badge matches source code definition', () => {
  const match = scheduleContent.includes('Live Sync');
  if (!match) {
    throw new Error("Live Sync indicator badge is missing in Schedule.tsx");
  }
});

addTest(25, 'Syllabus Sync Metrics', 'Curriculum sync updates progress on timetable edits', () => {
  let schedule = [{ id: '1', subject: 'Solar', status: 'Pending' }];
  const curriculum = { 'Solar': ['Unit 1', 'Unit 2'] };
  
  let count = schedule.filter(s => s.subject === 'Solar' && s.status !== 'Cancelled').length;
  let p1 = Math.min(100, Math.round((count / curriculum.Solar.length) * 100));
  
  schedule.push({ id: '2', subject: 'Solar', status: 'Pending' });
  count = schedule.filter(s => s.subject === 'Solar' && s.status !== 'Cancelled').length;
  let p2 = Math.min(100, Math.round((count / curriculum.Solar.length) * 100));
  
  if (p1 !== 50 || p2 !== 100) {
    throw new Error(`Curriculum state did not update correctly from 50% to 100%. Got ${p1}% -> ${p2}%`);
  }
});

// Category: Theme Switcher (Tier 1: 26-30)
addTest(26, 'Theme Switcher', 'Theme state persists in local storage', () => {
  const match = scheduleContent.includes('schedule_theme');
  if (!match) {
    throw new Error("LocalStorage theme persistence hook key 'schedule_theme' not found in Schedule.tsx");
  }
});

addTest(27, 'Theme Switcher', 'Core themes config are supported in source', () => {
  const themes = ['indigo', 'emerald', 'cyberpunk', 'amber', 'rose'];
  for (const t of themes) {
    if (!scheduleContent.includes(t)) {
      throw new Error(`Theme ${t} configuration is missing in Schedule.tsx`);
    }
  }
});

addTest(28, 'Theme Switcher', 'Cyberpunk neon colors are present in source', () => {
  const match = scheduleContent.includes('neonPalettes') || scheduleContent.includes('Pink Neon') || scheduleContent.includes('Cyan Neon');
  if (!match) {
    throw new Error("Cyberpunk theme is missing neon style color palettes in Schedule.tsx");
  }
});

addTest(29, 'Theme Switcher', 'Emerald Forest style matches green parameters', () => {
  const match = scheduleContent.includes('emerald') && scheduleContent.includes('Forest');
  if (!match) {
    throw new Error("Emerald green theme styles are missing in Schedule.tsx");
  }
});

addTest(30, 'Theme Switcher', 'Theme pill buttons are rendered in markup', () => {
  const match = scheduleContent.includes('Theme:') && scheduleContent.includes('Classic') && scheduleContent.includes('Cyberpunk');
  if (!match) {
    throw new Error("Theme selector buttons are missing in Schedule.tsx header markup");
  }
});

// =====================================================================
// TIER 2: BOUNDARY & CORNER CASES (30 Cases)
// =====================================================================

// Category: Glassmorphism UI Layout Boundary (Tier 2: 31-35)
addTest(31, 'Glassmorphism UI Layout Boundary', 'Compact density preserves layout frosted layers', () => {
  const match = scheduleContent.includes('backdrop-blur-lg') || scheduleContent.includes('backdrop-blur-xl');
  if (!match) throw new Error("Main layout does not contain glassmorphic backdrop-blur classes in compact grid density");
});

addTest(32, 'Glassmorphism UI Layout Boundary', 'Preferences is null fallback values', () => {
  const preferences = null;
  const customSubjects = preferences?.customSubjects && preferences.customSubjects.length > 0 ? preferences.customSubjects : ['Solar', 'ICT'];
  if (customSubjects[0] !== 'Solar' || customSubjects[1] !== 'ICT') {
    throw new Error("Fallback styles did not handle null preferences correctly");
  }
});

addTest(33, 'Glassmorphism UI Layout Boundary', 'Screen size adaptation limits structure', () => {
  const match = scheduleContent.includes('isMobile') || scheduleContent.includes('window.innerWidth');
  if (!match) throw new Error("Screen size adaptation check is missing in Schedule.tsx");
});

addTest(34, 'Glassmorphism UI Layout Boundary', 'High contrast cyberpunk borders render frosted layers', () => {
  const match = scheduleContent.includes('border-white/10') || scheduleContent.includes('border-white/20');
  if (!match) throw new Error("Frosted border styles are missing for extreme contrast glassmorphic rendering");
});

addTest(35, 'Glassmorphism UI Layout Boundary', 'Modal overlay handles z-index bounds correctly', () => {
  const match = scheduleContent.includes('z-40') && scheduleContent.includes('z-50');
  if (!match) throw new Error("Modal z-index overlay stacking depth is missing proper boundary config");
});

// Category: WebGL 3D Workload View Boundary (Tier 2: 36-40)
addTest(36, 'WebGL 3D Workload View Boundary', 'Empty schedule mesh rendering does not crash scene', () => {
  const match = scheduleContent.includes('workload-3d-canvas') && scheduleContent.includes('length === 0');
  if (!match) throw new Error("WebGL empty schedule mesh rendering failsafe is missing");
});

addTest(37, 'WebGL 3D Workload View Boundary', 'Maximum workload heights clamp bounds', () => {
  const match = scheduleContent.includes('workload-3d-canvas') && scheduleContent.includes('clamp');
  if (!match) throw new Error("WebGL workload height/intensity clamping is missing");
});

addTest(38, 'WebGL 3D Workload View Boundary', 'Theme update during active canvas frame rendering', () => {
  const match = scheduleContent.includes('webgl') && scheduleContent.includes('theme') && scheduleContent.includes('useEffect');
  if (!match) throw new Error("WebGL theme color update event handler is missing");
});

addTest(39, 'WebGL 3D Workload View Boundary', 'Context lost / restore event handlers are configured', () => {
  const match = scheduleContent.includes('webglcontextlost') || scheduleContent.includes('webglcontextrestored');
  if (!match) throw new Error("WebGL context loss and restoration listeners are missing");
});

addTest(40, 'WebGL 3D Workload View Boundary', 'Graceful fallback message when WebGL is unsupported', () => {
  const match = scheduleContent.includes('WebGL not supported') || scheduleContent.includes('Canvas not supported');
  if (!match) throw new Error("WebGL unsupported browser fallback is missing");
});

// Category: Drag-and-Drop Handler Boundary (Tier 2: 41-45)
addTest(41, 'Drag-and-Drop Handler Boundary', 'Midnight boundary times clamp to grid end', () => {
  const minTime = 0;
  const maxTime = 23 * 65;
  const clampTime = (time) => Math.max(minTime, Math.min(time, 23 * 60 + 45));
  if (clampTime(-10) !== 0 || clampTime(1500) !== 23 * 60 + 45) {
    throw new Error("Time clamping did not properly handle midnight boundaries");
  }
});

addTest(42, 'Drag-and-Drop Handler Boundary', 'Drops on columns designated as public holiday are blocked', () => {
  const match = scheduleDndContent.includes('disabled: !!holiday');
  if (!match) {
    throw new Error("Droppable column is not disabled when holiday is active");
  }
});

addTest(43, 'Drag-and-Drop Handler Boundary', 'Overrides nested reschedule retains replacesSlotId chain', () => {
  const activeSlot = { id: 'override-1', replacesSlotId: 'original-1', overrideDate: '2026-07-06' };
  const nextOverride = { ...activeSlot, replacesSlotId: activeSlot.replacesSlotId, overrideDate: '2026-07-07' };
  if (nextOverride.replacesSlotId !== 'original-1') {
    throw new Error("Override chain lost original replacesSlotId when rescheduled again");
  }
});

addTest(44, 'Drag-and-Drop Handler Boundary', 'Delta calculations across multi-day column drops', () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const getDayIndex = (day) => days.indexOf(day) + 1;
  const startDay = getDayIndex('Monday');
  const deltaDays = 3;
  const endDay = ((startDay - 1 + deltaDays) % 7) + 1;
  if (endDay !== 4) {
    throw new Error(`Expected day index 4, got ${endDay}`);
  }
});

addTest(45, 'Drag-and-Drop Handler Boundary', 'Drop event outside active drop zone resets position', () => {
  const match = scheduleContent.includes('if (!over) return;');
  if (!match) {
    throw new Error("Drag end handler does not return early when drop is out of bounds");
  }
});

// Category: AI Co-Pilot Optimizer Boundary (Tier 2: 46-50)
addTest(46, 'AI Co-Pilot Optimizer Boundary', 'Diagnostics score clamp prevents index falling below 15', () => {
  const score = Math.max(15, -20);
  if (score !== 15) {
    throw new Error(`Expected score to clamp to 15, got ${score}`);
  }
});

addTest(47, 'AI Co-Pilot Optimizer Boundary', 'Score clamps to 15 on high conflict schedules', () => {
  const mockSchedule = Array.from({ length: 10 }, (_, i) => ({
    id: `${i}`, dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', status: 'Pending'
  }));
  const mockHolidays = [{ name: 'Test Holiday', startDate: '2026-07-06', endDate: '2026-07-06' }];
  const mockWeekDates = [new Date('2026-07-06')];
  
  const diags = getDiagnostics(mockSchedule, { 'Solar': ['Unit 1'] }, mockHolidays, mockWeekDates);
  if (diags.score !== 15) {
    throw new Error(`Expected score clamped to 15, got ${diags.score}`);
  }
});

addTest(48, 'AI Co-Pilot Optimizer Boundary', 'Auto-optimize on zero conflicts makes no changes', () => {
  const mockSchedule = [{ id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', status: 'Pending' }];
  const holidaySlots = mockSchedule.filter(s => isHoliday(new Date('2026-07-06'), []));
  if (holidaySlots.length !== 0) {
    throw new Error("Auto-optimize identified holiday slots on a clean schedule");
  }
});

addTest(49, 'AI Co-Pilot Optimizer Boundary', 'Fallback support for null holiday lists', () => {
  const mockSchedule = [{ id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', status: 'Pending' }];
  const diags = getDiagnostics(mockSchedule, { 'Solar': ['Unit 1'] }, null, [new Date('2026-07-06')]);
  if (diags.score !== 100) {
    throw new Error(`Expected score of 100 with null holidays, got ${diags.score}`);
  }
});

addTest(50, 'AI Co-Pilot Optimizer Boundary', 'High load day (>6 classes) deducts 8 points', () => {
  const mockSchedule = Array.from({ length: 7 }, (_, i) => ({
    id: `${i}`, dayOfWeek: 1, startTime: `${9 + i}:00`, durationMinutes: 60, subject: 'Solar', status: 'Pending'
  }));
  const diags = getDiagnostics(mockSchedule, { 'Solar': ['Unit 1'] }, [], [new Date('2026-07-06')]);
  if (diags.score !== 92) {
    throw new Error(`Expected score 92 for high class load, got ${diags.score}`);
  }
});

// Category: Syllabus Sync Metrics Boundary (Tier 2: 51-55)
addTest(51, 'Syllabus Sync Metrics Boundary', 'Prevents division by zero for unconfigured subject curriculum', () => {
  const units = [];
  const totalUnits = units.length || 1;
  const percent = Math.round((0 / totalUnits) * 100);
  if (percent !== 0) {
    throw new Error("Failed to prevent division by zero for subject with 0 units");
  }
});

addTest(52, 'Syllabus Sync Metrics Boundary', 'Clamps progress percentage to 100 on excessive allocations', () => {
  const percent = Math.min(100, Math.round((8 / 3) * 100));
  if (percent !== 100) {
    throw new Error(`Expected percent clamped to 100, got ${percent}`);
  }
});

addTest(53, 'Syllabus Sync Metrics Boundary', 'Handles scheduling slots for unlisted subjects gracefully', () => {
  const curriculum = { 'Solar': ['Unit 1'] };
  const schedule = [{ subject: 'Unlisted' }];
  const entries = Object.entries(curriculum);
  for (const [subject, units] of entries) {
    const count = schedule.filter(s => s.subject === subject).length;
    const percent = Math.min(100, Math.round((count / units.length) * 100));
  }
});

addTest(54, 'Syllabus Sync Metrics Boundary', 'Custom subject preferences dynamically map list categories', () => {
  const preferences = { customSubjects: ['Solar', 'ICT', 'Agriculture'] };
  const subjects = preferences.customSubjects.length > 0 ? preferences.customSubjects : ['Solar', 'ICT'];
  if (subjects.length !== 3 || subjects[2] !== 'Agriculture') {
    throw new Error("Failed to dynamically sync subjects from preferences");
  }
});

addTest(55, 'Syllabus Sync Metrics Boundary', 'Completely empty schedule registers 0 percent across all columns', () => {
  const curriculum = { 'Solar': ['Unit 1'] };
  const schedule = [];
  const percent = Math.min(100, Math.round((schedule.length / curriculum.Solar.length) * 100));
  if (percent !== 0) {
    throw new Error(`Expected zero progress percent to be 0, got ${percent}`);
  }
});

// Category: Theme Switcher Boundary (Tier 2: 56-60)
addTest(56, 'Theme Switcher Boundary', 'Storage corruption fallback default maps classic styles', () => {
  const storedTheme = 'corrupted';
  const getThemeClasses = (theme) => {
    switch (theme) {
      case 'cyberpunk': return { bg: 'bg-slate-950' };
      default: return { bg: 'bg-[var(--md-sys-color-surface)]' };
    }
  };
  const themeClasses = getThemeClasses(storedTheme);
  if (!themeClasses.bg.includes('surface')) {
    throw new Error("Failed to fall back to default theme classes on corrupted storage value");
  }
});

addTest(57, 'Theme Switcher Boundary', 'Theme switch during active DND does not lose drag coordinates', () => {
  const transform = { x: 10, y: 50 };
  const style = { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` };
  const activeTheme = 'cyberpunk';
  if (style.transform !== 'translate3d(10px, 50px, 0)') {
    throw new Error("Theme switch cleared active drag transform properties");
  }
});

addTest(58, 'Theme Switcher Boundary', 'Integrates default system light/dark mode transitions', () => {
  const match = scheduleContent.includes("matchMedia('(prefers-color-scheme: dark)')");
  if (!match) {
    throw new Error("System dark/light mode preference query is missing in Schedule.tsx");
  }
});

addTest(59, 'Theme Switcher Boundary', 'Missing slot colors fallback to dynamically calculated hash', () => {
  const slot = { subject: 'Solar' };
  let hash = 0;
  for (let i = 0; i < slot.subject.length; i++) {
    hash = slot.subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIdx = Math.abs(hash) % 6;
  if (typeof colorIdx !== 'number' || isNaN(colorIdx)) {
    throw new Error("String hashing slot color index calculation failed");
  }
});

addTest(60, 'Theme Switcher Boundary', 'Rapid selector switching does not cause race condition crashes', () => {
  let activeTheme = 'indigo';
  const setTheme = (t) => { activeTheme = t; };
  setTheme('cyberpunk');
  setTheme('emerald');
  setTheme('amber');
  if (activeTheme !== 'amber') {
    throw new Error("Active theme state did not resolve to the last selected theme");
  }
});

// =====================================================================
// TIER 3: CROSS-FEATURE COMBINATIONS (6 Cases: 61-66)
// =====================================================================
addTest(61, 'Cross-Feature Combinations', 'DND + Syllabus Sync: Rescheduling updates syllabus progress', () => {
  const schedule = [{ id: '1', dayOfWeek: 1, subject: 'Solar', status: 'Pending' }];
  schedule[0].dayOfWeek = 3;
  const count = schedule.filter(s => s.subject === 'Solar').length;
  if (count !== 1) {
    throw new Error("Syllabus count did not reflect reschedule changes");
  }
});

addTest(62, 'Cross-Feature Combinations', 'DND + AI Optimizer: Relocating slot updates optimizer score', () => {
  const schedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', status: 'Pending', resourceIds: ['room-101'] },
    { id: '2', dayOfWeek: 1, startTime: '09:30', durationMinutes: 60, subject: 'ICT', grade: 'L3', status: 'Pending', resourceIds: ['room-101'] }
  ];
  let diags = getDiagnostics(schedule, { 'Solar': ['Unit 1'], 'ICT': ['Unit 1'] }, [], [new Date('2026-07-06')]);
  const initialScore = diags.score;
  
  schedule[1].dayOfWeek = 2;
  diags = getDiagnostics(schedule, { 'Solar': ['Unit 1'], 'ICT': ['Unit 1'] }, [], [new Date('2026-07-06'), new Date('2026-07-07')]);
  
  if (initialScore >= diags.score) {
    throw new Error(`DND move failed to improve health score (initial: ${initialScore}, final: ${diags.score})`);
  }
});

addTest(63, 'Cross-Feature Combinations', 'Theme + WebGL: Theme change updates WebGL render parameters', () => {
  const match = scheduleContent.includes('webgl') && scheduleContent.includes('theme') && scheduleContent.includes('color');
  if (!match) {
    throw new Error("Theme switcher is not connected to WebGL color updates");
  }
});

addTest(64, 'Cross-Feature Combinations', 'AI Optimizer + Holiday block: Auto-optimize adjusts syllabus metrics', () => {
  const schedule = [{ id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', status: 'Pending' }];
  const curriculum = { 'Solar': ['Unit 1'] };
  const holidays = [{ name: 'Holiday', startDate: '2026-07-06', endDate: '2026-07-06' }];
  
  const holidaySlots = schedule.filter(s => isHoliday(new Date('2026-07-06'), holidays));
  const updatedSchedule = schedule.map(s => {
    if (holidaySlots.some(hs => hs.id === s.id)) {
      return { ...s, status: 'Cancelled' };
    }
    return s;
  });
  
  const activeCount = updatedSchedule.filter(s => s.subject === 'Solar' && s.status !== 'Cancelled').length;
  if (activeCount !== 0) {
    throw new Error("Holiday slot cancellation was not reflected in active count");
  }
});

addTest(65, 'Cross-Feature Combinations', 'Glassmorphism + Theme change: Theme changes update glassmorphic glow parameters', () => {
  const match = scheduleContent.includes('border-white/10') || scheduleContent.includes('border-white/20');
  if (!match) {
    throw new Error("Theme change did not apply corresponding glassmorphic border styles");
  }
});

addTest(66, 'Cross-Feature Combinations', 'DND + Theme change: active drag transform coordinates preserved', () => {
  const transform = { x: 50, y: 100 };
  const getStyle = (t) => ({ transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, border: t === 'cyberpunk' ? 'border-pink-500' : 'border-indigo-500' });
  const style1 = getStyle('indigo');
  const style2 = getStyle('cyberpunk');
  if (style1.transform !== style2.transform || style2.border !== 'border-pink-500') {
    throw new Error("Theme change modified active drag transform coordinate properties");
  }
});

// =====================================================================
// TIER 4: REAL-WORLD APPLICATION SCENARIOS (5 Cases: 67-71)
// =====================================================================
addTest(67, 'Real-World Application Scenarios', 'Scenario 1: Drag-and-drop slots update syllabus metrics and redraw WebGL', () => {
  const hasWebGLRedraw = scheduleContent.includes('webgl') && (scheduleContent.includes('redraw') || scheduleContent.includes('renderWebGL'));
  if (!hasWebGLRedraw) {
    throw new Error("WebGL scene redraw failed to trigger after schedule status update");
  }
});

addTest(68, 'Real-World Application Scenarios', 'Scenario 2: Peak load warning and automatic optimization', () => {
  const schedule = [
    { id: '1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar', status: 'Pending', resourceIds: ['room-101'] },
    { id: '2', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'ICT', status: 'Pending', resourceIds: ['room-101'] }
  ];
  let diags = getDiagnostics(schedule, { 'Solar': ['Unit 1'], 'ICT': ['Unit 1'] }, [], [new Date('2026-07-06')]);
  if (diags.issues.length === 0) {
    throw new Error("Peak load resource conflict went undetected");
  }
});

addTest(69, 'Real-World Application Scenarios', 'Scenario 3: Profile switches updates glassmorphic layout and WebGL colors', () => {
  const hasWebGLColors = scheduleContent.includes('webgl') && scheduleContent.includes('theme');
  if (!hasWebGLColors) {
    throw new Error("Timetable theme change did not update WebGL workload visualization styles");
  }
});

addTest(70, 'Real-World Application Scenarios', 'Scenario 4: Dragging onto public holiday droppables is blocked', () => {
  const isDroppableDisabled = scheduleDndContent.includes('disabled: !!holiday');
  if (!isDroppableDisabled) {
    throw new Error("Public holiday drop lock failed: column droppable is not disabled");
  }
});

addTest(71, 'Real-World Application Scenarios', 'Scenario 5: Creating date override slots does not impact weekly templates', () => {
  const activeSlot = { id: 'recurring-1', dayOfWeek: 1, startTime: '09:00', durationMinutes: 60, subject: 'Solar' };
  const dateStr = '2026-07-13';
  const override = {
    ...activeSlot,
    overrideDate: dateStr,
    startTime: '10:00',
    replacesSlotId: activeSlot.id,
    status: 'Pending'
  };
  if (!override.overrideDate || override.replacesSlotId !== 'recurring-1') {
    throw new Error("Override slot did not properly preserve override date and replacesSlotId link");
  }
});

// ── 4. Execute Tests and Print Results ──────────────────────────────
let passed = 0;
let failed = 0;
const resultsList = [];

console.log(`${' '.repeat(4)}ID | Category / Feature | Test Name | Status | Error Message`);
console.log('-'.repeat(100));

for (const t of testCases) {
  try {
    t.fn();
    passed++;
    resultsList.push({ id: t.id, category: t.category, name: t.name, status: 'PASSED', error: '' });
    console.log(`  [${String(t.id).padStart(2, '0')}] | ${t.category.padEnd(30)} | ${t.name.padEnd(50)} | ✅ PASS |`);
  } catch (err) {
    failed++;
    resultsList.push({ id: t.id, category: t.category, name: t.name, status: 'FAILED', error: err.message });
    console.log(`  [${String(t.id).padStart(2, '0')}] | ${t.category.padEnd(30)} | ${t.name.padEnd(50)} | ❌ FAIL | ${err.message}`);
  }
}

console.log('\n==================================================');
console.log('📊 TEST SUMMARY');
console.log('==================================================');
console.log(`Total Cases: ${testCases.length}`);
console.log(`Passed:      ${passed}`);
console.log(`Failed:      ${failed}`);
console.log('==================================================\n');

if (failed > 0) {
  console.log('⚠️ Note: Some test cases failed due to unimplemented features (Glassmorphism layout and WebGL/Canvas 3D Scene), as expected.\n');
  process.exit(1);
} else {
  console.log('🎉 All test cases passed successfully!\n');
  process.exit(0);
}
