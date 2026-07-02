import { AccessToken } from 'livekit-server-sdk';
import { requireApiUser } from '../lib/supabase-server.js';


export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const auth = await requireApiUser(req);
  if ('response' in auth) return auth.response;

  try {
    const { roomName, participantName } = await req.json();
    if (typeof roomName !== 'string' || !/^[a-zA-Z0-9_-]{4,80}$/.test(roomName)) {
      return new Response(JSON.stringify({ error: 'Invalid room name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: Missing LiveKit API keys' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: auth.context.user.id,
      name: participantName || auth.context.profile.name || auth.context.user.email || 'PRISM User',
    });
    
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    
    const token = await at.toJwt();

    return new Response(JSON.stringify({ token }), {
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
