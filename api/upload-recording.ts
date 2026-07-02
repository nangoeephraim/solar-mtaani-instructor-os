import { put } from '@vercel/blob';
import { requireApiUser } from '../lib/supabase-server.js';

const MAX_RECORDING_BYTES = 250 * 1024 * 1024;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const auth = await requireApiUser(req, { roles: ['admin', 'instructor'] });
  if ('response' in auth) return auth.response;

  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    const meetingId = form.get('meetingId') as string;

    if (!file || !meetingId) {
      return new Response('Missing file or meetingId', { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]{4,80}$/.test(meetingId)) {
      return new Response('Invalid meetingId', { status: 400 });
    }
    if (file.size > MAX_RECORDING_BYTES) {
      return new Response('Recording exceeds the 250MB upload limit', { status: 413 });
    }
    if (!['video/webm', 'video/mp4'].includes(file.type)) {
      return new Response('Unsupported recording type', { status: 415 });
    }

    // Phase 4.3: Direct meeting recordings to Vercel Blob storage
    // Fast Data Transfer optimized via strict Cache-Control headers
    const blob = await put(`recordings/${meetingId}/${auth.context.user.id}_${Date.now()}.webm`, file, {
      access: 'public',
      addRandomSuffix: true,
      cacheControlMaxAge: 3600,
    });

    return new Response(JSON.stringify(blob), {
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
