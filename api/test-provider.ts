import { requireApiUser } from '../lib/supabase-server.js';

export default async function handler(req: Request) {
  const auth = await requireApiUser(req, { roles: ['admin'] });
  if ('response' in auth) return auth.response;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models');
    return new Response(JSON.stringify({ 
      success: true, 
      status: res.status 
    }));
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message
    }));
  }
}
