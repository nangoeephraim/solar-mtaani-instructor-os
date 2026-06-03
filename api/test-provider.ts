import { getPrioritizedProviderConfigs } from '../lib/aiProvider.js';

export default async function handler(req: Request) {
  try {
    console.log("Entering test-provider handler...");
    const start = Date.now();
    const configs = await getPrioritizedProviderConfigs();
    const duration = Date.now() - start;
    
    // Do not return raw API keys for security, just presence and length
    const resolved = configs.map(c => ({
      provider: c.provider,
      hasKey: !!c.apiKey,
      keyLength: c.apiKey ? c.apiKey.length : 0
    }));

    return new Response(JSON.stringify({ 
      success: true, 
      durationMs: duration,
      providers: resolved
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
