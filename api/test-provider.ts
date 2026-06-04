export const runtime = 'edge';

export default async function handler(req: Request) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models');
    return new Response(JSON.stringify({ 
      success: true, 
      status: res.status 
    }));
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message,
      stack: err.stack
    }));
  }
}
