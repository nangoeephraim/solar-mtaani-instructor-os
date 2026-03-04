// Temporary migration script - run with: node scripts/run_migration.mjs
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qiyanhlrstbczzpmivnn.supabase.co';
const supabaseKey = 'sb_publishable_pnn7KVBBm6qnlY-mmvsqeA_mIGgx4Ra';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Running schedule_slots column migration...');

    // Use rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `
      ALTER TABLE public.schedule_slots
        ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'L3',
        ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Solar',
        ADD COLUMN IF NOT EXISTS student_group TEXT DEFAULT 'Academy',
        ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
        ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
    `
    });

    if (error) {
        console.error('RPC exec_sql not available. This is expected if it does not exist.');
        console.error('Error:', error.message);
        console.log('\n--- Trying direct column test instead ---');

        // Test if columns already exist by doing a select
        const { data: testData, error: testError } = await supabase
            .from('schedule_slots')
            .select('id, grade, subject, student_group, duration_minutes, status')
            .limit(1);

        if (testError) {
            console.error('Columns do NOT exist yet. Error:', testError.message);
            console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:');
            console.log(`
ALTER TABLE public.schedule_slots
  ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'L3',
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Solar',
  ADD COLUMN IF NOT EXISTS student_group TEXT DEFAULT 'Academy',
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
      `);
        } else {
            console.log('✅ Columns already exist! Sample:', testData);
        }
    } else {
        console.log('✅ Migration completed successfully!', data);
    }
}

runMigration();
