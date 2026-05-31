import { createClient } from '@supabase/supabase-js';

/**
 * Creates a server-side Supabase client for use in API routes
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qiyanhlrstbczzpmivnn.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pnn7KVBBm6qnlY-mmvsqeA_mIGgx4Ra';
  return createClient(supabaseUrl, supabaseKey);
}
