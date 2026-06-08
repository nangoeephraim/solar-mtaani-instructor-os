const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qiyanhlrstbczzpmivnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeWFuaGxyc3RiY3p6cG1pdm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTc2NTIsImV4cCI6MjA4NzM3MzY1Mn0.zLZW6IlCbZH2xb0zMxROFjWvlRZ1EWGiyYWeuuUZHV4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  console.log("1. Querying cohorts with relation...");
  const q1 = await supabase
    .from('cohorts')
    .select(`
      id, name, location, current_module, status,
      instructor:instructors(full_name),
      students(id, attendance_rate, average_score)
    `);
  if (q1.error) {
    console.error("Cohort query failed:", q1.error.message);
  } else {
    console.log("Cohort query success! Data:", JSON.stringify(q1.data, null, 2));
  }

  console.log("2. Querying students for stats...");
  const q2 = await supabase.from('students').select('id, attendance_rate, average_score');
  if (q2.error) {
    console.error("Students query failed:", q2.error.message);
  } else {
    console.log("Students query success! Data:", q2.data);
  }
}
testQueries();
