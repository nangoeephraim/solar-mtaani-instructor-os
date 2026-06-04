import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { buildPrismAIContext, buildPrismSystemPrompt } from '../../lib/aiContext.js';
import { createServerSupabaseClient } from '../../lib/supabase-server.js';

// ── Vercel Serverless Configuration ──────────────────────────────────
// Ensure maxDuration is 60 (ignored on Hobby, but good practice).
export const maxDuration = 60;

// Ensure the Gemini API key alias is propagated
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

// ── Types ────────────────────────────────────────────────────────────
type AIProviderType = 'groq' | 'cerebras' | 'openrouter' | 'google';

interface ProviderConfig {
  provider: AIProviderType;
  apiKey: string;
}

// ── Provider Resolution ──────────────────────────────────────────────
function getProviderConfigsFromEnv(): ProviderConfig[] {
  const mapping: { provider: AIProviderType; envKey: string }[] = [
    { provider: 'groq', envKey: 'GROQ_API_KEY' },
    { provider: 'cerebras', envKey: 'CEREBRAS_API_KEY' },
    { provider: 'openrouter', envKey: 'OPENROUTER_API_KEY' },
    { provider: 'google', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY' },
  ];

  return mapping
    .filter(m => !!process.env[m.envKey])
    .map(m => ({ provider: m.provider, apiKey: process.env[m.envKey]! }));
}

// ── Model Factory ────────────────────────────────────────────────────
function createModelForProvider(config: ProviderConfig) {
  switch (config.provider) {
    case 'groq':
      return createGroq({ apiKey: config.apiKey })('llama-3.3-70b-versatile');
    case 'cerebras':
      return createOpenAI({
        baseURL: 'https://api.cerebras.ai/v1',
        apiKey: config.apiKey,
      }).chat('llama3.3-70b');
    case 'openrouter':
      return createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: config.apiKey,
      }).chat('meta-llama/llama-3.3-70b-instruct');
    case 'google':
    default:
      return createGoogleGenerativeAI({
        apiKey: config.apiKey,
      })('gemini-2.0-flash');
  }
}

// ── Fallback System Prompt ───────────────────────────────────────────
const FALLBACK_SYSTEM_PROMPT = `You are Sally — a warm, witty solar technology coordinator who lives inside the PRISM Instructors Platform.

You help local instructors run professional solar vocational training centers. Think of yourself as the instructor's technical copilot. 

Be concise, professional, and technical when needed. Use occasional technical humor. Respond in plain flowing text without markdown formatting.

Current time: ${new Date().toISOString()}`;

// ── Main Handler ─────────────────────────────────────────────────────
export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    console.log('[Sally] Chat handler invoked');
    const { messages } = body;

    // ── 1. Sanitize messages ─────────────────────────────────────────
    const sanitizeMessage = (msg: any): any => {
      if (msg.parts && Array.isArray(msg.parts)) return msg;
      const parts: any[] = [];
      if (typeof msg.content === 'string' && msg.content.trim() !== '') {
        parts.push({ type: 'text', text: msg.content });
      }
      if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
        for (const toolInv of msg.toolInvocations) {
          parts.push({
            type: 'dynamic-tool',
            toolCallId: toolInv.toolCallId,
            toolName: toolInv.toolName,
            state: toolInv.state,
            input: toolInv.input,
            output: toolInv.result,
            errorText: toolInv.errorText,
          });
        }
      }
      return { ...msg, parts };
    };

    const sanitizedMessages = (messages || [])
      .filter((msg: any) => msg && (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system'))
      .map(sanitizeMessage);

    const modelMessages = await convertToModelMessages(sanitizedMessages);

    // ── 2. Build live database context (with 5s fallback) ───────────
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    try {
      const ctx = await Promise.race([
        buildPrismAIContext(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Context build exceeded timeout')), 1500)
        ),
      ]);
      systemPrompt = buildPrismSystemPrompt(ctx);
      console.log('[Sally] Live database context loaded');
    } catch (ctxErr: any) {
      console.warn('[Sally] Context build failed/timed out, using fallback:', ctxErr.message);
    }

    // ── 3. Resolve provider configs ─────────────────────────────────
    const configs = getProviderConfigsFromEnv();
    if (configs.length === 0) {
      throw new Error('No AI provider API keys found in environment variables.');
    }

    // ── 4. Define callable tools ────────────────────────────────────
    const tools = {
      getInventoryStock: tool({
        description: 'Lookup the current available stock for training materials and equipment at a specific location.',
        parameters: z.object({
          locationName: z.string().describe('The training location (e.g. Kibera)'),
          itemName: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
        }),
        execute: async ({ locationName, itemName }: any) => {
          try {
            const supabase = await createServerSupabaseClient();
            let query = supabase.from('equipment_inventory').select('*').ilike('location', `%${locationName}%`);
            if (itemName) query = query.ilike('item_name', `%${itemName}%`);
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { inventory: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Inventory lookup failed' };
          }
        },
      } as any),
      logStudentAssessment: tool({
        description: 'Submit a training module grade/score for a student directly from conversation.',
        parameters: z.object({
          studentName: z.string().describe('Full name of the student'),
          moduleName: z.string().describe('Solar training module name'),
          score: z.number().describe('Assessment score out of 100'),
          comments: z.string().optional().describe('Brief feedback notes'),
        }),
        execute: async ({ studentName, moduleName, score, comments }: any) => {
          try {
            const supabase = await createServerSupabaseClient();
            const { data: students, error: stdErr } = await supabase
              .from('students')
              .select('id, name')
              .ilike('name', `%${studentName}%`);
            if (stdErr || !students?.length) return { error: `Could not find student "${studentName}"` };
            const targetStudent = students[0];
            const { error: insErr } = await supabase
              .from('assessments')
              .insert({ student_id: targetStudent.id, module_name: moduleName, score, comments: comments || '' });
            if (insErr) return { error: insErr.message };
            return { success: true, message: `Logged score ${score} for ${targetStudent.name}` };
          } catch (err: any) {
            return { error: err.message || 'Assessment logging failed' };
          }
        },
      } as any),
    };

    // ── 5. Robust Provider Failover ─────────────────────────────────
    let lastError: Error | null = null;

    for (const config of configs) {
      console.log(`[Sally] Attempting provider: ${config.provider}`);
      try {
        const model = createModelForProvider(config);
        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          temperature: 0.7,
          tools,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(1200) // Ultra-fast 1.2s timeout to fit Vercel 10s limit!
        });

        // Convert to UIMessageStream internally which emits JSON stream chunks
        const uiStreamResponse = result.toUIMessageStream();
        
        // Wait for the FIRST chunk to prove the provider actually works.
        // We do this by intercepting the readable stream.
        const reader = uiStreamResponse.getReader();
        const firstChunk = await reader.read(); // Will throw if API key bad, rate limited, or timeout

        console.log(`[Sally] Successfully established stream with ${config.provider}`);

        // Reconstruct stream and return
        const newStream = new ReadableStream({
          start(controller) {
            if (!firstChunk.done && firstChunk.value) {
              controller.enqueue(firstChunk.value);
            }
            if (firstChunk.done) {
              controller.close();
            } else {
              // Pipe the rest
              (async () => {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    controller.enqueue(value);
                  }
                  controller.close();
                } catch (err) {
                  controller.error(err);
                }
              })();
            }
          },
          cancel() {
            reader.cancel();
          }
        });

        return new Response(newStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Provider-Used': config.provider
          }
        });

      } catch (err: any) {
        console.warn(`[Sally] Provider ${config.provider} failed: ${err.message}`);
        lastError = err;
        continue; // Try next provider!
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);

  } catch (error: any) {
    console.error('[Sally] Handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
