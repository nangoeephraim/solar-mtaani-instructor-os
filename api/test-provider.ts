// Vercel Serverless Function Configuration
export const maxDuration = 60;

export default async function handler(req: Request) {
  try {
    console.log("Entering test-provider handler...");
    const start = Date.now();

    // Resolve providers directly from env vars (fast, no DB query)
    const providerMap = [
      { provider: 'groq', envKey: 'GROQ_API_KEY' },
      { provider: 'cerebras', envKey: 'CEREBRAS_API_KEY' },
      { provider: 'openrouter', envKey: 'OPENROUTER_API_KEY' },
      { provider: 'google', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY' },
    ];

    // Ensure Gemini alias is checked
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
    }

    const resolved = providerMap.map(p => ({
      provider: p.provider,
      hasKey: !!process.env[p.envKey],
      keyLength: process.env[p.envKey] ? process.env[p.envKey]!.length : 0,
    }));

    const duration = Date.now() - start;

    return new Response(JSON.stringify({ 
      success: true, 
      durationMs: duration,
      providers: resolved,
      region: process.env.VERCEL_REGION || 'unknown',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("Test Provider failed:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
