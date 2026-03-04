export type Subject = 'Solar' | 'ICT';
export type CompetencyLevel = 1 | 2 | 3 | 4; // Emerging, Developing, Competent, Mastered
export type LessonStatus = 'Pending' | 'Completed' | 'Skipped' | 'Cancelled';
export type StudentGroup = 'Campus' | 'Academy' | 'CBC' | 'High School';

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
  grade: string; // Education level ID, e.g. 'L3', 'G7', 'F2', 'Y1'
  lot: string;
  subject: Subject;
  studentGroup: StudentGroup;
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
  avatarId?: string; // e.g. "avatar_1", "avatar_2"
  kcseGrade?: string; // e.g., 'C-', 'D+'

  // Assessment Data
  assessment: StudentAssessmentProfile;
}

// --- Analytics RPC Return Types ---

export interface ClassAveragesResult {
  overall_avg_score: number;
  overall_avg_attendance: number;
  total_students: number;
}

export interface SubjectComparisonResult {
  subject: string;
  avg_score: number;
  student_count: number;
}

export interface AtRiskStudentResult {
  id: string; // The UUID from Supabase profiles, not the numeric local ID
  name: string;
  subject: string;
  avg_score: number;
  attendance_pct: number;
}

export interface GradeDistributionResult {
  grade: string;
  student_count: number;
  avg_score: number;
  avg_attendance: number;
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
  grade: string; // Education level ID, e.g. 'L3', 'G7', 'F2', 'Y1'
  studentGroup?: StudentGroup; // Which education system this class belongs to
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
  library: LibraryResource[];
  communications: {
    channels: ChatChannel[];
    messages: Record<string, ChatMessage[]>; // Keyed by channelId
  };
  payments: FeePayment[];
  feeStructures: FeeStructure[];
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

export interface LibraryResource {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  category: 'lesson-plan' | 'session-plan' | 'guide' | 'notes' | 'report' | 'question-paper' | 'other';
  uploadedBy: string;
  uploadedAt: string; // ISO String
  size: number;
  isApproved: boolean;
  downloadUrl?: string; // Cloud Storage URL
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

export interface ChatChannel {
  id: string;
  name: string;
  type: 'announcement' | 'chat' | 'dm';
  description?: string;
  isPrivate?: boolean;
  participants?: string[];
  pinnedMessageIds?: string[];
  lastReadBy?: Record<string, string>; // userId -> last read msgId
  createdBy?: string;
  createdAt?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'link';
  url: string;
  size?: number;
  mimeType?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: 'admin' | 'instructor' | 'viewer';
  content: string;
  timestamp: string; // ISO String
  editedAt?: string;
  isPinned?: boolean;
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> userId[]
  attachments?: ChatAttachment[];
  mentions?: string[];
  isDeleted?: boolean;
  scheduledFor?: string;
}

// --- Fee Payment Types ---

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'mpesa' | 'cash' | 'bank_transfer';

export interface FeeStructure {
  id: string;
  name: string;           // e.g. "Term 1 Tuition", "Registration Fee"
  amount: number;         // Amount in KES
  term?: 1 | 2 | 3;
  studentGroup?: StudentGroup;
  isRecurring: boolean;   // Charged every term?
  description?: string;
}

export interface FeePayment {
  id: string;
  studentId: number;
  studentName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  mpesaReceiptNumber?: string;
  mpesaPhoneNumber?: string;
  transactionDate: string; // ISO string
  feeStructureId?: string;
  term?: 1 | 2 | 3;
  notes?: string;
  recordedBy: string;
}

export interface StudentFeeBalance {
  studentId: number;
  studentName: string;
  totalFees: number;
  totalPaid: number;
  balance: number;
  lastPaymentDate?: string;
  payments: FeePayment[];
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
  type: 'success' | 'error' | 'info' | 'warning' | 'loading';
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
  id: string; // Supabase UID
  email: string; // User Email
  name: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface SecurityLog {
  id: string;
  timestamp: string; // ISO String
  event: SecurityEventType;
  severity: 'info' | 'warning' | 'danger';
  details?: string;
  userId?: string;
  userName?: string;
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'PASSWORD_RESET'
  | 'USER_CREATED' | 'USER_DELETED' | 'ROLE_CHANGED'
  | 'DATA_EXPORTED' | 'DATA_WIPED'
  | 'SETTINGS_CHANGED' | 'INVITE_GENERATED' | 'INVITE_USED'
  | 'SESSION_STARTED' | 'SESSION_EXPIRED' | 'SESSION_TERMINATED'
  | 'FILE_UPLOADED' | 'FILE_DELETED';

export interface InviteCode {
  code: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  usedBy?: string; // UID of the user who consumed it
}

// --- Audit Log Types (for security_schema.sql) ---

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  eventType: SecurityEventType | string;
  severity: 'info' | 'warning' | 'danger';
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

// --- Session Types ---

export interface SessionInfo {
  id: string;
  deviceFingerprint: string;
  userAgent: string;
  lastActivityAt: string;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

// --- Security Dashboard (admin view) ---

export interface SecurityDashboard {
  totalEvents: number;
  dangerEvents: number;
  warningEvents: number;
  activeSessions: number;
  lockedAccounts: number;
  recentEvents: {
    eventType: string;
    severity: string;
    userEmail: string;
    createdAt: string;
  }[];
}