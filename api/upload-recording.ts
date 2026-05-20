import { put } from '@vercel/blob';


export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    const meetingId = form.get('meetingId') as string;

    if (!file || !meetingId) {
      return new Response('Missing file or meetingId', { status: 400 });
    }

    // Phase 4.3: Direct meeting recordings to Vercel Blob storage
    // Fast Data Transfer optimized via strict Cache-Control headers
    const blob = await put(`recordings/${meetingId}_${Date.now()}.webm`, file, {
      access: 'public',
      addRandomSuffix: true,
      cacheControlMaxAge: 31536000, // 1 year cache for optimized delivery
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
