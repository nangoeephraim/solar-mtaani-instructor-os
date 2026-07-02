import { del } from '@vercel/blob';
import { requireApiUser } from '../lib/supabase-server.js';

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Deletion is restricted to admins and instructors
  const auth = await requireApiUser(req, { roles: ['admin', 'instructor'] });
  if ('response' in auth) return auth.response;

  try {
    const { urls } = await req.json();
    if (!urls || !Array.isArray(urls)) {
      return new Response('Missing urls array', { status: 400 });
    }

    await del(urls);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
  }
}
