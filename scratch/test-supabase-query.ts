import { createServerSupabaseClient } from '../lib/supabase-server.js';

async function run() {
  const supabase = await createServerSupabaseClient();
  
  console.log("Running cohorts query...");
  const cohortsRes = await supabase
    .from('cohorts')
    .select(`
      id, name, location, current_module, status,
      instructor:instructors(full_name),
      students(id, attendance_rate, average_score)
    `)
    .eq('status', 'ACTIVE');
  console.log("Cohorts Res Error:", cohortsRes.error);
  
  console.log("Running inventory query...");
  const inventoryRes = await supabase
    .from('equipment_inventory')
    .select('*')
    .lt('available_qty', 'low_stock_threshold');
  console.log("Inventory Res Error:", inventoryRes.error);

  console.log("Running assessments query...");
  const assessmentsRes = await supabase
    .from('assessments')
    .select(`
      score, module_name, graded_at,
      student:students(full_name)
    `)
    .order('graded_at', { ascending: false })
    .limit(10);
  console.log("Assessments Res Error:", assessmentsRes.error);
}

run();
