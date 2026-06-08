const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qiyanhlrstbczzpmivnn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeWFuaGxyc3RiY3p6cG1pdm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTc2NTIsImV4cCI6MjA4NzM3MzY1Mn0.zLZW6IlCbZH2xb0zMxROFjWvlRZ1EWGiyYWeuuUZHV4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
  console.log("Querying table columns via SQL...");
  const sql = `
    select table_name, column_name, data_type 
    from information_schema.columns 
    where table_schema = 'public' 
    order by table_name, ordinal_position;
  `;
  
  // Wait, does Supabase JS client let us run raw SQL directly?
  // No, unless we have a specific RPC like 'execute_sql' or we just query via PostgREST.
  // Since we can't run raw SQL easily via PostgREST without an RPC, let's try to query 'rpc' if we have execute_sql or we can just query pg_catalog tables via PostgREST? No, PostgREST doesn't expose pg_catalog by default.
  // Wait! Let's check if the database has an 'execute_sql' RPC or similar.
  // Alternatively, we can inspect columns by checking what error messages or columns we get,
  // or we can select a single row (or an empty select) from each table and look at what PostgREST tells us.
  // Wait! Can we inspect tables by doing select('*') on each table?
  // Let's try doing a select on each table and see what columns are returned or if we get an error!
  
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
    'instructor_profiles',
    'instructors'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`Table "${table}" error:`, error.message);
    } else {
      // Wait, how to get columns of empty result? We can select all columns using a select builder or look at postgrest metadata.
      // But wait! If we do .select('*'), the response doesn't contain column names if there are 0 rows.
      // Let's see if we can get columns by inserting a dummy row, or by selecting specific columns.
      // Actually, we can check if there are columns by selecting common names, or we can check if there's any data in these tables!
      // Let's query without limit to see if there is any data.
      const { data: fullData } = await supabase.from(table).select('*');
      if (fullData && fullData.length > 0) {
        console.log(`Table "${table}" has ${fullData.length} rows. Columns from first row:`, Object.keys(fullData[0]));
      } else {
        console.log(`Table "${table}" has 0 rows.`);
      }
    }
  }
}

inspectColumns();
