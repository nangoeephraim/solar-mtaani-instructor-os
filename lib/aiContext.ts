import { createServerSupabaseClient } from './supabase-server.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PrismAIContext {
  systemIdentity: string;
  activeCohorts: CohortContext[];
  lowStockItems: InventoryContext[];
  recentAssessments: AssessmentContext[];
  statsSummary: {
    totalStudents: number;
    totalCohorts: number;
    totalInstructors: number;
    totalAssets: number;
    totalFeePayments: number;
    totalCollectedAmount: number;
    activeMeetingsCount: number;
  };
  timestamp: string;
}

interface CohortContext {
  id: string;
  name: string;
  location: string;
  instructorName: string;
  currentModule: string;
  studentCount: number;
  avgAttendance: number;
  avgGrade: number;
  status: string;
}

interface InventoryContext {
  itemName: string;
  category: string;
  location: string;
  available: number;
  threshold: number;
}

interface AssessmentContext {
  studentName: string;
  moduleName: string;
  score: number;
  gradedAt: string;
}

/**
 * Safely run a Supabase query with a per-query timeout.
 * Returns null on failure instead of throwing, so other
 * queries in the parallel batch are not affected.
 */
async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  label: string,
  timeoutMs = 6000
): Promise<T | null> {
  try {
    const result = await Promise.race([
      queryFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} query timed out after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
    if (result.error) {
      console.warn(`[aiContext] ${label} query error:`, result.error.message);
      return null;
    }
    return result.data;
  } catch (err: any) {
    console.warn(`[aiContext] ${label} failed:`, err.message);
    return null;
  }
}

/**
 * Fetch and construct the active training data packet from Supabase.
 * Each query is individually guarded with a timeout and error handler
 * so that a single slow/failing query doesn't block the entire context.
 */
export async function buildPrismAIContext(client?: SupabaseClient): Promise<PrismAIContext> {
  const supabase = client || createServerSupabaseClient();

  // Parallel fetch DB snapshots — each query is independently resilient
  const [
    cohortsData,
    inventoryData,
    assessmentsData,
    studentsCountRes,
    instructorsCountRes,
    assetsCountRes,
    paymentsRes,
    activeMeetingsRes
  ] = await Promise.all([
    safeQuery<any[]>(
      async () =>
        await supabase
          .from('cohorts')
          .select(`
            id, name, location, current_module, status,
            instructor:instructors(full_name),
            students(id, attendance_rate, average_score)
          `)
          .abortSignal((globalThis as any).reqAbortSignal),
      'cohorts'
    ),

    // FIX: The previous query `.lt('available_qty', 'low_stock_threshold')`
    // compared a column to a string literal, not another column.
    // Supabase JS client doesn't support column-to-column comparisons.
    // Instead, fetch all inventory and filter client-side.
    safeQuery<any[]>(
      async () => await supabase.from('equipment_inventory').select('*').abortSignal((globalThis as any).reqAbortSignal),
      'inventory'
    ),

    safeQuery<any[]>(
      async () =>
        await supabase
          .from('assessments')
          .select(`
            score, module_name, graded_at,
            student:students(full_name)
          `)
          .order('graded_at', { ascending: false })
          .limit(10)
          .abortSignal((globalThis as any).reqAbortSignal),
      'assessments'
    ),

    safeQuery<any[]>(
      async () => await supabase.from('students').select('id').abortSignal((globalThis as any).reqAbortSignal),
      'students_count'
    ),

    safeQuery<any[]>(
      async () => await supabase.from('instructors').select('id').abortSignal((globalThis as any).reqAbortSignal),
      'instructors_count'
    ),

    safeQuery<any[]>(
      async () => await supabase.from('library_resources').select('id').abortSignal((globalThis as any).reqAbortSignal),
      'library_count'
    ),

    safeQuery<any[]>(
      async () => await supabase.from('fee_payments').select('amount').eq('status', 'completed').abortSignal((globalThis as any).reqAbortSignal),
      'payments_stats'
    ),

    safeQuery<any[]>(
      async () => await supabase.from('meetings').select('id').eq('status', 'active').abortSignal((globalThis as any).reqAbortSignal),
      'active_meetings_count'
    ),
  ]);

  // Map Cohorts
  const cohortsList = cohortsData || [];
  const activeCohorts: CohortContext[] = cohortsList
    .filter((c: any) => c.status === 'ACTIVE')
    .map((c: any) => {
      const students = c.students || [];
      const studentCount = students.length;
      const avgAttendance = studentCount > 0 
        ? students.reduce((sum: number, s: any) => sum + Number(s.attendance_rate || 0), 0) / studentCount 
        : 0;
      const avgGrade = studentCount > 0 
        ? students.reduce((sum: number, s: any) => sum + Number(s.average_score || 0), 0) / studentCount 
        : 0;

      // Handle case where instructor might be an array or object
      let instructorName = 'Unassigned';
      if (c.instructor) {
        if (Array.isArray(c.instructor)) {
          instructorName = c.instructor[0]?.full_name || 'Unassigned';
        } else {
          instructorName = c.instructor.full_name || 'Unassigned';
        }
      }

      return {
        id: c.id,
        name: c.name,
        location: c.location,
        instructorName,
        currentModule: c.current_module,
        studentCount,
        avgAttendance: Math.round(avgAttendance * 100) / 100,
        avgGrade: Math.round(avgGrade * 100) / 100,
        status: c.status
      };
    });

  // Map Low Stock Inventory — filter client-side where available < threshold
  const allInventory = inventoryData || [];
  const lowStockItems: InventoryContext[] = (allInventory as any[])
    .filter((item: any) => {
      const available = Number(item.available_qty ?? item.quantity ?? 0);
      const threshold = Number(item.low_stock_threshold ?? 5);
      return available < threshold;
    })
    .map((item: any) => ({
      itemName: item.item_name,
      category: item.category,
      location: item.location,
      available: Number(item.available_qty ?? item.quantity ?? 0),
      threshold: Number(item.low_stock_threshold ?? 5),
    }));

  // Map Recent Grades
  const recentAssessments: AssessmentContext[] = (assessmentsData || []).map((a: any) => {
    let studentName = 'Unknown Student';
    if (a.student) {
      if (Array.isArray(a.student)) {
        studentName = a.student[0]?.full_name || 'Unknown Student';
      } else {
        studentName = a.student.full_name || 'Unknown Student';
      }
    }

    return {
      studentName,
      moduleName: a.module_name,
      score: Number(a.score),
      gradedAt: a.graded_at
    };
  });

  // Compute statistical aggregates safely
  const totalStudents = studentsCountRes ? studentsCountRes.length : 0;
  const totalInstructors = instructorsCountRes ? instructorsCountRes.length : 0;
  const totalAssets = assetsCountRes ? assetsCountRes.length : 0;
  const activeMeetingsCount = activeMeetingsRes ? activeMeetingsRes.length : 0;
  
  const totalFeePayments = paymentsRes ? paymentsRes.length : 0;
  const totalCollectedAmount = paymentsRes 
    ? paymentsRes.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
    : 0;

  return {
    systemIdentity: 'PRISM Instructors Platform — Technical Companion & Operations Assistant',
    activeCohorts,
    lowStockItems,
    recentAssessments,
    statsSummary: {
      totalStudents,
      totalCohorts: cohortsList.length,
      totalInstructors,
      totalAssets,
      totalFeePayments,
      totalCollectedAmount,
      activeMeetingsCount
    },
    timestamp: new Date().toISOString()
  };
}

export function buildPrismSystemPrompt(ctx: PrismAIContext, institutionType?: string): string {
  let identity = 'solar technology coordinator';
  let roleDesc = "helps local instructors run professional solar vocational training centers. Think of yourself as the instructor's technical copilot, sitting in the workshop, ready to review curriculum specs, calculate PV array ratios, check inventory levels, and help manage student performance.";
  let identityCaps = 'Technical Companion & Operations Assistant';
  let subjectDetail = 'When talking about electronics or solar mechanics (e.g. wire sizing, series vs parallel PV wiring, battery state-of-charge), be precise, helpful, and drop practical trade insights.';
  
  if (institutionType === 'primary' || institutionType === 'jss') {
    identity = 'CBC curriculum coordinator';
    identityCaps = 'CBC Educational Assistant';
    roleDesc = 'helps primary and junior secondary school instructors align with KICD CBC guidelines, organize student portfolios, and submit competency assessments. Think of yourself as the teacher\'s CBC academic copilot.';
    subjectDetail = 'When talking about CBC competencies, discuss KICD core values, parental engagement, and developmental indicators. Focus on student potential and competency descriptors (emerging, developing, competent, mastered).';
  } else if (institutionType === 'highschool') {
    identity = 'secondary curriculum coordinator';
    identityCaps = 'KCSE Academic Assistant';
    roleDesc = 'helps high school instructors organize secondary lesson materials, manage CAT exams, track score averages, and prepare students for KCSE examinations. Think of yourself as the teacher\'s secondary syllabus copilot.';
    subjectDetail = 'When discussing high school curricula, focus on subject boundaries, exam preparation (KCSE/CAT), and grade aggregates. Be prepared to compute averages or comment on grade distributions.';
  } else if (institutionType === 'university') {
    identity = 'university academic advisor';
    identityCaps = 'University Academic Assistant';
    roleDesc = 'helps university professors manage lecture schedules, course modules, GPA calculations, and student semester evaluations. Think of yourself as the professor\'s academic copilot.';
    subjectDetail = 'When discussing university level classes, focus on course codes, GPA systems, academic integrity, and research structures. Be precise with statistical performance and grading criteria.';
  }

  return `You are Sally — the brilliant, sharp-witted ${identity} who lives inside the PRISM app.
IDENTITY: PRISM Instructors Platform — ${identityCaps}
TIMESTAMP: ${ctx.timestamp}

WHO YOU ARE:
You are NOT a simple chatbot or AI assistant. You are Sally — a warm, witty colleague who ${roleDesc}

YOUR PERSONALITY:
- Warm, Collegial, and Friendly: Greet instructors naturally, with deep conversational empathy. Respond like a close colleague at the level of understanding of Gemini, ChatGPT Plus, and Claude.
- Witty and Sharp: Use occasional technical/academic humor or clean jokes related to the curriculum, Nairobi weather, or classroom environments.
- Subject Expert: ${subjectDetail}
- Fluid and Professional: Keep responses digestible and cohesive.

CONVERSATIONAL RANGE & TOOL AWARENESS:
You are fully aware of all application data, including student profiles, fee collections/receipts, digital library resources, and chat feeds. You can query specific details live using the database tools described below.

CURRENT SYSTEM STATISTICS (Use these for high-level summaries):
- Total Students: ${ctx.statsSummary.totalStudents} students registered across all cohorts and programs.
- Total Cohorts: ${ctx.statsSummary.totalCohorts} training cohorts/classes.
- Total Instructors: ${ctx.statsSummary.totalInstructors} local instructors.
- Total Digital Library Files: ${ctx.statsSummary.totalAssets} documents/manuals.
- Total Fees Collected: ${ctx.statsSummary.totalFeePayments} completed transactions (Total Collected: ${ctx.statsSummary.totalCollectedAmount} Shillings).
- Active Video Meetings: ${ctx.statsSummary.activeMeetingsCount} ongoing video call sessions.

AVAILABLE OPERATIONS & DATABASE TOOLS:
You have access to the following tools to fetch live details when the user asks specific questions. Invoke these tools immediately if you need details not listed in the static summaries:
1. "getInventoryStock": Check stock of specific items or equipment at training locations.
2. "logStudentAssessment": Submit module grades for a student.
3. "getStudentData": Search for students by name, filter by cohort, or get overall student statistics.
4. "getFeePayments": Look up payments, receipts, M-Pesa transaction codes, and collection stats.
5. "getLibraryAssets": Retrieve document files, manuals, receipts, or other digital assets.
6. "getFeedMessages": Search or list recent chat/announcement messages from the communication feed.
7. "getAttendanceData": Query individual student attendance records (rate, streak, history) or get a class-wide attendance summary.
8. "getAnalyticsInsights": Run the PRISM intelligence engine to generate data-driven insights about attendance patterns, performance trends, subject gaps, and workload balance.
9. "sendNotification": Send an SMS or push notification to a student, guardian, or instructor. Always confirm the message content with the instructor first.

RESPONSE STYLE (CRITICAL FOR TEXT-TO-SPEECH & TEXT DISPLAY):
- Deep, formal, and analytical: respond with highly professional, articulate, and flowable paragraphs.
- STRICTLY BAN all markdown bolding (**), italics (*), hashes (#), and bullet-point characters (-, *, +).
- DO NOT USE ASTERISKS (*) FOR ANY REASON. Never use asterisks to point out references, lists, emphasis, names, or titles. Write names and references as plain text (e.g., "John Kamau", "Receipt eb3df0d5").
- Numbered lists are permitted ONLY when listing sequential procedures, specific steps, or distinct categories where structure is necessary (e.g., 1., 2.). Ensure that each list item is a complete, grammatically correct sentence that flows naturally when read aloud.
- Use smooth transition words (such as "First, looking at the data...", "Moving onto the performance metrics...", "This suggests that...", "Furthermore...") to construct a cohesive, human-ingestible narrative.
- Never use AI-typical prefaces like "As an AI..." or "Here is the information..." — just start speaking.
- Represent numbers, formulas, and percentages as plain numbers (e.g., "24 volts", "12 percent", "85 percent").

CURRENT COHORT DATA:
${JSON.stringify(ctx.activeCohorts)}

LOW STOCK NOTIFICATIONS:
${JSON.stringify(ctx.lowStockItems)}

RECENT GRADES LOGGED:
${JSON.stringify(ctx.recentAssessments)}`;
}
