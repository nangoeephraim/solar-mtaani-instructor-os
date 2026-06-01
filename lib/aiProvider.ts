import { createServerSupabaseClient } from './supabase-server.ts';

export type AIProviderType = 'groq' | 'cerebras' | 'openrouter' | 'google';

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
}

const PROVIDER_KEY_MAP: Record<AIProviderType, string> = {
  groq: 'groq_api_key',
  cerebras: 'cerebras_api_key',
  openrouter: 'openrouter_api_key',
  google: 'gemini_api_key',
};

const PROVIDER_ENV_MAP: Record<AIProviderType, string> = {
  groq: 'GROQ_API_KEY',
  cerebras: 'CEREBRAS_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
};

/**
 * Resolves the active AI provider and key using database fallback settings in public.sally_settings.
 */
export async function getAIProviderConfig(): Promise<AIProviderConfig> {
  let dbProvider: AIProviderType | null = null;
  let dbKey: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('sally_settings')
      .select('key, value')
      .in('key', ['ai_provider', 'groq_api_key', 'openrouter_api_key', 'gemini_api_key', 'cerebras_api_key']);

    if (data) {
      const settings = Object.fromEntries(data.map(d => [d.key, d.value]));
      if (settings.ai_provider) {
        dbProvider = settings.ai_provider as AIProviderType;
        dbKey = settings[PROVIDER_KEY_MAP[dbProvider]];
      }
    }
  } catch (err) {
    console.warn('Database configuration fetch failed, using environmental configuration:', err);
  }

  if (dbProvider) {
    if (dbKey) return { provider: dbProvider, apiKey: dbKey };
    const envKey = process.env[PROVIDER_ENV_MAP[dbProvider]];
    if (envKey) return { provider: dbProvider, apiKey: envKey };
  }

  // Fallback Priority Sequence: Groq -> Cerebras -> OpenRouter -> Google
  const fallbackOrder: AIProviderType[] = ['groq', 'cerebras', 'openrouter', 'google'];
  for (const p of fallbackOrder) {
    const envKey = process.env[PROVIDER_ENV_MAP[p]];
    if (envKey) return { provider: p, apiKey: envKey };
  }

  // Default fallback to Google with whatever key we have
  return { 
    provider: 'google', 
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' 
  };
}

/**
 * Resolves the prioritized list of AI provider configurations to try in case of failover.
 */
export async function getPrioritizedProviderConfigs(): Promise<AIProviderConfig[]> {
  let dbProvider: AIProviderType | null = null;
  let settings: Record<string, string> = {};

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('sally_settings')
      .select('key, value')
      .in('key', ['ai_provider', 'groq_api_key', 'openrouter_api_key', 'gemini_api_key', 'cerebras_api_key']);

    if (data) {
      settings = Object.fromEntries(data.map(d => [d.key, d.value]));
      if (settings.ai_provider) {
        dbProvider = settings.ai_provider as AIProviderType;
      }
    }
  } catch (err) {
    console.warn('Database configuration fetch failed, using environmental configuration:', err);
  }

  // Resolve key helper for a provider
  const getApiKey = (p: AIProviderType): string => {
    const dbKey = settings[PROVIDER_KEY_MAP[p]];
    if (dbKey) return dbKey;
    return process.env[PROVIDER_ENV_MAP[p]] || '';
  };

  const configs: AIProviderConfig[] = [];

  // Determine starting provider
  let startingProvider = dbProvider;
  if (!startingProvider) {
    // If no active provider set in DB, find the first fallback in order that has a key
    const fallbackOrder: AIProviderType[] = ['groq', 'cerebras', 'openrouter', 'google'];
    for (const p of fallbackOrder) {
      if (getApiKey(p)) {
        startingProvider = p;
        break;
      }
    }
  }
  if (!startingProvider) {
    startingProvider = 'google';
  }

  // Add the starting provider first
  configs.push({
    provider: startingProvider,
    apiKey: getApiKey(startingProvider),
  });

  // Add remaining fallback order
  const fallbackOrder: AIProviderType[] = ['groq', 'cerebras', 'openrouter', 'google'];
  for (const p of fallbackOrder) {
    if (p !== startingProvider) {
      const key = getApiKey(p);
      if (key) {
        configs.push({
          provider: p,
          apiKey: key,
        });
      }
    }
  }

  // Ensure google is always present at the end
  if (!configs.some(c => c.provider === 'google')) {
    configs.push({
      provider: 'google',
      apiKey: getApiKey('google'),
    });
  }

  return configs;
}

