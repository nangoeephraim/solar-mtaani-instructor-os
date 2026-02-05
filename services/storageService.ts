import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS, ScheduleSlot } from '../types';
import { INITIAL_DATA, DEFAULT_SCHEDULE_TEMPLATE } from '../constants';

const STORAGE_KEY = 'solar_mtaani_os_v1';
const SETTINGS_KEY = 'solar_mtaani_settings_v1';

export const getAppData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Simple migration check: ensure schedule exists
      if (!parsed.schedule || parsed.schedule.length === 0) {
        parsed.schedule = DEFAULT_SCHEDULE_TEMPLATE;
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load data from storage", e);
  }

  // Initialize default
  const defaultData = { ...INITIAL_DATA, schedule: DEFAULT_SCHEDULE_TEMPLATE };
  saveAppData(defaultData);
  return defaultData;
};

export const saveAppData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data to storage", e);
  }
};

export const resetData = (): AppData => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  return getAppData();
};

// Settings management
export const getSettings = (): InstructorSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: InstructorSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};

// Student CRUD operations
export const addStudent = (data: AppData, studentData: Omit<Student, 'id'>): AppData => {
  const maxId = data.students.reduce((max, s) => Math.max(max, s.id), 0);
  const newStudent: Student = {
    ...studentData,
    id: maxId + 1
  };

  return {
    ...data,
    students: [...data.students, newStudent]
  };
};

export const deleteStudent = (data: AppData, studentId: number): AppData => {
  return {
    ...data,
    students: data.students.filter(s => s.id !== studentId)
  };
};

// Schedule CRUD operations
export const addScheduleSlot = (data: AppData, slot: Omit<ScheduleSlot, 'id'>): AppData => {
  const newId = Math.random().toString(36).substr(2, 9);
  const newSlot: ScheduleSlot = { ...slot, id: newId };
  return {
    ...data,
    schedule: [...data.schedule, newSlot]
  };
};

export const updateScheduleSlot = (data: AppData, updatedSlot: ScheduleSlot): AppData => {
  return {
    ...data,
    schedule: data.schedule.map(s => s.id === updatedSlot.id ? updatedSlot : s)
  };
};

export const deleteScheduleSlot = (data: AppData, slotId: string): AppData => {
  return {
    ...data,
    schedule: data.schedule.filter(s => s.id !== slotId)
  };
};

// Data export
export const exportDataAsCSV = (): string => {
  const data = getAppData();
  const settings = getSettings();

  // Create CSV header
  const header = ['ID', 'Name', 'Subject', 'Grade', 'Lot', 'Attendance %', 'Avg Score', 'Competencies'];

  const rows = data.students.map(s => {
    const competencies = Object.entries(s.competencies)
      .map(([k, v]) => `${k}:${v}`)
      .join('; ');

    // Calculate Score
    const score = (Object.values(s.competencies).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(s.competencies).length)).toFixed(1);

    return [
      s.id,
      `"${s.name}"`,
      s.subject,
      s.grade,
      s.lot,
      s.attendancePct,
      score,
      `"${competencies}"`
    ].join(',');
  });

  return [header.join(','), ...rows].join('\n');
};
