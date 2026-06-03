import { createServerSupabaseClient } from '../lib/supabase-server.ts';

async function run() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('sally_settings')
      .select('key, value');
    
    if (error) {
      console.error("Error fetching sally_settings:", error.message);
      return;
    }
    
    console.log("Settings found in database:");
    data.forEach(d => {
      // Obfuscate the value for display if it looks like a key
      const val = d.value;
      const obfuscated = val && val.length > 8 ? val.slice(0, 4) + '...' + val.slice(-4) : val;
      console.log(`- ${d.key}: ${obfuscated}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
