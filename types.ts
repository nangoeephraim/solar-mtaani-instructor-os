export type Subject = 'Solar' | 'ICT';
export type CompetencyLevel = 1 | 2 | 3 | 4; // Emerging, Developing, Competent, Mastered
export type LessonStatus = 'Pending' | 'Completed' | 'Skipped';

export interface CurriculumUnit {
  unit: string;
  week?: number;
  session?: number; // For Solar
  date?: string; // For ICT
  title: string;
  outcomes: string[];
  activities: string;
}

export interface CompetencyMap {
  [key: string]: number; // key: unit/skill name, value: 1-4
}

export interface AttendanceRecord {
  date: string; // ISO String YYYY-MM-DD
  slotId?: string; // specific class session
  status: 'present' | 'absent';
  notes?: string;
}

export interface Student {
  id: number;
  name: string;
  grade: number;
  lot: string;
  subject: Subject;
  competencies: CompetencyMap;
  attendancePct: number; // Calculated field
  attendanceHistory: AttendanceRecord[];
  notes: string[];
  // New fields for comprehensive profile
  photo?: string; // Base64 encoded image
  email?: string;
  phone?: string;
  dateOfBirth?: string; // ISO date string
  enrollmentDate?: string; // ISO date string
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek: number; // 1 = Monday
  startTime: string; // "09:00"
  durationMinutes: number;
  grade: number;
  subject: Subject;
  status: LessonStatus;
  overrideDate?: string; // For rescheduled slots
  replacesSlotId?: string; // ID of the recurring slot this overrides
}

export interface AppData {
  curriculum: {
    solar: CurriculumUnit[];
    ict: CurriculumUnit[];
  };
  students: Student[];
  schedule: ScheduleSlot[];
}

export const COMPETENCY_LABELS: Record<number, string> = {
  1: 'Emerging',
  2: 'Developing',
  3: 'Competent',
  4: 'Mastered'
};

export const COMPETENCY_COLORS: Record<number, string> = {
  1: 'bg-rose-100 text-rose-800 border-rose-200 ring-rose-200',
  2: 'bg-amber-100 text-amber-800 border-amber-200 ring-amber-200',
  3: 'bg-blue-100 text-blue-800 border-blue-200 ring-blue-200',
  4: 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-emerald-200',
};

// Settings types
export interface AppPreferences {
  theme: 'light' | 'dark' | 'system';
  accentColor: 'blue' | 'orange' | 'green' | 'purple';
  enableAI: boolean;
  reducedMotion: boolean;
}

export interface InstructorSettings {
  name: string;
  organization: string;
  preferences: AppPreferences;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const DEFAULT_SETTINGS: InstructorSettings = {
  name: 'Instructor',
  organization: 'Solar Mtaani',
  preferences: {
    theme: 'light',
    accentColor: 'blue',
    enableAI: true,
    reducedMotion: false
  }
};