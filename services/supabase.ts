import { createClient } from '@supabase/supabase-js';

// Accessing environment variables in Vite
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase URL or Key is missing. Check your .env file.");
}

// Initialize the Supabase client with realtime resilience config
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseKey || 'placeholder-key',
    {
        realtime: {
            params: {
                eventsPerSecond: 20, // Allow higher event throughput for chat
            },
            heartbeatIntervalMs: 15000, // 15s heartbeat (default 30s) — faster stale detection
            reconnectAfterMs: (tries: number) => Math.min(tries * 500, 5000), // Exponential backoff, max 5s
            timeout: 20000, // 20s connection timeout
        },
    }
);

