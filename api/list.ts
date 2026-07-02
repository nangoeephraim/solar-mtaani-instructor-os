import { list } from '@vercel/blob';
import { requireApiUser } from '../lib/supabase-server.js';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Support list by admin, instructor, or viewer (student)
  const auth = await requireApiUser(req, { roles: ['admin', 'instructor', 'viewer'] });
  if ('response' in auth) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get('prefix') || '';

    // List blobs matching the path prefix
    const { blobs } = await list({ prefix });

    return new Response(JSON.stringify({ blobs }), {
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
