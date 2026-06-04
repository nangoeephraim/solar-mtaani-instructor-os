import { getPrioritizedProviderConfigs } from '../lib/aiProvider.js';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 60;
export const runtime = 'edge';

function createModelForProvider(config: any) {
  switch (config.provider) {
    case 'groq': return createGroq({ apiKey: config.apiKey })('llama-3.3-70b-versatile');
    case 'cerebras': return createOpenAI({ baseURL: 'https://api.cerebras.ai/v1', apiKey: config.apiKey }).chat('llama3.3-70b');
    case 'openrouter': return createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: config.apiKey }).chat('meta-llama/llama-3.3-70b-instruct');
    case 'google':
    default: return createGoogleGenerativeAI({ apiKey: config.apiKey })('gemini-2.0-flash');
  }
}

export default async function handler(req: Request) {
  try {
    // 1. Resolve providers
    const providerMap = [
      { provider: 'groq', envKey: 'GROQ_API_KEY' },
      { provider: 'cerebras', envKey: 'CEREBRAS_API_KEY' },
      { provider: 'openrouter', envKey: 'OPENROUTER_API_KEY' },
      { provider: 'google', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY' },
    ];
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
    }
    const configs = providerMap.filter(p => !!process.env[p.envKey]).map(p => ({
      provider: p.provider,
      apiKey: process.env[p.envKey]!
    }));

    const results = [];

    // 2. Test each provider sequentially
    for (const config of configs) {
      const start = Date.now();
      try {
        const model = createModelForProvider(config);
        const { text } = await generateText({
          model,
          prompt: "Say hi",
          maxTokens: 5,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(3000)
        });
        results.push({
          provider: config.provider,
          status: 'success',
          text,
          latencyMs: Date.now() - start
        });
      } catch (err: any) {
        results.push({
          provider: config.provider,
          status: 'error',
          errorName: err.name,
          errorMessage: err.message,
          latencyMs: Date.now() - start
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
