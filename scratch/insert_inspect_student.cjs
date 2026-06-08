const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qiyanhlrstbczzpmivnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeWFuaGxyc3RiY3p6cG1pdm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTc2NTIsImV4cCI6MjA4NzM3MzY1Mn0.zLZW6IlCbZH2xb0zMxROFjWvlRZ1EWGiyYWeuuUZHV4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("Inserting dummy student...");
  const { data: inserted, error: insertError } = await supabase
    .from('students')
    .insert({ name: 'Dummy Inspector Temp' })
    .select();
    
  if (insertError) {
    console.error("Insert failed:", insertError.message);
    return;
  }
  
  console.log("Insert success!");
  console.log("Columns in students table:", Object.keys(inserted[0] || {}));
  console.log("Complete row values:", inserted[0]);
  
  console.log("Deleting dummy student...");
  const { error: deleteError } = await supabase
    .from('students')
    .delete()
    .eq('id', inserted[0].id);
    
  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
  } else {
    console.log("Delete success!");
  }
}

inspect();
