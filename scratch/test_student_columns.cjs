const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qiyanhlrstbczzpmivnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeWFuaGxyc3RiY3p6cG1pdm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTc2NTIsImV4cCI6MjA4NzM3MzY1Mn0.zLZW6IlCbZH2xb0zMxROFjWvlRZ1EWGiyYWeuuUZHV4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumn(columnName) {
  const { error } = await supabase.from('students').select(columnName).limit(1);
  if (error) {
    if (error.message.includes('does not exist')) {
      console.log(`Column "${columnName}": DOES NOT EXIST (${error.message})`);
      return false;
    } else {
      console.log(`Column "${columnName}": ERROR (${error.message})`);
      return null;
    }
  } else {
    console.log(`Column "${columnName}": EXISTS`);
    return true;
  }
}

async function run() {
  const columnsToTest = [
    'id',
    'name',
    'grade',
    'subject',
    'attendance_pct',
    'lot',
    'student_group',
    'assessment',
    'attendance_history',
    'notes',
    'competencies',
    'created_at',
    'updated_at',
    'created_by',
    'attendance_rate',
    'average_score',
    'cohort_id'
  ];
  
  console.log("Testing columns on 'students' table:");
  for (const col of columnsToTest) {
    await testColumn(col);
  }
}

run();
