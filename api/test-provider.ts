export const runtime = 'edge';

export default async function handler(req: Request) {
  try {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const apiKey = process.env.GROQ_API_KEY;

    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    const data = await res.json();
    return new Response(JSON.stringify({ 
      success: true, 
      status: res.status, 
      latency: Date.now() - start,
      data 
    }));
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }));
  }
}
