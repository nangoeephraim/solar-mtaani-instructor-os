import { buildPrismAIContext } from '../lib/aiContext.js';
import { requireApiUser } from '../lib/supabase-server.js';

export default async function handler(req: Request) {
  const auth = await requireApiUser(req, { roles: ['admin'] });
  if ('response' in auth) return auth.response;

  try {
    const start = Date.now();
    const ctx = await buildPrismAIContext(auth.context.supabase);
    const duration = Date.now() - start;
    
    return new Response(JSON.stringify({ 
      success: true, 
      durationMs: duration,
      cohortsCount: ctx.activeCohorts.length,
      assessmentsCount: ctx.recentAssessments.length,
      lowStockItemsCount: ctx.lowStockItems.length,
      timestamp: ctx.timestamp
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("Test DB failed:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
