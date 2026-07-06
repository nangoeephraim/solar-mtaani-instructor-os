import { Student, ScheduleSlot, Resource, FeeStructure, FeePayment, StudentGroup } from '../types';

export interface SeedDataPreset {
  students: Omit<Student, 'id'>[];
  schedule: Omit<ScheduleSlot, 'id'>[];
  resources: Resource[];
  feeStructures: Omit<FeeStructure, 'id'>[];
  feePayments: (Omit<FeePayment, 'id' | 'studentId'> & { feeName: string })[];
}

export const SEED_DATA_PRESETS: Record<string, SeedDataPreset> = {
  primary: {
    students: [
      {
        name: "Fatuma Amina",
        grade: "G4",
        lot: "2026",
        subject: "Mathematics",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 3, critical_thinking: 3, creativity_imagination: 2, citizenship: 3, self_efficacy: 2, digital_literacy: 2, learning_to_learn: 3 },
        attendancePct: 96,
        attendanceHistory: [],
        notes: ["Extremely active in classroom discussions.", "Polite and helpful during group work."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-7842-G4",
        upi: "UPI-48192-A",
        guardianName: "Amina Mohamed",
        guardianPhone: "0711223344",
        address: "Kibera, Nairobi",
        email: "fatuma.amina@prism.ac.ke"
      },
      {
        name: "Ethan Kimani",
        grade: "G2",
        lot: "2026",
        subject: "Creative Arts",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 2, critical_thinking: 2, creativity_imagination: 4, citizenship: 3, self_efficacy: 3, digital_literacy: 2, learning_to_learn: 2 },
        attendancePct: 98,
        attendanceHistory: [],
        notes: ["Outstanding artistic skills.", "Showcases great imagination during drawing lessons."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-9012-G2",
        upi: "UPI-10293-B",
        guardianName: "James Kimani",
        guardianPhone: "0722334455",
        address: "Ziwani, Nairobi",
        email: "ethan.kimani@prism.ac.ke"
      },
      {
        name: "Angel Mwende",
        grade: "G6",
        lot: "2026",
        subject: "Science & Tech",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 4, critical_thinking: 4, creativity_imagination: 3, citizenship: 4, self_efficacy: 3, digital_literacy: 3, learning_to_learn: 4 },
        attendancePct: 95,
        attendanceHistory: [],
        notes: ["Top performer in science quizzes.", "Interested in environmental projects."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-3456-G6",
        upi: "UPI-56789-C",
        guardianName: "Lucy Mwende",
        guardianPhone: "0733445566",
        address: "Makadara, Nairobi",
        email: "angel.mwende@prism.ac.ke"
      },
      {
        name: "Jabari Kiprop",
        grade: "G5",
        lot: "2026",
        subject: "Agriculture & Nutrition",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 3, critical_thinking: 3, creativity_imagination: 3, citizenship: 3, self_efficacy: 2, digital_literacy: 2, learning_to_learn: 3 },
        attendancePct: 92,
        attendanceHistory: [],
        notes: ["Shows great interest in agriculture nurseries.", "Energetic and enthusiastic."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-1289-G5",
        upi: "UPI-34981-D",
        guardianName: "David Kiprop",
        guardianPhone: "0744556677",
        address: "Eldoret Highway, Uasin Gishu",
        email: "jabari.kiprop@prism.ac.ke"
      },
      {
        name: "Zola Nyambura",
        grade: "G3",
        lot: "2026",
        subject: "Mathematics",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 2, critical_thinking: 3, creativity_imagination: 3, citizenship: 2, self_efficacy: 3, digital_literacy: 3, learning_to_learn: 3 },
        attendancePct: 94,
        attendanceHistory: [],
        notes: ["Quick with mental math.", "Needs guidance in reading comprehension."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-4921-G3",
        upi: "UPI-82910-E",
        guardianName: "Grace Nyambura",
        guardianPhone: "0755667788",
        address: "Rongai, Kajiado",
        email: "zola.nyambura@prism.ac.ke"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "08:30", durationMinutes: 60, grade: "G4", studentGroup: "CBC", subject: "Mathematics", status: "Pending" },
      { dayOfWeek: 1, startTime: "10:00", durationMinutes: 60, grade: "G5", studentGroup: "CBC", subject: "Agriculture & Nutrition", status: "Pending" },
      { dayOfWeek: 2, startTime: "08:30", durationMinutes: 60, grade: "G6", studentGroup: "CBC", subject: "Science & Tech", status: "Pending" },
      { dayOfWeek: 3, startTime: "08:30", durationMinutes: 60, grade: "G4", studentGroup: "CBC", subject: "Mathematics", status: "Pending" },
      { dayOfWeek: 4, startTime: "09:30", durationMinutes: 60, grade: "G2", studentGroup: "CBC", subject: "Creative Arts", status: "Pending" },
      { dayOfWeek: 5, startTime: "11:00", durationMinutes: 60, grade: "G6", studentGroup: "CBC", subject: "Science & Tech", status: "Pending" }
    ],
    resources: [
      { id: "r_g4_room", name: "Grade 4 Classroom", type: "room", capacity: 40, location: "Block A, Room 1", status: "available", notes: "Primary level stream classroom" },
      { id: "r_g6_room", name: "Grade 6 Classroom", type: "room", capacity: 40, location: "Block A, Room 3", status: "available", notes: "Upper Primary classroom" },
      { id: "r_school_lib", name: "Primary School Library", type: "room", capacity: 50, location: "Main Block, Floor 1", status: "available", notes: "Equipped with CBC storybooks" },
      { id: "r_art_kit", name: "Creative Arts Materials Kit", type: "equipment", status: "available", notes: "Tempera paints, brushes, and sketching paper sets" }
    ],
    feeStructures: [
      { name: "Term 1 Tuition (Primary)", amount: 15000, term: 1, studentGroup: "CBC", isRecurring: true, description: "Basic Tuition fees for primary school CBC learners" },
      { name: "Primary Lunch Program", amount: 5000, term: 1, studentGroup: "CBC", isRecurring: true, description: "Termly lunch subscription" },
      { name: "Primary Activity Fee", amount: 2500, term: 1, studentGroup: "CBC", isRecurring: false, description: "Co-curricular activities fee" }
    ],
    feePayments: [
      { studentName: "Fatuma Amina", amount: 15000, method: "mpesa", status: "completed", mpesaReceiptNumber: "QRD481923K", mpesaPhoneNumber: "0711223344", transactionDate: "2026-05-01T09:00:00Z", recordedBy: "System", notes: "First term fee installment", term: 1, feeName: "Term 1 Tuition (Primary)" },
      { studentName: "Ethan Kimani", amount: 20000, method: "bank_transfer", status: "completed", transactionDate: "2026-05-02T10:30:00Z", recordedBy: "System", notes: "Full fee payment tuition + lunch", term: 1, feeName: "Term 1 Tuition (Primary)" },
      { studentName: "Angel Mwende", amount: 5000, method: "cash", status: "completed", transactionDate: "2026-05-03T14:15:00Z", recordedBy: "System", notes: "Lunch fee payment", term: 1, feeName: "Primary Lunch Program" }
    ]
  },
  jss: {
    students: [
      {
        name: "Caleb Otieno",
        grade: "G8",
        lot: "2026",
        subject: "Mathematics",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 3, critical_thinking: 4, creativity_imagination: 3, citizenship: 3, self_efficacy: 3, digital_literacy: 3, learning_to_learn: 3 },
        attendancePct: 95,
        attendanceHistory: [],
        notes: ["Strong analytical mind.", "Enjoys solving pre-technical design problems."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-0091-JSS",
        upi: "UPI-90123-JSS",
        kcpeMarks: 320,
        guardianName: "Peter Otieno",
        guardianPhone: "0712345678",
        address: "Kisumu Estate, Kisumu",
        email: "caleb.otieno@prism.ac.ke"
      },
      {
        name: "Mercy Chepkoech",
        grade: "G7",
        lot: "2026",
        subject: "Integrated Science",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 4, critical_thinking: 3, creativity_imagination: 3, citizenship: 4, self_efficacy: 4, digital_literacy: 3, learning_to_learn: 4 },
        attendancePct: 98,
        attendanceHistory: [],
        notes: ["Articulate and confident team leader.", "Shows great discipline."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-8120-JSS",
        upi: "UPI-48291-JSS",
        kcpeMarks: 345,
        guardianName: "Sarah Chepkoech",
        guardianPhone: "0723456789",
        address: "Kapsoit, Kericho",
        email: "mercy.chepkoech@prism.ac.ke"
      },
      {
        name: "David Ndwiga",
        grade: "G9",
        lot: "2026",
        subject: "Pre-Technical Studies",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 2, critical_thinking: 4, creativity_imagination: 3, citizenship: 2, self_efficacy: 2, digital_literacy: 4, learning_to_learn: 3 },
        attendancePct: 91,
        attendanceHistory: [],
        notes: ["Very skilled in practical assemblies.", "Needs to focus more on theoretical assignments."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-2849-JSS",
        upi: "UPI-71932-JSS",
        kcpeMarks: 290,
        guardianName: "Charles Ndwiga",
        guardianPhone: "0734567890",
        address: "Embu Town, Embu",
        email: "david.ndwiga@prism.ac.ke"
      },
      {
        name: "Stacy Wanjira",
        grade: "G8",
        lot: "2026",
        subject: "English",
        studentGroup: "CBC",
        competencies: { communication_collaboration: 4, critical_thinking: 3, creativity_imagination: 4, citizenship: 3, self_efficacy: 3, digital_literacy: 3, learning_to_learn: 3 },
        attendancePct: 94,
        attendanceHistory: [],
        notes: ["Outstanding essay writer.", "Exhibits great public speaking skills."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-3849-JSS",
        upi: "UPI-82931-JSS",
        kcpeMarks: 310,
        guardianName: "Beatrice Wanjira",
        guardianPhone: "0745678901",
        address: "Nyeri Suburbs, Nyeri",
        email: "stacy.wanjira@prism.ac.ke"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "08:00", durationMinutes: 60, grade: "G8", studentGroup: "CBC", subject: "Mathematics", status: "Pending" },
      { dayOfWeek: 1, startTime: "10:00", durationMinutes: 60, grade: "G7", studentGroup: "CBC", subject: "Pre-Technical Studies", status: "Pending" },
      { dayOfWeek: 2, startTime: "09:00", durationMinutes: 60, grade: "G8", studentGroup: "CBC", subject: "Integrated Science", status: "Pending" },
      { dayOfWeek: 3, startTime: "11:00", durationMinutes: 60, grade: "G9", studentGroup: "CBC", subject: "English", status: "Pending" },
      { dayOfWeek: 4, startTime: "08:00", durationMinutes: 60, grade: "G7", studentGroup: "CBC", subject: "Social Studies", status: "Pending" },
      { dayOfWeek: 5, startTime: "10:00", durationMinutes: 90, grade: "G8", studentGroup: "CBC", subject: "Pre-Technical Studies", status: "Pending" }
    ],
    resources: [
      { id: "r_jss_workshop", name: "Pre-Tech Workshop", type: "room", capacity: 30, location: "Block C, Ground Floor", status: "available", notes: "Equipped with basic carpentry and mechanical kits" },
      { id: "r_jss_science", name: "Integrated Science Lab", type: "room", capacity: 25, location: "Block C, Floor 1", status: "available", notes: "Chemicals, test tubes, and microscope benches" },
      { id: "r_jss_comp", name: "JSS Computer Lab", type: "room", capacity: 30, location: "Library Annex, Floor 2", status: "available", notes: "30 functional desktop clients with internet access" }
    ],
    feeStructures: [
      { name: "JSS Term 1 Tuition", amount: 20000, term: 1, studentGroup: "CBC", isRecurring: true, description: "Junior Secondary tuition fee" },
      { name: "Science Lab & Practicals", amount: 3500, term: 1, studentGroup: "CBC", isRecurring: false, description: "Fee for laboratory reagents and tools" },
      { name: "Computer Facility Fee", amount: 2000, term: 1, studentGroup: "CBC", isRecurring: true, description: "Timetable computer access fee" }
    ],
    feePayments: [
      { studentName: "Caleb Otieno", amount: 20000, method: "mpesa", status: "completed", mpesaReceiptNumber: "MPR981245A", mpesaPhoneNumber: "0712345678", transactionDate: "2026-05-01T08:30:00Z", recordedBy: "System", notes: "Tuition fee paid in full", term: 1, feeName: "JSS Term 1 Tuition" },
      { studentName: "Mercy Chepkoech", amount: 25500, method: "bank_transfer", status: "completed", transactionDate: "2026-05-02T11:00:00Z", recordedBy: "System", notes: "Full payment of all Term 1 JSS fees", term: 1, feeName: "JSS Term 1 Tuition" },
      { studentName: "David Ndwiga", amount: 10000, method: "mpesa", status: "completed", mpesaReceiptNumber: "MPR492019C", mpesaPhoneNumber: "0734567890", transactionDate: "2026-05-03T16:00:00Z", recordedBy: "System", notes: "Half tuition deposit", term: 1, feeName: "JSS Term 1 Tuition" }
    ]
  },
  highschool: {
    students: [
      {
        name: "Collins Kipruto",
        grade: "F4",
        lot: "2026",
        subject: "Physics",
        studentGroup: "High School",
        competencies: { physics_foundations: 4, physics_practical: 3, physics_advanced: 3, physics_assessment: 4 },
        attendancePct: 96,
        attendanceHistory: [],
        notes: ["Excellent physics calculations.", "Aspirant for engineering at university."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-7712-HS",
        upi: "UPI-38291-HS",
        kcpeMarks: 380,
        kcseGrade: "B+",
        guardianName: "John Kipruto",
        guardianPhone: "0711112222",
        address: "Kapsabet, Nandi",
        email: "collins.kipruto@prism.ac.ke"
      },
      {
        name: "Amina Yusuf",
        grade: "F3",
        lot: "2026",
        subject: "Chemistry",
        studentGroup: "High School",
        competencies: { chemistry_foundations: 3, chemistry_practical: 3, chemistry_advanced: 2, chemistry_assessment: 3 },
        attendancePct: 98,
        attendanceHistory: [],
        notes: ["Top performer in volumetric analysis labs.", "Highly focused student."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-3921-HS",
        upi: "UPI-48102-HS",
        kcpeMarks: 365,
        guardianName: "Yusuf Ali",
        guardianPhone: "0722223333",
        address: "Majengo, Mombasa",
        email: "amina.yusuf@prism.ac.ke"
      },
      {
        name: "Kelvin Mwangi",
        grade: "F2",
        lot: "2026",
        subject: "Biology",
        studentGroup: "High School",
        competencies: { biology_foundations: 3, biology_practical: 2, biology_advanced: 2, biology_assessment: 3 },
        attendancePct: 90,
        attendanceHistory: [],
        notes: ["Keen in microscopy.", "Needs to improve punctuality during morning preps."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-4890-HS",
        upi: "UPI-19283-HS",
        kcpeMarks: 340,
        guardianName: "Moses Mwangi",
        guardianPhone: "0733334444",
        address: "Kariokor, Nairobi",
        email: "kelvin.mwangi@prism.ac.ke"
      },
      {
        name: "Faith Mutua",
        grade: "F1",
        lot: "2026",
        subject: "Mathematics",
        studentGroup: "High School",
        competencies: { mathematics_foundations: 4, mathematics_practical: 3, mathematics_advanced: 4, mathematics_assessment: 4 },
        attendancePct: 99,
        attendanceHistory: [],
        notes: ["Exceptional scores in algebra tests.", "Demonstrates disciplined leadership."],
        assessment: { units: {}, termStats: [] },
        nemisNumber: "NMS-9021-HS",
        upi: "UPI-10298-HS",
        kcpeMarks: 395,
        guardianName: "Anna Mutua",
        guardianPhone: "0744445555",
        address: "Machakos Town, Machakos",
        email: "faith.mutua@prism.ac.ke"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "08:00", durationMinutes: 60, grade: "F4", studentGroup: "High School", subject: "Mathematics", status: "Pending" },
      { dayOfWeek: 1, startTime: "11:00", durationMinutes: 60, grade: "F3", studentGroup: "High School", subject: "Chemistry", status: "Pending" },
      { dayOfWeek: 2, startTime: "10:00", durationMinutes: 60, grade: "F4", studentGroup: "High School", subject: "Physics", status: "Pending" },
      { dayOfWeek: 3, startTime: "08:00", durationMinutes: 60, grade: "F2", studentGroup: "High School", subject: "Biology", status: "Pending" },
      { dayOfWeek: 4, startTime: "11:00", durationMinutes: 60, grade: "F3", studentGroup: "High School", subject: "Business Studies", status: "Pending" },
      { dayOfWeek: 5, startTime: "09:00", durationMinutes: 60, grade: "F1", studentGroup: "High School", subject: "English", status: "Pending" }
    ],
    resources: [
      { id: "r_hs_chem", name: "High School Chemistry Lab", type: "room", capacity: 40, location: "Science Block, Ground Floor", status: "available", notes: "Equipped for KCSE chemistry titrations" },
      { id: "r_hs_physics", name: "High School Physics Lab", type: "room", capacity: 35, location: "Science Block, Floor 1", status: "available", notes: "Solenoid, resistors, and mechanics kits" },
      { id: "r_hs_bio", name: "High School Biology Lab", type: "room", capacity: 40, location: "Science Block, Floor 2", status: "available", notes: "Staining materials, slide catalogs, model skeletons" }
    ],
    feeStructures: [
      { name: "Tuition Fee Term 1 (Secondary)", amount: 28000, term: 1, studentGroup: "High School", isRecurring: true, description: "Secondary school termly tuition rate" },
      { name: "Science Lab & Chemicals Fee", amount: 4000, term: 1, studentGroup: "High School", isRecurring: false, description: "Science laboratory maintenance fund" },
      { name: "School Bus Transport", amount: 6000, term: 1, studentGroup: "High School", isRecurring: true, description: "Transport fee for commuters" }
    ],
    feePayments: [
      { studentName: "Collins Kipruto", amount: 38000, method: "bank_transfer", status: "completed", transactionDate: "2026-05-01T08:00:00Z", recordedBy: "System", notes: "Paid full Term 1 fees with transport included", term: 1, feeName: "Tuition Fee Term 1 (Secondary)" },
      { studentName: "Amina Yusuf", amount: 28000, method: "mpesa", status: "completed", mpesaReceiptNumber: "MPR382910G", mpesaPhoneNumber: "0722223333", transactionDate: "2026-05-02T14:20:00Z", recordedBy: "System", notes: "Tuition installment", term: 1, feeName: "Tuition Fee Term 1 (Secondary)" }
    ]
  },
  tvet: {
    students: [
      {
        name: "Brian Omondi",
        grade: "L4",
        lot: "2025",
        subject: "Solar PV Installation",
        studentGroup: "Academy",
        competencies: { safety: 3, tools: 2, principles: 1, installation: 1, maintenance: 2 },
        attendancePct: 95,
        attendanceHistory: [],
        notes: ["Shows strong leadership skills in group tasks.", "Very diligent in workshop safety practice."],
        assessment: { units: {}, termStats: [] },
        nitaNumber: "N-8942",
        epraLicenseStatus: "T1",
        admissionNumber: "ADM-TVET-2025-001",
        nationalId: "39201948",
        guardianName: "Paul Omondi",
        guardianPhone: "0711001100",
        address: "Kawangware, Nairobi",
        email: "brian.omondi@prism.ac.ke"
      },
      {
        name: "Sarah Wanjiku",
        grade: "L5",
        lot: "2025",
        subject: "Solar PV Installation",
        studentGroup: "Academy",
        competencies: { safety: 4, tools: 4, principles: 3, installation: 2, maintenance: 3 },
        attendancePct: 98,
        attendanceHistory: [],
        notes: ["Highly organized.", "Scores distinction grades in core modular exams."],
        assessment: { units: {}, termStats: [] },
        nitaNumber: "N-2384",
        epraLicenseStatus: "T2",
        admissionNumber: "ADM-TVET-2025-002",
        nationalId: "38920194",
        guardianName: "Esther Wanjiku",
        guardianPhone: "0722002200",
        address: "Uthiru, Nairobi",
        email: "sarah.wanjiku@prism.ac.ke"
      },
      {
        name: "Kevin Kamau",
        grade: "L3",
        lot: "2024",
        subject: "Electrical Wiring",
        studentGroup: "Academy",
        competencies: { safety: 2, tools: 2, principles: 1, installation: 1, maintenance: 1 },
        attendancePct: 65,
        attendanceHistory: [],
        notes: ["Frequently late. Needs guidance counseling to improve academic focus."],
        assessment: { units: {}, termStats: [] },
        epraLicenseStatus: "None",
        admissionNumber: "ADM-TVET-2024-098",
        nationalId: "41029381",
        guardianName: "Peter Kamau",
        guardianPhone: "0733003300",
        address: "Kangemi, Nairobi",
        email: "kevin.kamau@prism.ac.ke"
      },
      {
        name: "Jane Doe",
        grade: "L6",
        lot: "2025",
        subject: "ICT Support Basics",
        studentGroup: "Academy",
        competencies: { hardware: 3, software: 4, typing: 2, formatting: 3, data: 2 },
        attendancePct: 92,
        attendanceHistory: [],
        notes: ["Great understanding of network subnetting.", "Polite peer tutor."],
        assessment: { units: {}, termStats: [] },
        admissionNumber: "ADM-TVET-2025-015",
        nationalId: "39810293",
        guardianName: "Robert Doe",
        guardianPhone: "0744004400",
        address: "Kilimani, Nairobi",
        email: "jane.doe@prism.ac.ke"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "09:00", durationMinutes: 60, grade: "L4", studentGroup: "Academy", subject: "Solar PV Installation", status: "Pending" },
      { dayOfWeek: 2, startTime: "11:00", durationMinutes: 90, grade: "L5", studentGroup: "Academy", subject: "ICT Support Basics", status: "Pending" },
      { dayOfWeek: 3, startTime: "14:00", durationMinutes: 90, grade: "L4", studentGroup: "Academy", subject: "Electrical Wiring", status: "Pending" },
      { dayOfWeek: 4, startTime: "09:00", durationMinutes: 60, grade: "L3", studentGroup: "Academy", subject: "Electrical Wiring", status: "Pending" },
      { dayOfWeek: 5, startTime: "10:00", durationMinutes: 120, grade: "L4", studentGroup: "Academy", subject: "Solar PV Installation", status: "Pending" }
    ],
    resources: [
      { id: "r_solar_lab", name: "Solar Power Lab", type: "room", capacity: 20, location: "Block B, Room 102", status: "available", notes: "Fitted with rooftop solar panel connections and mounting boards" },
      { id: "r_elec_workshop", name: "Electrical Workshop", type: "room", capacity: 25, location: "Block B, Room 101", status: "available", notes: "Wiring boards, testing multimeters, insulation kits" },
      { id: "r_tvet_comp", name: "TVET Computer Lab", type: "room", capacity: 30, location: "Block D, Floor 1", status: "available", notes: "Crimping tools, LAN switches, routers, and PCs" }
    ],
    feeStructures: [
      { name: "TVET Module 1 Tuition", amount: 35000, term: 1, studentGroup: "Academy", isRecurring: true, description: "Core academic instruction fee per term" },
      { name: "Practical Workshop Materials", amount: 8000, term: 1, studentGroup: "Academy", isRecurring: true, description: "Cables, tools wear, and components" },
      { name: "Exam Registration Fee", amount: 5000, term: 1, studentGroup: "Academy", isRecurring: false, description: "National CDACC examination fees" }
    ],
    feePayments: [
      { studentName: "Brian Omondi", amount: 43000, method: "mpesa", status: "completed", mpesaReceiptNumber: "MPR903129K", mpesaPhoneNumber: "0711001100", transactionDate: "2026-05-01T09:00:00Z", recordedBy: "System", notes: "Full payment for tuition + materials", term: 1, feeName: "TVET Module 1 Tuition" },
      { studentName: "Sarah Wanjiku", amount: 48000, method: "bank_transfer", status: "completed", transactionDate: "2026-05-02T11:00:00Z", recordedBy: "System", notes: "Module 1 Fees fully settled including exam", term: 1, feeName: "TVET Module 1 Tuition" }
    ]
  },
  nita: {
    students: [
      {
        name: "Silas Kipkemboi",
        grade: "L3",
        lot: "2026",
        subject: "Solar PV Installer",
        studentGroup: "Academy",
        competencies: { basic_electronics: 3, pv_module_sizing_mounting: 2, batteries_inverters_wiring: 2, trade_test_practical: 1 },
        attendancePct: 94,
        attendanceHistory: [],
        notes: ["Strong mechanical dexterity.", "Needs additional practice in inverter wiring configs."],
        assessment: { units: {}, termStats: [] },
        nitaNumber: "NITA-2025-01",
        epraLicenseStatus: "None",
        admissionNumber: "NITA-SOL-01",
        nationalId: "39201948",
        guardianName: "Joel Kipkemboi",
        guardianPhone: "0711999888",
        address: "Kapsabet Town, Nandi",
        email: "silas.kipkemboi@prism.ac.ke"
      },
      {
        name: "Prudence Nyawira",
        grade: "L4",
        lot: "2026",
        subject: "Electrical Wireman",
        studentGroup: "Academy",
        competencies: { safety_cable_theory: 4, domestic_wiring_systems: 3, testing_commissioning: 3 },
        attendancePct: 98,
        attendanceHistory: [],
        notes: ["Excellent safety protocols execution.", "Passed mock testing and commissioning checks cleanly."],
        assessment: { units: {}, termStats: [] },
        nitaNumber: "NITA-2025-09",
        epraLicenseStatus: "T1",
        admissionNumber: "NITA-ELEC-02",
        nationalId: "38920102",
        guardianName: "Alice Nyawira",
        guardianPhone: "0722999888",
        address: "Karatina, Nyeri",
        email: "prudence.nyawira@prism.ac.ke"
      },
      {
        name: "Dennis Mutegi",
        grade: "L5",
        lot: "2026",
        subject: "Electrical Wireman",
        studentGroup: "Academy",
        competencies: { safety_cable_theory: 4, domestic_wiring_systems: 4, testing_commissioning: 4 },
        attendancePct: 97,
        attendanceHistory: [],
        notes: ["Master electrician candidate.", "Consistently leads practical board wire installations."],
        assessment: { units: {}, termStats: [] },
        nitaNumber: "NITA-2024-55",
        epraLicenseStatus: "T2",
        admissionNumber: "NITA-ELEC-01",
        nationalId: "37482910",
        guardianName: "Peter Mutegi",
        guardianPhone: "0733999888",
        address: "Chuka Town, Tharaka Nithi",
        email: "dennis.mutegi@prism.ac.ke"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "08:00", durationMinutes: 240, grade: "L3", studentGroup: "Academy", subject: "Solar PV Installer", status: "Pending" },
      { dayOfWeek: 3, startTime: "08:00", durationMinutes: 240, grade: "L4", studentGroup: "Academy", subject: "Electrical Wireman", status: "Pending" },
      { dayOfWeek: 5, startTime: "13:00", durationMinutes: 240, grade: "L5", studentGroup: "Academy", subject: "Electrical Wireman", status: "Pending" }
    ],
    resources: [
      { id: "r_nita_bay_a", name: "Trade Testing Bay A", type: "room", location: "Main Hangar, Bay A", status: "available", notes: "Contains simulated brick walls for domestic conduit installations" },
      { id: "r_nita_bay_b", name: "Trade Testing Bay B", type: "room", location: "Main Hangar, Bay B", status: "available", notes: "Configured for Solar PV installation assessment setups" },
      { id: "r_megger_kit", name: "Megger Insulation Tester Kits", type: "equipment", status: "available", notes: "Used for high-voltage loop impedance testing" }
    ],
    feeStructures: [
      { name: "Trade Test Registration Fee", amount: 8500, term: 1, studentGroup: "Academy", isRecurring: false, description: "NITA trade testing registration administrative fee" },
      { name: "Workshop Safety Wear", amount: 3000, term: 1, studentGroup: "Academy", isRecurring: false, description: "Protective boots, overalls and helmets" },
      { name: "NITA Tool Kit Rental", amount: 2000, term: 1, studentGroup: "Academy", isRecurring: true, description: "Screwdrivers, crimpers, and testers kit" }
    ],
    feePayments: [
      { studentName: "Silas Kipkemboi", amount: 13500, method: "mpesa", status: "completed", mpesaReceiptNumber: "NTA892019K", mpesaPhoneNumber: "0711999888", transactionDate: "2026-05-01T08:00:00Z", recordedBy: "System", notes: "Full NITA registration + wear + tools package paid", term: 1, feeName: "Trade Test Registration Fee" },
      { studentName: "Prudence Nyawira", amount: 13500, method: "bank_transfer", status: "completed", transactionDate: "2026-05-02T10:00:00Z", recordedBy: "System", notes: "Paid full NITA test suite", term: 1, feeName: "Trade Test Registration Fee" }
    ]
  },
  university: {
    students: [
      {
        name: "Ryan Muli",
        grade: "Y3",
        lot: "2025",
        subject: "Computer Science",
        studentGroup: "Campus",
        competencies: { computer_science_basics: 4, computer_science_practical: 4, computer_science_advanced: 3, computer_science_assessment: 4 },
        attendancePct: 96,
        attendanceHistory: [],
        notes: ["Advanced programmer in Java & Python.", "Assists peers during lab sessions."],
        assessment: { units: {}, termStats: [] },
        admissionNumber: "C026-01-1234/2023",
        nationalId: "39824712",
        guardianName: "Mark Muli",
        guardianPhone: "0711333444",
        address: "Syokimau, Machakos",
        email: "ryan.muli@prism.ac.ke"
      },
      {
        name: "Elsa Chelimo",
        grade: "Y4",
        lot: "2024",
        subject: "Medicine & Surgery",
        studentGroup: "Campus",
        competencies: { medicine___surgery_basics: 4, medicine___surgery_practical: 4, medicine___surgery_advanced: 4, medicine___surgery_assessment: 4 },
        attendancePct: 99,
        attendanceHistory: [],
        notes: ["Excellent clinical skills during hospital rotations.", "Very high attention to details."],
        assessment: { units: {}, termStats: [] },
        admissionNumber: "M112-09-5678/2022",
        nationalId: "38712345",
        guardianName: "Grace Chelimo",
        guardianPhone: "0722333444",
        address: "Elgon View, Eldoret",
        email: "elsa.chelimo@prism.ac.ke"
      },
      {
        name: "George Ndegwa",
        grade: "Y2",
        lot: "2026",
        subject: "Business Administration",
        studentGroup: "Campus",
        competencies: { business_administration_basics: 3, business_administration_practical: 3, business_administration_advanced: 2, business_administration_assessment: 3 },
        attendancePct: 93,
        attendanceHistory: [],
        notes: ["Shows great management insight.", "Highly collaborative during business pitch exercises."],
        assessment: { units: {}, termStats: [] },
        admissionNumber: "B050-02-9876/2024",
        nationalId: "41234567",
        guardianName: "David Ndegwa",
        guardianPhone: "0733333444",
        address: "Thika Greens, Kiambu",
        email: "george.ndegwa@prism.ac.ke"
      },
      {
        name: "Anita Kerubo",
        grade: "Y1",
        lot: "2026",
        subject: "Mechanical Engineering",
        studentGroup: "Campus",
        competencies: { mechanical_engineering_basics: 3, mechanical_engineering_practical: 2, mechanical_engineering_advanced: 2, mechanical_engineering_assessment: 3 },
        attendancePct: 95,
        attendanceHistory: [],
        notes: ["Enthusiastic about thermodynamics labs.", "Good spatial drawing skills."],
        assessment: { units: {}, termStats: [] },
        admissionNumber: "E030-01-3456/2025",
        nationalId: "42345678",
        guardianName: "Jane Kerubo",
        guardianPhone: "0744333444",
        address: "Kisii Highway, Kisii",
        email: "anita.kerubo@prism.ac.ke"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "11:00", durationMinutes: 120, grade: "Y3", studentGroup: "Campus", subject: "Computer Science", status: "Pending" },
      { dayOfWeek: 2, startTime: "08:00", durationMinutes: 120, grade: "Y1", studentGroup: "Campus", subject: "Mechanical Engineering", status: "Pending" },
      { dayOfWeek: 3, startTime: "10:00", durationMinutes: 120, grade: "Y2", studentGroup: "Campus", subject: "Business Administration", status: "Pending" },
      { dayOfWeek: 4, startTime: "14:00", durationMinutes: 180, grade: "Y4", studentGroup: "Campus", subject: "Medicine & Surgery", status: "Pending" },
      { dayOfWeek: 5, startTime: "09:00", durationMinutes: 120, grade: "Y3", studentGroup: "Campus", subject: "Computer Science", status: "Pending" }
    ],
    resources: [
      { id: "r_lh_4b", name: "Lecture Hall 4B", type: "room", capacity: 150, location: "Science Complex, Floor 4", status: "available", notes: "Equipped with overhead projector and microphones" },
      { id: "r_anatomy_lab", name: "Human Anatomy Lab", type: "room", capacity: 40, location: "Medical Faculty, Ground Floor", status: "available", notes: "Surgical tables, modeling setups, specimen storage" },
      { id: "r_eng_workshop", name: "Engineering Workshop 3", type: "room", capacity: 50, location: "Engineering Block, Ground Floor", status: "available", notes: "Fitted with lathes, metal benders and thermodynamics modules" },
      { id: "r_comp_lab_2", name: "Computer Lab 2 (Unix Lab)", type: "room", capacity: 80, location: "School of Computing, Floor 2", status: "available", notes: "High performance clients, CentOS installations" }
    ],
    feeStructures: [
      { name: "Semester 1 Tuition Fee", amount: 65000, term: 1, studentGroup: "Campus", isRecurring: true, description: "Basic Tuition fees per academic semester" },
      { name: "University Student Union (KUSA)", amount: 1000, term: 1, studentGroup: "Campus", isRecurring: true, description: "Student association subscription" },
      { name: "Library & ICT Infrastructure", amount: 5000, term: 1, studentGroup: "Campus", isRecurring: true, description: "Digital access and physical library levy" }
    ],
    feePayments: [
      { studentName: "Ryan Muli", amount: 71000, method: "bank_transfer", status: "completed", transactionDate: "2026-05-01T08:00:00Z", recordedBy: "System", notes: "Paid tuition + union + library in full", term: 1, feeName: "Semester 1 Tuition Fee" },
      { studentName: "Elsa Chelimo", amount: 71000, method: "bank_transfer", status: "completed", transactionDate: "2026-05-02T10:15:00Z", recordedBy: "System", notes: "Full semester 1 fee package paid", term: 1, feeName: "Semester 1 Tuition Fee" },
      { studentName: "George Ndegwa", amount: 35000, method: "mpesa", status: "completed", mpesaReceiptNumber: "UNI394810X", mpesaPhoneNumber: "0733333444", transactionDate: "2026-05-03T13:40:00Z", recordedBy: "System", notes: "Tuition installment", term: 1, feeName: "Semester 1 Tuition Fee" }
    ]
  },
  custom: {
    students: [
      {
        name: "Brian Omondi",
        grade: "L3",
        lot: "2025",
        subject: "Solar PV Installation",
        studentGroup: "Academy",
        competencies: { safety: 3, tools: 2, principles: 1, installation: 1, maintenance: 2 },
        attendancePct: 95,
        attendanceHistory: [],
        notes: ["Shows strong leadership skills in group tasks."],
        assessment: { units: {}, termStats: [] },
        nitaNumber: "N-8942",
        epraLicenseStatus: "T1",
        admissionNumber: "ADM-001"
      },
      {
        name: "Jane Doe",
        grade: "L4",
        lot: "2025",
        subject: "ICT Support Basics",
        studentGroup: "Academy",
        competencies: { hardware: 3, software: 4, typing: 2, formatting: 3, data: 2 },
        attendancePct: 92,
        attendanceHistory: [],
        notes: [],
        assessment: { units: {}, termStats: [] },
        admissionNumber: "ADM-004"
      }
    ],
    schedule: [
      { dayOfWeek: 1, startTime: "09:00", durationMinutes: 60, grade: "L3", studentGroup: "Academy", subject: "Solar PV Installation", status: "Pending" },
      { dayOfWeek: 1, startTime: "11:00", durationMinutes: 60, grade: "L4", studentGroup: "Academy", subject: "ICT Support Basics", status: "Pending" }
    ],
    resources: [
      { id: "r_classroom_a", name: "Classroom A", type: "room", capacity: 30, status: "available" },
      { id: "r_solar_lab", name: "Solar Lab", type: "room", capacity: 15, status: "available" }
    ],
    feeStructures: [
      { name: "Term 1 Tuition", amount: 25000, term: 1, studentGroup: "Academy", isRecurring: true, description: "Generic tuition rate" }
    ],
    feePayments: [
      { studentName: "Brian Omondi", amount: 25000, method: "mpesa", status: "completed", mpesaReceiptNumber: "MPR981923J", mpesaPhoneNumber: "0711001100", transactionDate: "2026-05-01T09:00:00Z", recordedBy: "System", notes: "Fees paid in full", term: 1, feeName: "Term 1 Tuition" }
    ]
  }
};
