export type Subject = 'Solar' | 'ICT';
export type CompetencyLevel = 1 | 2 | 3 | 4; // Emerging, Developing, Competent, Mastered
export type LessonStatus = 'Pending' | 'Completed' | 'Skipped' | 'Cancelled';

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

  // Regulatory Fields (NITA/EPRA/KNEC)
  admissionNumber?: string;
  nitaNumber?: string; // NITA Registration Number
  epraLicenseStatus?: 'None' | 'T1' | 'T2' | 'T3';
  kcseGrade?: string; // e.g., 'C-', 'D+'

  // Assessment Data
  assessment: StudentAssessmentProfile;
}

// --- Assessment System Models ---

export type AssessmentSystem = 'CBET' | 'KNEC'; // Competency Based vs Standard Grading

export type GradeKNEC = 'Distinction' | 'Credit' | 'Pass' | 'Referral' | 'Fail';
export type VerdictCBET = 'Competent' | 'Not Yet Competent';

export interface AssessmentComponent {
  score: number;
  maxScore: number;
  weight: number; // Percentage 0-100
}

export interface UnitAssessment {
  unitId: string;
  system: AssessmentSystem;

  // KNEC Components
  cat1?: AssessmentComponent;
  cat2?: AssessmentComponent;
  practical?: AssessmentComponent;
  finalExam?: AssessmentComponent;

  // CBET Components
  portfolioEvidence?: boolean; // Has submitted required portfolio
  practicalChecks?: string[]; // IDs of passed practical skills

  // Final Results
  finalScore?: number; // For KNEC
  finalGrade?: GradeKNEC; // For KNEC
  verdict?: VerdictCBET; // For CBET
  instructorRemarks?: string;
  isOverride?: boolean; // If Instructor manually set the grade
}

export interface StudentAssessmentProfile {
  units: Record<string, UnitAssessment>; // Keyed by unit ID (e.g., 'solar_basics', 'ict_word')
  termStats: {
    term: 1 | 2 | 3;
    averageScore: number; // KNEC avg
    unitsCompleted: number; // CBET units
    classPosition?: number;
  }[];
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
  resourceIds?: string[]; // IDs of assigned resources
}

export interface AppData {
  curriculum: {
    solar: CurriculumUnit[];
    ict: CurriculumUnit[];
  };
  students: Student[];
  schedule: ScheduleSlot[];
  holidays: Holiday[];
  resources: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'other';
  capacity?: number;        // Maximum students/users
  location?: string;        // Building/room location
  status?: 'available' | 'in-use' | 'maintenance';
  notes?: string;           // Description/notes field
  usageHistory?: ResourceUsageLog[]; // Track usage over time
}

export interface ResourceUsageLog {
  id: string;
  date: string;              // ISO date
  slotId?: string;           // Schedule slot that used this resource
  action: 'assigned' | 'released' | 'maintenance-start' | 'maintenance-end' | 'created' | 'updated';
  note?: string;             // Optional note about the usage
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  type: 'public' | 'school' | 'other';
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
  notificationsEnabled: boolean;
}

export interface InstructorSettings {
  name: string;
  organization: string;
  preferences: AppPreferences;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
}

export const DEFAULT_SETTINGS: InstructorSettings = {
  name: 'Instructor',
  organization: 'PRISM',
  preferences: {
    theme: 'light',
    accentColor: 'blue',
    enableAI: true,
    reducedMotion: false,
    notificationsEnabled: true
  }
};

// --- Security & Authentication Types ---

export type UserRole = 'admin' | 'instructor' | 'viewer';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // Hashed PIN (Legacy: Int32Hex, New: SHA-256)
  salt?: string; // New: Unique salt for SHA-256
  lastLogin: string;
}

export interface InviteCode {
  code: string;
  role: UserRole;
  createdBy: string; // Admin ID
  createdAt: string;
  expiresAt: string;
  usedBy?: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAIL'
  | 'LOGOUT'
  | 'ADMIN_SETUP'
  | 'INVITE_GENERATED'
  | 'INVITE_USED'
  | 'INVITE_REVOKED'
  | 'USER_DELETED'
  | 'MIGRATION_SUCCESS'
  | 'LOCKOUT_TRIGGERED';

export interface SecurityLog {
  id: string;
  timestamp: string; // ISO String
  event: SecurityEventType;
  userId?: string;     // ID of the actor (if authenticated)
  userName?: string;   // Name of the actor (for display)
  details?: string;    // Context (e.g., "Deleted user X", "Used Invite CODE")
  ipStub?: string;     // Simulated IP (since we are local-first)
  severity: 'info' | 'warning' | 'danger';
}