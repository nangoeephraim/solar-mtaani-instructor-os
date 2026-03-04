import { AppData, ScheduleSlot } from './types';

// Seed Data from the Prompt
export const INITIAL_DATA: AppData = {
  curriculum: {
    solar: [
      {
        unit: "Workplace Safety",
        week: 1,
        session: 1,
        title: "Introduction to Workplace Safety",
        outcomes: ["Define Safety & Hazard", "List accident sources", "Identify PPE"],
        activities: "Brainstorming, Real-world examples, Definitions"
      },
      {
        unit: "Workplace Safety",
        week: 1,
        session: 2,
        title: "Hazards & Accident Prevention",
        outcomes: ["Categorize hazards", "Prevent accidents", "Electric shock causes"],
        activities: "Hazard Hunt, Case Study Analysis"
      },
      {
        unit: "Tools & Equipment",
        week: 2,
        session: 1,
        title: "Hand Tools Identification",
        outcomes: ["Identify Pliers/Screwdrivers", "Select correct tool", "Safe handling"],
        activities: "Tool inspection, Matching exercise"
      },
      {
        unit: "Electrical Principles",
        week: 3,
        session: 2,
        title: "Ohm’s Law",
        outcomes: ["State Ohm’s Law", "Use Magic Triangle", "Calculate Current"],
        activities: "Calculations, Multimeter verification"
      }
    ],
    ict: [
      {
        unit: "Intro to Computers",
        date: "2025-03-08",
        title: "Computer Systems",
        outcomes: ["Define computer", "Explain components"],
        activities: "Creating Word doc, saving formats"
      },
      {
        unit: "Intro to Computers",
        date: "2025-03-09",
        title: "Types of Computers",
        outcomes: ["Classify by size", "Classify by purpose"],
        activities: "Group research, Presentations"
      }
    ]
  },
  students: [
    {
      id: 1,
      name: "Brian Omondi",
      grade: 'L3',
      lot: "2025",
      subject: "Solar",
      studentGroup: "Academy",
      competencies: { safety: 3, tools: 2, principles: 1, installation: 1, maintenance: 2 },
      attendancePct: 95,
      attendanceHistory: [],
      notes: ["Shows strong leadership skills in group tasks."],
      assessment: { units: {}, termStats: [] }
    },
    {
      id: 2,
      name: "Sarah Wanjiku",
      grade: 'L3',
      lot: "2025",
      subject: "Solar",
      studentGroup: "Academy",
      competencies: { safety: 4, tools: 4, principles: 3, installation: 2, maintenance: 3 },
      attendancePct: 98,
      attendanceHistory: [],
      notes: [],
      assessment: { units: {}, termStats: [] }
    },
    {
      id: 3,
      name: "Kevin Kamau",
      grade: 'Y2',
      lot: "2024",
      subject: "Solar",
      studentGroup: "Campus",
      competencies: { safety: 2, tools: 2, principles: 1, installation: 1, maintenance: 1 },
      attendancePct: 65, // At risk attendance
      attendanceHistory: [],
      notes: ["Frequently late. Needs parent consultation."],
      assessment: { units: {}, termStats: [] }
    },
    {
      id: 4,
      name: "Jane Doe",
      grade: 'G5',
      lot: "2025",
      subject: "ICT",
      studentGroup: "CBC",
      competencies: { hardware: 3, software: 4, typing: 2, formatting: 3, data: 2 },
      attendancePct: 92,
      attendanceHistory: [],
      notes: [],
      assessment: { units: {}, termStats: [] }
    }
  ],
  schedule: [], // Will be populated in the service if empty
  holidays: [],
  resources: [
    { id: 'r1', name: 'Classroom A', type: 'room', capacity: 30, status: 'available' },
    { id: 'r2', name: 'Solar Lab', type: 'room', capacity: 15, status: 'available' },
    { id: 'r3', name: 'Projector 1', type: 'equipment', status: 'available' }
  ],
  library: [],
  communications: {
    channels: [],
    messages: {}
  },
  payments: [],
  feeStructures: []
};

// Default Schedule Template (Recurring)
export const DEFAULT_SCHEDULE_TEMPLATE: ScheduleSlot[] = [
  // Monday
  { id: 'mon-0900', dayOfWeek: 1, startTime: "09:00", durationMinutes: 60, grade: 'L3', subject: "Solar", status: 'Pending' },
  { id: 'mon-1100', dayOfWeek: 1, startTime: "11:00", durationMinutes: 60, grade: 'L4', subject: "ICT", status: 'Pending' },
  // Tuesday
  { id: 'tue-0900', dayOfWeek: 2, startTime: "09:00", durationMinutes: 60, grade: 'L3', subject: "ICT", status: 'Pending' },
  { id: 'tue-1400', dayOfWeek: 2, startTime: "14:00", durationMinutes: 90, grade: 'L5', subject: "Solar", status: 'Pending' },
  // Wednesday
  { id: 'wed-1000', dayOfWeek: 3, startTime: "10:00", durationMinutes: 60, grade: 'L3', subject: "Solar", status: 'Pending' },
  // Thursday
  { id: 'thu-0900', dayOfWeek: 4, startTime: "09:00", durationMinutes: 60, grade: 'L6', subject: "Solar", status: 'Pending' },
  // Friday
  { id: 'fri-0900', dayOfWeek: 5, startTime: "09:00", durationMinutes: 120, grade: 'L4', subject: "Solar", status: 'Pending' },
];