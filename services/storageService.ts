import { AppData, Student, InstructorSettings, DEFAULT_SETTINGS, ScheduleSlot, Resource } from '../types';
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
      // Holiday migration check
      if (!parsed.holidays) {
        parsed.holidays = [];
      }
      // Resources migration check
      if (!parsed.resources) {
        parsed.resources = [
          { id: 'res-1', name: 'Main Hall', type: 'room' },
          { id: 'res-2', name: 'Solar Lab', type: 'room' },
          { id: 'res-3', name: 'Projector', type: 'equipment' }
        ];
      }

      // Student migration check (ensure all required arrays/objects exist)
      if (parsed.students) {
        parsed.students = parsed.students.map((s: any) => ({
          ...s,
          assessment: s.assessment || { units: {}, termStats: [] },
          attendanceHistory: s.attendanceHistory || [],
          notes: s.notes || [],
          competencies: s.competencies || {}
        }));
      }

      return parsed;
    }
  } catch (e) {
    console.error("Failed to load data from storage", e);
  }

  // Initialize default
  const defaultResources: Resource[] = [
    { id: 'res-1', name: 'Main Hall', type: 'room' },
    { id: 'res-2', name: 'Solar Lab', type: 'room' },
    { id: 'res-3', name: 'Projector', type: 'equipment' }
  ];
  const defaultData = {
    ...INITIAL_DATA,
    schedule: DEFAULT_SCHEDULE_TEMPLATE,
    holidays: [],
    resources: defaultResources
  };
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
    id: maxId + 1,
    assessment: (studentData as any).assessment || { units: {}, termStats: [] }
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

// Resource CRUD operations
export const addResource = (data: AppData, resource: Omit<Resource, 'id'>): AppData => {
  const newId = Math.random().toString(36).substr(2, 9);
  return {
    ...data,
    resources: [...data.resources, { ...resource, id: newId }]
  };
};

export const deleteResource = (data: AppData, resourceId: string): AppData => {
  return {
    ...data,
    resources: data.resources.filter(r => r.id !== resourceId)
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

// Full data backup (JSON)
export const exportFullBackup = (): string => {
  const data = getAppData();
  const settings = getSettings();
  return JSON.stringify({ data, settings, exportedAt: new Date().toISOString(), version: '2.0.0' }, null, 2);
};

// Restore from backup
export const importFullBackup = (jsonString: string): { success: boolean; error?: string } => {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup.data || !backup.settings) {
      return { success: false, error: 'Invalid backup format' };
    }
    saveAppData(backup.data);
    saveSettings(backup.settings);
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Failed to parse backup file' };
  }
};
