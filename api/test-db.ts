import { buildPrismAIContext } from '../lib/aiContext.js';

export default async function handler(req: Request) {
  try {
    console.log("Entering test-db handler...");
    const start = Date.now();
    const ctx = await buildPrismAIContext();
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
