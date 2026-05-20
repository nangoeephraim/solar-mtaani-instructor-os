import { AccessToken } from 'livekit-server-sdk';


export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { roomName, participantName, participantId } = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: Missing LiveKit API keys' }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantId,
      name: participantName,
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
