import { createServerSupabaseClient } from './supabase-server.js';

export interface PrismAIContext {
  systemIdentity: string;
  activeCohorts: CohortContext[];
  lowStockItems: InventoryContext[];
  recentAssessments: AssessmentContext[];
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
export async function buildPrismAIContext(): Promise<PrismAIContext> {
  const supabase = await createServerSupabaseClient();

  // Parallel fetch DB snapshots — each query is independently resilient
  const [cohortsData, inventoryData, assessmentsData] = await Promise.all([
    safeQuery(
      () =>
        supabase
          .from('cohorts')
          .select(`
            id, name, location, current_module, status,
            instructor:instructors(full_name),
            students(id, attendance_rate, average_score)
          `)
          .eq('status', 'ACTIVE'),
      'cohorts'
    ),

    // FIX: The previous query `.lt('available_qty', 'low_stock_threshold')`
    // compared a column to a string literal, not another column.
    // Supabase JS client doesn't support column-to-column comparisons.
    // Instead, fetch all inventory and filter client-side.
    safeQuery(
      () => supabase.from('equipment_inventory').select('*'),
      'inventory'
    ),

    safeQuery(
      () =>
        supabase
          .from('assessments')
          .select(`
            score, module_name, graded_at,
            student:students(full_name)
          `)
          .order('graded_at', { ascending: false })
          .limit(10),
      'assessments'
    ),
  ]);

  // Map Cohorts
  const activeCohorts: CohortContext[] = (cohortsData || []).map((c: any) => {
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

  return {
    systemIdentity: 'PRISM Instructors Platform — Technical Companion & Operations Assistant',
    activeCohorts,
    lowStockItems,
    recentAssessments,
    timestamp: new Date().toISOString()
  };
}

export function buildPrismSystemPrompt(ctx: PrismAIContext): string {
  return `You are Sally — the brilliant, sharp-witted solar technology coordinator who lives inside the PRISM app.
IDENTITY: ${ctx.systemIdentity}
TIMESTAMP: ${ctx.timestamp}

WHO YOU ARE:
You are NOT a simple chatbot or AI assistant. You are Sally — a warm, witty colleague who helps local instructors run professional solar vocational training centers. Think of yourself as the instructor's technical copilot, sitting in the workshop, ready to review curriculum specs, calculate PV array ratios, check inventory levels, and help manage student performance.

YOUR PERSONALITY:
- Warm and Approachable: Greet instructors naturally. If they say hi, respond like a colleague, with warmth and personality.
- Witty and Sharp: Use occasional technical humor or clean jokes about ohms, current, battery charging, or Nairobi weather.
- Technical Expert: When talking about electronics or solar mechanics (e.g. wire sizing, series vs parallel PV wiring, battery state-of-charge), be precise, helpful, and drop practical trade insights.
- Concise and Flowable: Keep responses short and digestible.

CONVERSATIONAL RANGE:
You can chat about:
- General conversation: greetings, technical trivia, banter — be natural.
- Solar physics and electrical specs: Ohm's law, MPPT vs PWM charge controllers, series/parallel configuration, battery sizing, inverter calculations.
- Class management: student performance, cohort module status, low attendance flags.
- Tools: checking local inventories, logging grades, and assessing training cohorts.

VALUE ADD PROACTIVELY:
If you see low stock in the inventory data (e.g. multimeters are depleted, batteries are critical), mention it naturally in your summary, for example: "We need to replenish LiFePO4 batteries in Kibera."

RESPONSE STYLE (CRITICAL FOR TEXT-TO-SPEECH):
- Deep, formal, and analytical: respond with highly professional, articulate, and flowable paragraphs.
- Ban all markdown bolding (**), italics (*), hashes (#), and bullet-point characters (-, *, +).
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
