import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export type ApiRole = 'admin' | 'instructor' | 'viewer';

export interface ApiProfile {
  id: string;
  email: string | null;
  name: string | null;
  role: ApiRole;
  is_active: boolean | null;
}

export interface ApiAuthContext {
  supabase: SupabaseClient;
  accessToken: string;
  user: User;
  profile: ApiProfile;
}

export type ApiAuthResult =
  | { ok: true; context: ApiAuthContext }
  | { ok: false; response: Response };

const json = (payload: unknown, status: number): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function getRequiredEnv(name: string, aliases: string[] = []): string {
  const value = [name, ...aliases].map((key) => process.env[key]).find(Boolean);
  if (!value) {
    throw new Error(`Server misconfigured: missing ${name}`);
  }
  return value;
}

function readBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

/**
 * Creates a server-side Supabase client for API routes.
 * Pass an access token when the route should operate as the caller and respect RLS.
 */
export function createServerSupabaseClient(accessToken?: string): SupabaseClient {
  const supabaseUrl = getRequiredEnv('VITE_SUPABASE_URL', ['SUPABASE_URL']);
  const supabaseKey = getRequiredEnv('VITE_SUPABASE_ANON_KEY', ['SUPABASE_ANON_KEY']);

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function requireApiUser(
  req: Request,
  options: { roles?: ApiRole[] } = {}
): Promise<ApiAuthResult> {
  const accessToken = readBearerToken(req);
  if (!accessToken) {
    return { ok: false, response: json({ error: 'Authentication required' }, 401) };
  }

  let supabase: SupabaseClient;
  try {
    supabase = createServerSupabaseClient(accessToken);
  } catch (err: any) {
    return { ok: false, response: json({ error: err.message || 'Server misconfigured' }, 500) };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return { ok: false, response: json({ error: 'Invalid or expired session' }, 401) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile) {
    return { ok: false, response: json({ error: 'User profile not found' }, 403) };
  }

  const apiProfile = profile as ApiProfile;
  if (apiProfile.is_active === false) {
    return { ok: false, response: json({ error: 'User account is inactive' }, 403) };
  }

  if (options.roles?.length && !options.roles.includes(apiProfile.role)) {
    return { ok: false, response: json({ error: 'Insufficient permissions' }, 403) };
  }

  return {
    ok: true,
    context: {
      supabase,
      accessToken,
      user: userData.user,
      profile: apiProfile,
    },
  };
}

export function requireRole(
  context: ApiAuthContext,
  roles: ApiRole[]
): { ok: true } | { ok: false; error: string } {
  if (roles.includes(context.profile.role)) return { ok: true };
  return { ok: false, error: 'Insufficient permissions for this action' };
}
