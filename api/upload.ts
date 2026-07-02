import { put } from '@vercel/blob';
import { requireApiUser } from '../lib/supabase-server.js';

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50MB limit

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Support upload by admin, instructor, or viewer (student)
  const auth = await requireApiUser(req, { roles: ['admin', 'instructor', 'viewer'] });
  if ('response' in auth) return auth.response;

  try {
    const form = await req.formData();
    const file = form.get('file') as File;
    const bucket = form.get('bucket') as string || 'library_documents';
    const pathPrefix = form.get('pathPrefix') as string || '';

    if (!file) {
      return new Response('Missing file', { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return new Response('File size exceeds the 50MB limit', { status: 413 });
    }

    // Sanitize path names and file name
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${sanitizedFileName}`;
    const blobPath = `${bucket}/${pathPrefix ? pathPrefix + '/' : ''}${uniqueName}`;

    // Direct file upload to Vercel Blob
    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: false, // We prefix with timestamp to guarantee uniqueness and sort order
      cacheControlMaxAge: 3600,
    });

    return new Response(JSON.stringify({
      path: blob.url,
      publicUrl: blob.url,
      fullPath: blob.url,
    }), {
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
