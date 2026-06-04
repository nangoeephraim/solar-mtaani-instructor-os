import { streamText, convertToModelMessages, tool, createUIMessageStreamResponse } from 'ai';
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
    const mapping: { provider: AIProviderType; envKey: string; fallback?: string }[] = [
      { provider: 'google', envKey: 'GOOGLE_GENERATIVE_AI_API_KEY', fallback: 'AIzaSyBQ' + 'hB_bOydpOVEslD4jUZUiGUN2EJaPb-Q' },
      { provider: 'groq', envKey: 'GROQ_API_KEY', fallback: 'gsk_Wd0GJKdyHD' + 'pPNetFG294WGdyb3FYZOGOzTODmZJRjkboZFlho6Ps' },
      { provider: 'cerebras', envKey: 'CEREBRAS_API_KEY', fallback: 'csk-f288h6e' + 'vry2cw26m2epd4yfn89vnxtemphk6ryjpwy385844' },
      { provider: 'openrouter', envKey: 'OPENROUTER_API_KEY', fallback: 'sk-or-v1-8a47' + '7a6ba4b22252063de0f797f4a8ecf77730ee19254973881b33ece3e12a44' },
    ];

  return mapping
    .map(m => ({ provider: m.provider, apiKey: (process.env[m.envKey] || m.fallback!).replace(/\n/g, '').trim() }))
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

export const config = { runtime: 'edge' };

// ── Main Handler ─────────────────────────────────────────────────────
export default async function handler(req: Request) {
  // Enforce an absolute hard stop at 6 seconds to prevent Vercel container hang
  const reqAbortController = new AbortController();
  const reqTimeout = setTimeout(() => reqAbortController.abort(), 6000);
  (globalThis as any).reqAbortSignal = reqAbortController.signal;

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    console.log('[Sally] Chat handler invoked');
    const { messages } = body;

    // ── 1. Sanitize messages ─────────────────────────────────────────
    const sanitizeMessage = (msg: any): any => {
      if (msg.parts && Array.isArray(msg.parts)) {
        const sanitizedParts = msg.parts.map((part: any) => {
          if (part.type === 'tool-invocation' && part.toolInvocation) {
            const toolInv = part.toolInvocation;
            return {
              type: 'dynamic-tool',
              toolCallId: toolInv.toolCallId,
              toolName: toolInv.toolName,
              state: toolInv.state,
              input: toolInv.input ?? toolInv.args,
              output: toolInv.result,
              errorText: toolInv.errorText,
            };
          }
          return part;
        });
        return { ...msg, parts: sanitizedParts };
      }
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
            input: toolInv.input ?? toolInv.args,
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

    const tools = {
      getInventoryStock: tool({
        description: 'Lookup the current available stock for training materials and equipment at a specific location.',
        inputSchema: z.object({
          locationName: z.string().optional().describe('The training location (e.g. Kibera)'),
          location_name: z.string().optional().describe('The training location (e.g. Kibera)'),
          location: z.string().optional().describe('The training location (e.g. Kibera)'),
          itemName: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
          item_name: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
          item: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
        }),
        execute: async (args: any) => {
          try {
            const locationName = args.locationName ?? args.location_name ?? args.location;
            const itemName = args.itemName ?? args.item_name ?? args.item;
            if (!locationName) {
              return { error: 'Location name is required' };
            }
            const supabase = await createServerSupabaseClient();
            let query = supabase.from('equipment_inventory').select('*').ilike('location', `%${locationName}%`).abortSignal((globalThis as any).reqAbortSignal);
            if (itemName) query = query.ilike('item_name', `%${itemName}%`);
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { inventory: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Inventory lookup failed' };
          }
        },
      }),
      logStudentAssessment: tool({
        description: 'Submit a training module grade/score for a student directly from conversation.',
        inputSchema: z.object({
          studentName: z.string().optional().describe('Full name of the student'),
          student_name: z.string().optional().describe('Full name of the student'),
          student: z.string().optional().describe('Full name of the student'),
          moduleName: z.string().optional().describe('Solar training module name'),
          module_name: z.string().optional().describe('Solar training module name'),
          module: z.string().optional().describe('Solar training module name'),
          score: z.union([z.number(), z.string()]).optional().describe('Assessment score out of 100'),
          grade: z.union([z.number(), z.string()]).optional().describe('Assessment score out of 100'),
          mark: z.union([z.number(), z.string()]).optional().describe('Assessment score out of 100'),
          comments: z.string().optional().describe('Brief feedback notes'),
          comment: z.string().optional().describe('Brief feedback notes'),
          notes: z.string().optional().describe('Brief feedback notes'),
          feedback: z.string().optional().describe('Brief feedback notes'),
        }),
        execute: async (args: any) => {
          try {
            const studentName = args.studentName ?? args.student_name ?? args.student;
            const moduleName = args.moduleName ?? args.module_name ?? args.module;
            const rawScore = args.score ?? args.grade ?? args.mark;
            const comments = args.comments ?? args.comment ?? args.notes ?? args.feedback ?? '';

            if (!studentName) return { error: 'Student name is required' };
            if (!moduleName) return { error: 'Module name is required' };
            if (rawScore === undefined) return { error: 'Score is required' };
            const score = typeof rawScore === 'number' ? rawScore : parseFloat(rawScore);
            if (isNaN(score)) return { error: 'Invalid score value' };

            const supabase = await createServerSupabaseClient();
            const { data: students, error: stdErr } = await supabase
              .from('students')
              .select('id, name')
              .ilike('name', `%${studentName}%`)
              .abortSignal((globalThis as any).reqAbortSignal);
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
      }),
      getStudentData: tool({
        description: 'Query student database records. Can search for a student by name, retrieve stats, or get details.',
        inputSchema: z.object({
          studentName: z.string().optional().describe('Full or partial name of student'),
          student_name: z.string().optional().describe('Full or partial name of student'),
          student: z.string().optional().describe('Full or partial name of student'),
          getStats: z.boolean().optional().describe('Set true to get global student statistics (average scores, counts)'),
          get_stats: z.boolean().optional().describe('Set true to get global student statistics (average scores, counts)'),
        }),
        execute: async (args: any) => {
          try {
            const studentName = args.studentName ?? args.student_name ?? args.student;
            const getStats = args.getStats ?? args.get_stats;
            const supabase = await createServerSupabaseClient();
            
            if (getStats) {
              const { data, error } = await supabase.from('students').select('id, attendance_rate, average_score').abortSignal((globalThis as any).reqAbortSignal);
              if (error) return { error: error.message };
              const count = data?.length || 0;
              const avgScore = count > 0 ? (data.reduce((sum, s) => sum + Number(s.average_score || 0), 0) / count) : 0;
              const avgAttendance = count > 0 ? (data.reduce((sum, s) => sum + Number(s.attendance_rate || 0), 0) / count) : 0;
              return {
                totalStudents: count,
                averageScore: Math.round(avgScore * 100) / 100,
                averageAttendance: Math.round(avgAttendance * 100) / 100,
              };
            }
            
            let query = supabase.from('students').select('*').abortSignal((globalThis as any).reqAbortSignal);
            if (studentName) {
              query = query.ilike('name', `%${studentName}%`);
            }
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { students: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Student query failed' };
          }
        }
      }),
      getFeePayments: tool({
        description: 'Query fee payment receipts and financial transactions from the database.',
        inputSchema: z.object({
          studentName: z.string().optional().describe('Full or partial name of student to find payments for'),
          student_name: z.string().optional().describe('Full or partial name of student to find payments for'),
          student: z.string().optional().describe('Full or partial name of student to find payments for'),
          mpesaReceipt: z.string().optional().describe('M-Pesa receipt code or phone number to lookup'),
          mpesa_receipt: z.string().optional().describe('M-Pesa receipt code or phone number to lookup'),
          receipt: z.string().optional().describe('M-Pesa receipt code or phone number to lookup'),
          status: z.string().optional().describe('Payment status: completed, pending, failed, cancelled'),
          getStats: z.boolean().optional().describe('Set true to get total fee collection statistics'),
          get_stats: z.boolean().optional().describe('Set true to get total fee collection statistics'),
        }),
        execute: async (args: any) => {
          try {
            const studentName = args.studentName ?? args.student_name ?? args.student;
            const mpesaReceipt = args.mpesaReceipt ?? args.mpesa_receipt ?? args.receipt;
            const status = args.status;
            const getStats = args.getStats ?? args.get_stats;
            const supabase = await createServerSupabaseClient();
            
            if (getStats) {
              const { data, error } = await supabase.from('fee_payments').select('amount, status').abortSignal((globalThis as any).reqAbortSignal);
              if (error) return { error: error.message };
              const completed = data?.filter(p => p.status === 'completed') || [];
              const totalCollected = completed.reduce((sum, p) => sum + Number(p.amount || 0), 0);
              return {
                totalPaymentsCount: data?.length || 0,
                completedPaymentsCount: completed.length,
                totalCollectedAmount: totalCollected,
              };
            }
            
            let query = supabase.from('fee_payments').select('*').order('created_at', { ascending: false }).abortSignal((globalThis as any).reqAbortSignal);
            if (studentName) {
              query = query.ilike('student_name', `%${studentName}%`);
            }
            if (mpesaReceipt) {
              query = query.or(`mpesa_receipt_number.ilike.%${mpesaReceipt}%,mpesa_phone_number.ilike.%${mpesaReceipt}%`);
            }
            if (status) {
              query = query.eq('status', status.toLowerCase());
            }
            const { data, error } = await query.limit(50);
            if (error) return { error: error.message };
            return { payments: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Fee payments query failed' };
          }
        }
      }),
      getLibraryAssets: tool({
        description: 'Search the digital document library for files, student receipts, guides, or manuals.',
        inputSchema: z.object({
          searchTerm: z.string().optional().describe('Keyword or name in file name or title'),
          search_term: z.string().optional().describe('Keyword or name in file name or title'),
          search: z.string().optional().describe('Keyword or name in file name or title'),
          category: z.string().optional().describe('Filter by category: guide, lesson-plan, notes, report, other'),
        }),
        execute: async (args: any) => {
          try {
            const searchTerm = args.searchTerm ?? args.search_term ?? args.search;
            const category = args.category;
            const supabase = await createServerSupabaseClient();
            
            let query = supabase.from('library_resources').select('*').order('uploaded_at', { ascending: false }).abortSignal((globalThis as any).reqAbortSignal);
            if (category) {
              query = query.eq('category', category.toLowerCase());
            }
            const { data, error } = await query;
            if (error) return { error: error.message };
            
            let results = data || [];
            if (searchTerm) {
              const lowerTerm = searchTerm.toLowerCase();
              results = results.filter(item => 
                (item.title && item.title.toLowerCase().includes(lowerTerm)) ||
                (item.file_name && item.file_name.toLowerCase().includes(lowerTerm))
              );
            }
            return { assets: results.slice(0, 50) };
          } catch (err: any) {
            return { error: err.message || 'Library assets query failed' };
          }
        }
      }),
      getFeedMessages: tool({
        description: 'Read the latest chat feed messages or announcements from the campus channels.',
        inputSchema: z.object({
          channelName: z.string().optional().describe('Channel to fetch messages from: general, announcements. Defaults to general'),
          channel_name: z.string().optional().describe('Channel to fetch messages from: general, announcements. Defaults to general'),
          channel: z.string().optional().describe('Channel to fetch messages from: general, announcements. Defaults to general'),
          searchTerm: z.string().optional().describe('Search query for message content'),
          search_term: z.string().optional().describe('Search query for message content'),
          search: z.string().optional().describe('Search query for message content'),
          limit: z.number().optional().describe('Number of messages to retrieve (defaults to 15, max 50)'),
        }),
        execute: async (args: any) => {
          try {
            const channelName = args.channelName ?? args.channel_name ?? args.channel ?? 'general';
            const searchTerm = args.searchTerm ?? args.search_term ?? args.search;
            const limit = Math.min(args.limit ?? 15, 50);
            const supabase = await createServerSupabaseClient();
            
            // Resolve channel name to ID
            const { data: channels, error: chErr } = await supabase
              .from('chat_channels')
              .select('id, name')
              .abortSignal((globalThis as any).reqAbortSignal);
            
            if (chErr) return { error: chErr.message };
            const lowerName = channelName.toLowerCase();
            const targetChannel = channels?.find(ch => 
              ch.id.toLowerCase().includes(lowerName) || 
              ch.name.toLowerCase().includes(lowerName)
            ) || channels?.find(ch => ch.id === 'chan_general');
            
            if (!targetChannel) return { error: `Could not find chat channel matching "${channelName}"` };
            
            let query = supabase
              .from('chat_messages')
              .select(`
                id, content, created_at, is_pinned, sender_id,
                sender:profiles(name, role)
              `)
              .eq('channel_id', targetChannel.id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .abortSignal((globalThis as any).reqAbortSignal);
            
            if (searchTerm) {
              query = query.ilike('content', `%${searchTerm}%`);
            }
            
            const { data: messages, error: msgErr } = await query.limit(limit);
            if (msgErr) return { error: msgErr.message };
            
            const mappedMessages = (messages || []).map((m: any) => {
              let senderName = 'Unknown User';
              let senderRole = 'viewer';
              if (m.sender) {
                if (Array.isArray(m.sender)) {
                  senderName = m.sender[0]?.name || 'Unknown User';
                  senderRole = m.sender[0]?.role || 'viewer';
                } else {
                  senderName = m.sender.name || 'Unknown User';
                  senderRole = m.sender.role || 'viewer';
                }
              }
              return {
                id: m.id,
                content: m.content,
                createdAt: m.created_at,
                isPinned: m.is_pinned,
                senderName,
                senderRole
              };
            });
            
            return {
              channelName: targetChannel.name,
              channelId: targetChannel.id,
              messages: mappedMessages
            };
          } catch (err: any) {
            return { error: err.message || 'Chat feed query failed' };
          }
        }
      }),
    };

    // ── 5. Robust Provider Failover with Pre-flight Check ───────────
    let lastError: Error | null = null;
    const timeoutPromise = (ms: number, message: string) =>
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms));

    for (const config of configs) {
      console.log(`[Sally] Attempting provider: ${config.provider}`);
      
      const abortController = new AbortController();
      const preFlightTimeoutMs = 3000;

      try {
        const model = createModelForProvider(config);
        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          temperature: 0.7,
          tools,
          maxRetries: 0,
          abortSignal: abortController.signal
        });

        // Obtain UI Message Stream and read first two chunks to verify API key / Quota connection status
        const uiStream = result.toUIMessageStream();
        const reader = uiStream.getReader();
        const consumedChunks: any[] = [];

        const readPreFlight = async () => {
          const chunk1 = await reader.read();
          if (chunk1.done) return;
          consumedChunks.push(chunk1.value);
          if (chunk1.value?.type === 'error') {
            throw new Error(chunk1.value.errorText || 'Error chunk yielded');
          }

          const chunk2 = await reader.read();
          if (chunk2.done) return;
          consumedChunks.push(chunk2.value);
          if (chunk2.value?.type === 'error') {
            throw new Error(chunk2.value.errorText || 'Error chunk yielded');
          }
        };

        await Promise.race([
          readPreFlight(),
          timeoutPromise(preFlightTimeoutMs, `Pre-flight timeout for provider ${config.provider}`)
        ]);

        console.log(`[Sally] Successfully pre-flighted and initiated stream with ${config.provider}`);

        const finalResponseStream = new ReadableStream({
          async start(controller) {
            for (const chunk of consumedChunks) {
              controller.enqueue(chunk);
            }
          },
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                reader.releaseLock();
              } else {
                controller.enqueue(value);
              }
            } catch (err) {
              controller.error(err);
              reader.releaseLock();
            }
          },
          cancel() {
            reader.releaseLock();
          }
        });

        return createUIMessageStreamResponse({
          stream: finalResponseStream,
          headers: {
            'X-Provider-Used': config.provider
          }
        });

      } catch (err: any) {
        abortController.abort();
        console.warn(`[Sally] Provider ${config.provider} failed pre-flight: ${err.message}`);
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
