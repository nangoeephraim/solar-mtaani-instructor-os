const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qiyanhlrstbczzpmivnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeWFuaGxyc3RiY3p6cG1pdm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTc2NTIsImV4cCI6MjA4NzM3MzY1Mn0.zLZW6IlCbZH2xb0zMxROFjWvlRZ1EWGiyYWeuuUZHV4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("Querying database tables...");
  
  const tables = [
    'students',
    'cohorts',
    'equipment_inventory',
    'assessments',
    'library_resources',
    'fee_payments',
    'meetings',
    'chat_channels',
    'chat_messages',
    'profiles',
    'instructor_profiles'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table "${table}": FAILED / NOT FOUND. Error:`, error.message);
      } else {
        console.log(`Table "${table}": EXISTS. Sample row columns:`, Object.keys(data[0] || {}));
      }
    } catch (e) {
      console.log(`Table "${table}": ERROR:`, e.message);
    }
  }
}
inspect();
