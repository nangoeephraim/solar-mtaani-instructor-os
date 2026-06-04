import { streamText, convertToModelMessages, tool, createUIMessageStreamResponse } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { buildPrismAIContext, buildPrismSystemPrompt } from '../../lib/aiContext.js';
import { createServerSupabaseClient } from '../../lib/supabase-server.js';

// ── Vercel Serverless Configuration ──────────────────────────────────
// Request up to 60 seconds of execution time (Hobby plan max).
// Without this export, Vercel uses a much shorter default that causes
// FUNCTION_INVOCATION_TIMEOUT before the AI stream even starts.
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

// ── Provider Resolution (env-only, no DB round-trip) ─────────────────
// The previous implementation queried Supabase for sally_settings on every
// request, adding seconds of latency. Environment variables are always
// available instantly on the serverless function.
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

You help local instructors run professional solar vocational training centers. Think of yourself as the instructor's technical copilot, sitting in the workshop, ready to review curriculum specs, calculate PV array ratios, check inventory levels, and help manage student performance.

Be concise, professional, and technical when needed. Use occasional technical humor. Respond in plain flowing text without markdown formatting (no bold, italic, hashes, or bullet characters) as your output is also rendered via text-to-speech.

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

    // ── 1. Sanitize client messages for AI SDK 6.x ──────────────────
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

    // ── 2. Build live database context (with timeout fallback) ──────
    // If the Supabase queries take longer than 8 seconds (cold start,
    // network latency), we fall back to the static system prompt so the
    // AI response is not blocked.
    let systemPrompt = FALLBACK_SYSTEM_PROMPT;
    try {
      const ctx = await Promise.race([
        buildPrismAIContext(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Context build exceeded 8s timeout')), 8000)
        ),
      ]);
      systemPrompt = buildPrismSystemPrompt(ctx);
      console.log('[Sally] Live database context loaded');
    } catch (ctxErr: any) {
      console.warn('[Sally] Context build failed/timed out, using fallback:', ctxErr.message);
    }

    // ── 3. Resolve provider configs from environment ────────────────
    const configs = getProviderConfigsFromEnv();
    console.log('[Sally] Available providers:', configs.map(c => c.provider).join(', '));

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
          moduleName: z.string().describe('Solar training module name (e.g. PV Wiring)'),
          score: z.number().describe('Assessment score out of 100'),
          comments: z.string().optional().describe('Brief feedback notes'),
        }),
        execute: async ({ studentName, moduleName, score, comments }: any) => {
          try {
            const supabase = await createServerSupabaseClient();
            // Resolve student
            const { data: students, error: stdErr } = await supabase
              .from('students')
              .select('id, name, cohort_id')
              .ilike('name', `%${studentName}%`);
            if (stdErr || !students?.length) {
              return { error: `Could not find student matching "${studentName}"` };
            }
            const targetStudent = students[0];
            // Insert assessment
            const { error: insErr } = await supabase
              .from('assessments')
              .insert({
                student_id: targetStudent.id,
                module_name: moduleName,
                score,
                comments: comments || 'Graded via Sally Copilot.',
              })
              .select();
            if (insErr) return { error: insErr.message };
            // Recalculate average
            const { data: allAssessments } = await supabase
              .from('assessments')
              .select('score')
              .eq('student_id', targetStudent.id);
            const scores = allAssessments || [];
            const newAvg =
              scores.length > 0 ? scores.reduce((sum, a) => sum + Number(a.score), 0) / scores.length : 0;
            await supabase.from('students').update({ average_score: newAvg }).eq('id', targetStudent.id);
            return {
              success: true,
              message: `Logged score of ${score} for ${targetStudent.name} in ${moduleName}.`,
            };
          } catch (err: any) {
            return { error: err.message || 'Assessment logging failed' };
          }
        },
      } as any),
    };

    // ── 5. Stream AI response ───────────────────────────────────────
    // Use the first available provider and stream directly.
    // 
    // DESIGN DECISION: The previous implementation read 2 chunks from
    // the stream with a 2.5s timeout per provider as a "pre-flight
    // check", then reconstructed the stream. This caused:
    //   - 2.5s × 4 providers = 10s minimum on timeout cascade
    //   - Plus DB queries = exceeded Vercel function timeout → 504
    //
    // The new approach streams directly. If the provider errors, the
    // error is sent through the stream to the client (which displays it
    // gracefully). This converts a 100% timeout failure into a working
    // stream with rare in-stream errors.
    const primaryConfig = configs[0];
    console.log(`[Sally] Streaming via provider: ${primaryConfig.provider}`);

    const model = createModelForProvider(primaryConfig);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.7,
      tools,
    });

    return createUIMessageStreamResponse({
      stream: result.toUIMessageStream(),
    });
  } catch (error: any) {
    console.error('[Sally] Handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
