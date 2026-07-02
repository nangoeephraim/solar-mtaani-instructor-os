import { providerHealth, cachedHealthyProvider, cachedHealthyProviderExpiresAt, markProviderFailure } from './chat.js';
import { requireApiUser } from '../../lib/supabase-server.js';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const auth = await requireApiUser(req);
  if ('response' in auth) return auth.response;

  if (req.method === 'GET') {
    const providers: any[] = [];
    providerHealth.forEach((snapshot) => {
      providers.push({ ...snapshot });
    });

    const ttlRemaining = cachedHealthyProviderExpiresAt > Date.now()
      ? Math.round((cachedHealthyProviderExpiresAt - Date.now()) / 1000)
      : 0;

    return new Response(JSON.stringify({
      activeProvider: cachedHealthyProvider,
      cacheTtlSeconds: ttlRemaining,
      providers,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    try {
      const { provider, error } = await req.json();
      if (provider) {
        markProviderFailure(provider as any, new Error(error || 'Client-reported streaming failure'));
        return new Response(JSON.stringify({ success: true, message: `Marked provider ${provider} as degraded` }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err: any) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
