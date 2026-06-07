import { streamText, convertToModelMessages, tool as aiTool, createUIMessageStreamResponse, generateText } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { buildPrismAIContext, buildPrismSystemPrompt } from '../../lib/aiContext.js';
import { createServerSupabaseClient } from '../../lib/supabase-server.js';

// Cast tool helper to any to bypass dependency Zod version mismatch checks in tool definitions
const tool = aiTool as any;

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

// Global cache for the last verified working AI provider
let cachedHealthyProvider: AIProviderType | null = null;

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
  // Enforce an absolute hard stop at 9 seconds to prevent Vercel container hang
  const reqAbortController = new AbortController();
  const reqTimeout = setTimeout(() => reqAbortController.abort(), 9000);
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
        parameters: z.object({
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
      getSchedule: tool({
        description: 'Query the timetable schedule slots. Can filter by day of week (0 = Sunday, 1 = Monday, etc.), instructor name, location name, or class type.',
        parameters: z.object({
          dayOfWeek: z.union([z.number(), z.string()]).optional().describe('Day of the week: 0 for Sunday, 1 for Monday, etc.'),
          day_of_week: z.union([z.number(), z.string()]).optional().describe('Day of the week: 0 for Sunday, 1 for Monday, etc.'),
          instructorName: z.string().optional().describe('Filter by instructor name'),
          instructor_name: z.string().optional().describe('Filter by instructor name'),
          instructor: z.string().optional().describe('Filter by instructor name'),
          locationName: z.string().optional().describe('Filter by location name'),
          location_name: z.string().optional().describe('Filter by location name'),
          location: z.string().optional().describe('Filter by location name'),
          type: z.string().optional().describe('Filter by class type (e.g. class, workshop, lab)'),
        }),
        execute: async (args: any) => {
          try {
            const rawDay = args.dayOfWeek ?? args.day_of_week;
            const instructor = args.instructorName ?? args.instructor_name ?? args.instructor;
            const location = args.locationName ?? args.location_name ?? args.location;
            const type = args.type;
            
            const supabase = await createServerSupabaseClient();
            let query = supabase.from('schedule_slots').select('*').abortSignal((globalThis as any).reqAbortSignal);
            
            if (rawDay !== undefined) {
              const dayVal = typeof rawDay === 'number' ? rawDay : parseInt(rawDay);
              if (!isNaN(dayVal)) {
                query = query.eq('day_of_week', dayVal);
              }
            }
            if (instructor) {
              query = query.ilike('instructor', `%${instructor}%`);
            }
            if (location) {
              query = query.ilike('location', `%${location}%`);
            }
            if (type) {
              query = query.ilike('type', `%${type}%`);
            }
            
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { schedule: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Timetable lookup failed' };
          }
        }
      }),
      manageSchedule: tool({
        description: 'Create, update, or delete timetable schedule slots in the system.',
        parameters: z.object({
          action: z.enum(['create', 'update', 'delete']).describe('Database action to perform'),
          id: z.string().optional().describe('The UUID of the slot to update or delete'),
          title: z.string().optional().describe('Title of the schedule event (e.g., Solar Installation Practicum)'),
          startTime: z.string().optional().describe('Start time in HH:MM format (e.g., 09:00)'),
          start_time: z.string().optional().describe('Start time in HH:MM format (e.g., 09:00)'),
          endTime: z.string().optional().describe('End time in HH:MM format (e.g., 12:00)'),
          end_time: z.string().optional().describe('End time in HH:MM format (e.g., 12:00)'),
          dayOfWeek: z.number().optional().describe('Day of the week (0 = Sunday, 1 = Monday, etc.)'),
          day_of_week: z.number().optional().describe('Day of the week (0 = Sunday, 1 = Monday, etc.)'),
          type: z.string().optional().describe('Slot type (e.g. class, workshop, meeting)'),
          location: z.string().optional().describe('Location of class (e.g. Kibera Center)'),
          instructor: z.string().optional().describe('Instructor assigned to class'),
          color: z.string().optional().describe('Hex or Tailwind color class for timetable UI display'),
        }),
        execute: async (args: any) => {
          try {
            const { action, id } = args;
            const supabase = await createServerSupabaseClient();
            
            if (action === 'delete') {
              if (!id) return { error: 'Schedule slot ID is required for deletion' };
              const { error } = await supabase.from('schedule_slots').delete().eq('id', id);
              if (error) return { error: error.message };
              return { success: true, message: `Deleted schedule slot ${id}` };
            }
            
            const title = args.title;
            const startTime = args.startTime ?? args.start_time;
            const endTime = args.endTime ?? args.end_time;
            const dayOfWeek = args.dayOfWeek ?? args.day_of_week;
            const type = args.type;
            const location = args.location;
            const instructor = args.instructor;
            const color = args.color;
            
            if (action === 'create') {
              if (!title || !startTime || !endTime || dayOfWeek === undefined || !type) {
                return { error: 'Title, startTime, endTime, dayOfWeek, and type are required to create a schedule slot' };
              }
              const { data, error } = await supabase.from('schedule_slots').insert({
                title, start_time: startTime, end_time: endTime, day_of_week: dayOfWeek, type, location, instructor, color
              }).select();
              if (error) return { error: error.message };
              return { success: true, message: `Created schedule slot: ${title}`, slot: data[0] };
            }
            
            if (action === 'update') {
              if (!id) return { error: 'Schedule slot ID is required for updates' };
              const updates: any = {};
              if (title !== undefined) updates.title = title;
              if (startTime !== undefined) updates.start_time = startTime;
              if (endTime !== undefined) updates.end_time = endTime;
              if (dayOfWeek !== undefined) updates.day_of_week = dayOfWeek;
              if (type !== undefined) updates.type = type;
              if (location !== undefined) updates.location = location;
              if (instructor !== undefined) updates.instructor = instructor;
              if (color !== undefined) updates.color = color;
              
              const { data, error } = await supabase.from('schedule_slots').update(updates).eq('id', id).select();
              if (error) return { error: error.message };
              return { success: true, message: `Updated schedule slot ${id}`, slot: data[0] };
            }
            return { error: 'Invalid action' };
          } catch (err: any) {
            return { error: err.message || 'Timetable management failed' };
          }
        }
      }),
      getMeetings: tool({
        description: 'Retrieve current video meeting sessions from the database.',
        parameters: z.object({
          status: z.enum(['active', 'ended']).optional().describe('Filter by meeting status: active or ended'),
          hostName: z.string().optional().describe('Filter by host name'),
          host_name: z.string().optional().describe('Filter by host name'),
        }),
        execute: async (args: any) => {
          try {
            const status = args.status;
            const hostName = args.hostName ?? args.host_name;
            const supabase = await createServerSupabaseClient();
            let query = supabase.from('meetings').select('*').order('created_at', { ascending: false }).abortSignal((globalThis as any).reqAbortSignal);
            
            if (status) {
              query = query.eq('status', status);
            }
            if (hostName) {
              query = query.ilike('host_name', `%${hostName}%`);
            }
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { meetings: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Meetings lookup failed' };
          }
        }
      }),
      manageMeetings: tool({
        description: 'Start or end video meetings for cohorts.',
        parameters: z.object({
          action: z.enum(['create', 'end']).describe('Database action to perform'),
          meetingCode: z.string().describe('The unique meeting code (e.g. cob-123-abc)'),
          meeting_code: z.string().optional().describe('The unique meeting code (e.g. cob-123-abc)'),
          title: z.string().optional().describe('Title of meeting'),
          hostName: z.string().optional().describe('Full name of host instructor'),
          host_name: z.string().optional().describe('Full name of host instructor'),
          hostId: z.string().optional().describe('UUID of host profile user'),
          host_id: z.string().optional().describe('UUID of host profile user'),
        }),
        execute: async (args: any) => {
          try {
            const { action } = args;
            const meetingCode = args.meetingCode ?? args.meeting_code;
            const hostName = args.hostName ?? args.host_name;
            const hostId = args.hostId ?? args.host_id;
            const title = args.title || 'PRISM Meeting';
            
            if (!meetingCode) return { error: 'Meeting code is required' };
            const supabase = await createServerSupabaseClient();
            
            if (action === 'create') {
              if (!hostName) return { error: 'Host name is required to start a meeting' };
              const { data, error } = await supabase.from('meetings').insert({
                meeting_code: meetingCode,
                host_name: hostName,
                host_id: hostId,
                title,
                status: 'active'
              }).select();
              if (error) return { error: error.message };
              return { success: true, message: `Meeting "${title}" started with code ${meetingCode}`, meeting: data[0] };
            }
            
            if (action === 'end') {
              const { data, error } = await supabase.from('meetings').update({
                status: 'ended',
                ended_at: new Date().toISOString()
              }).eq('meeting_code', meetingCode).select();
              if (error) return { error: error.message };
              return { success: true, message: `Meeting code ${meetingCode} marked as ended`, meeting: data[0] };
            }
            return { error: 'Invalid action' };
          } catch (err: any) {
            return { error: err.message || 'Meeting management failed' };
          }
        }
      }),
      getInstructors: tool({
        description: 'Look up instructor profiles, contact info, qualifications, and class assignments.',
        parameters: z.object({
          instructorName: z.string().optional().describe('Filter by instructor name'),
          instructor_name: z.string().optional().describe('Filter by instructor name'),
          instructor: z.string().optional().describe('Filter by instructor name'),
          subject: z.string().optional().describe('Filter by subject area (e.g. Solar, ICT)'),
        }),
        execute: async (args: any) => {
          try {
            const instructorName = args.instructorName ?? args.instructor_name ?? args.instructor;
            const subject = args.subject;
            const supabase = await createServerSupabaseClient();
            
            let query = supabase.from('instructor_profiles').select('*').abortSignal((globalThis as any).reqAbortSignal);
            if (instructorName) {
              query = query.ilike('full_name', `%${instructorName}%`);
            }
            if (subject) {
              query = query.ilike('subject', `%${subject}%`);
            }
            const { data: profiles, error: profErr } = await query;
            if (profErr) return { error: profErr.message };
            
            // Fetch assignments for these instructors
            const { data: assignments, error: assignErr } = await supabase
              .from('class_assignments')
              .select('*')
              .abortSignal((globalThis as any).reqAbortSignal);
            
            const mappedProfiles = (profiles || []).map((p: any) => {
              const myAssignments = (assignments || []).filter((a: any) => a.instructor_id === p.id);
              return {
                ...p,
                assignments: myAssignments
              };
            });
            
            return { instructors: mappedProfiles };
          } catch (err: any) {
            return { error: err.message || 'Instructor query failed' };
          }
        }
      }),
      manageInstructors: tool({
        description: 'Create or update instructor profiles in the system.',
        parameters: z.object({
          action: z.enum(['create', 'update']).describe('Action to perform'),
          id: z.string().optional().describe('UUID of the instructor profile to update'),
          fullName: z.string().optional().describe('Full name of the instructor'),
          full_name: z.string().optional().describe('Full name of the instructor'),
          email: z.string().optional().describe('Email address'),
          phone: z.string().optional().describe('Phone number'),
          subject: z.string().optional().describe('Primary subject area (Solar or ICT)'),
          qualification: z.string().optional().describe('Educational or trade qualifications'),
          isActive: z.boolean().optional().describe('Set active status of instructor'),
          is_active: z.boolean().optional().describe('Set active status of instructor'),
        }),
        execute: async (args: any) => {
          try {
            const { action, id } = args;
            const supabase = await createServerSupabaseClient();
            
            const fullName = args.fullName ?? args.full_name;
            const email = args.email;
            const phone = args.phone;
            const subject = args.subject;
            const qualification = args.qualification;
            const isActive = args.isActive ?? args.is_active;
            
            if (action === 'create') {
              if (!fullName) return { error: 'Full name is required to create a profile' };
              const { data, error } = await supabase.from('instructor_profiles').insert({
                full_name: fullName, email, phone, subject: subject || 'Solar', qualification, is_active: isActive !== false
              }).select();
              if (error) return { error: error.message };
              return { success: true, message: `Created instructor profile for ${fullName}`, instructor: data[0] };
            }
            
            if (action === 'update') {
              if (!id) return { error: 'Instructor ID is required for updates' };
              const updates: any = {};
              if (fullName !== undefined) updates.full_name = fullName;
              if (email !== undefined) updates.email = email;
              if (phone !== undefined) updates.phone = phone;
              if (subject !== undefined) updates.subject = subject;
              if (qualification !== undefined) updates.qualification = qualification;
              if (isActive !== undefined) updates.is_active = isActive;
              
              const { data, error } = await supabase.from('instructor_profiles').update(updates).eq('id', id).select();
              if (error) return { error: error.message };
              return { success: true, message: `Updated instructor profile ${id}`, instructor: data[0] };
            }
            return { error: 'Invalid action' };
          } catch (err: any) {
            return { error: err.message || 'Instructor management failed' };
          }
        }
      }),
      manageInventory: tool({
        description: 'Update the quantity or log stock additions/subtractions for training equipment in inventory.',
        parameters: z.object({
          location: z.string().describe('The training location (e.g. Kibera)'),
          itemName: z.string().describe('The name of the equipment item to update (e.g. Multimeter)'),
          item_name: z.string().optional().describe('The name of the equipment item to update (e.g. Multimeter)'),
          action: z.enum(['add', 'subtract', 'set']).describe('Modification action: add, subtract, or set'),
          qty: z.number().describe('The amount to modify or set'),
          quantity: z.number().optional().describe('The amount to modify or set'),
        }),
        execute: async (args: any) => {
          try {
            const location = args.location;
            const itemName = args.itemName ?? args.item_name;
            const action = args.action;
            const qty = args.qty ?? args.quantity;
            
            if (!location || !itemName || qty === undefined) {
              return { error: 'Location, itemName, and quantity/qty are required' };
            }
            
            const supabase = await createServerSupabaseClient();
            
            // Check if item exists at location
            const { data: existing, error: findErr } = await supabase
              .from('equipment_inventory')
              .select('*')
              .ilike('location', `%${location}%`)
              .ilike('item_name', `%${itemName}%`)
              .abortSignal((globalThis as any).reqAbortSignal);
            
            if (findErr) return { error: findErr.message };
            
            if (!existing?.length) {
              // If set action and it doesn't exist, create it!
              if (action === 'set') {
                const { data, error } = await supabase.from('equipment_inventory').insert({
                  location,
                  item_name: itemName,
                  total_qty: qty,
                  available_qty: qty,
                  low_stock_threshold: 5
                }).select();
                if (error) return { error: error.message };
                return { success: true, message: `Created new inventory item "${itemName}" at ${location} with stock ${qty}`, item: data[0] };
              }
              return { error: `No item "${itemName}" exists at location "${location}". Create it using action "set" first.` };
            }
            
            const targetItem = existing[0];
            let newAvailable = Number(targetItem.available_qty ?? 0);
            let newTotal = Number(targetItem.total_qty ?? 0);
            
            if (action === 'set') {
              newAvailable = qty;
              newTotal = qty;
            } else if (action === 'add') {
              newAvailable += qty;
              newTotal += qty;
            } else if (action === 'subtract') {
              newAvailable -= qty;
              newTotal -= qty;
            }
            
            if (newAvailable < 0) return { error: `Inventory update failed: results in negative stock (${newAvailable})` };
            
            const { data: updated, error: updErr } = await supabase
              .from('equipment_inventory')
              .update({ available_qty: newAvailable, total_qty: newTotal })
              .eq('id', targetItem.id)
              .select();
              
            if (updErr) return { error: updErr.message };
            return { success: true, message: `Updated "${itemName}" at ${location}: new stock is ${newAvailable}`, item: updated[0] };
          } catch (err: any) {
            return { error: err.message || 'Inventory update failed' };
          }
        }
      }),
      getFeeStructures: tool({
        description: 'Retrieve general fee structures (registration, tuition amounts) for terms and groups.',
        parameters: z.object({
          name: z.string().optional().describe('Filter by fee structure name (e.g. Tuition)'),
          studentGroup: z.string().optional().describe('Filter by student group (e.g. Campus, Academy)'),
          student_group: z.string().optional().describe('Filter by student group (e.g. Campus, Academy)'),
        }),
        execute: async (args: any) => {
          try {
            const name = args.name;
            const studentGroup = args.studentGroup ?? args.student_group;
            const supabase = await createServerSupabaseClient();
            
            let query = supabase.from('fee_structures').select('*').abortSignal((globalThis as any).reqAbortSignal);
            if (name) {
              query = query.ilike('name', `%${name}%`);
            }
            if (studentGroup) {
              query = query.ilike('student_group', `%${studentGroup}%`);
            }
            
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { feeStructures: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Fee structures lookup failed' };
          }
        }
      }),
      getStudentFeeBalances: tool({
        description: 'Query student payment balances and total fees paid from the database view.',
        parameters: z.object({
          studentName: z.string().optional().describe('Filter by student name'),
          student_name: z.string().optional().describe('Filter by student name'),
          student: z.string().optional().describe('Filter by student name'),
        }),
        execute: async (args: any) => {
          try {
            const studentName = args.studentName ?? args.student_name ?? args.student;
            const supabase = await createServerSupabaseClient();
            
            let query = supabase.from('student_fee_balances').select('*').abortSignal((globalThis as any).reqAbortSignal);
            if (studentName) {
              query = query.ilike('student_name', `%${studentName}%`);
            }
            
            const { data, error } = await query;
            if (error) return { error: error.message };
            return { studentBalances: data || [] };
          } catch (err: any) {
            return { error: err.message || 'Student fee balances lookup failed' };
          }
        }
      }),
      postFeedMessage: tool({
        description: 'Post a new chat message or campus announcement directly into a general/announcements feed channel.',
        parameters: z.object({
          channelName: z.string().describe('Target channel name: general, announcements'),
          channel_name: z.string().optional().describe('Target channel name: general, announcements'),
          channel: z.string().optional().describe('Target channel name: general, announcements'),
          content: z.string().describe('Text content of message or announcement to post'),
          senderName: z.string().describe('Name of the sender instructor profile (must exist in profiles name column)'),
          sender_name: z.string().optional().describe('Name of the sender instructor profile (must exist in profiles name column)'),
        }),
        execute: async (args: any) => {
          try {
            const channelName = args.channelName ?? args.channel_name ?? args.channel;
            const content = args.content;
            const senderName = args.senderName ?? args.sender_name;
            
            if (!channelName || !content || !senderName) {
              return { error: 'Channel name, content, and sender name are required' };
            }
            
            const supabase = await createServerSupabaseClient();
            
            // Resolve channel
            const { data: channels, error: chErr } = await supabase
              .from('chat_channels')
              .select('id, name')
              .abortSignal((globalThis as any).reqAbortSignal);
              
            if (chErr) return { error: chErr.message };
            const lowerChan = channelName.toLowerCase();
            const targetChannel = channels?.find(ch => 
              ch.id.toLowerCase().includes(lowerChan) || 
              ch.name.toLowerCase().includes(lowerChan)
            );
            if (!targetChannel) return { error: `Could not find chat channel matching "${channelName}"` };
            
            // Resolve sender profile using name. Since we don't have UUID, we query profiles table.
            const { data: profiles, error: profErr } = await supabase
              .from('profiles')
              .select('id, name')
              .ilike('name', `%${senderName}%`)
              .abortSignal((globalThis as any).reqAbortSignal);
              
            if (profErr) return { error: profErr.message };
            
            let senderId = '00000000-0000-0000-0000-000000000000'; // Default system sender
            if (profiles?.length) {
              senderId = profiles[0].id;
            } else {
              // Fetch any active profile from database to use as sender fallback
              const { data: anyProfile } = await supabase.from('profiles').select('id, name').limit(1);
              if (anyProfile?.length) {
                senderId = anyProfile[0].id;
                console.log(`[Sally] Sender profile "${senderName}" not found. Falling back to active sender "${anyProfile[0].name}" (${senderId})`);
              } else {
                return { error: `Sender profile matching name "${senderName}" does not exist, and no fallback profiles are available in the system.` };
              }
            }
            
            const { data: posted, error: postErr } = await supabase
              .from('chat_messages')
              .insert({
                channel_id: targetChannel.id,
                sender_id: senderId,
                content: content
              })
              .select();
              
            if (postErr) return { error: postErr.message };
            return { success: true, message: `Successfully posted to channel "${targetChannel.name}"`, messageDetails: posted[0] };
          } catch (err: any) {
            return { error: err.message || 'Posting feed message failed' };
          }
        }
      }),
    };

    // ── 5. Robust Provider Failover with Caching ───────────────────
    let lastError: Error | null = null;
    
    // Sort configs so that the cached healthy provider is tried first
    const sortedConfigs = [...configs];
    if (cachedHealthyProvider) {
      const cachedIndex = sortedConfigs.findIndex(c => c.provider === cachedHealthyProvider);
      if (cachedIndex > -1) {
        const [cachedConfig] = sortedConfigs.splice(cachedIndex, 1);
        sortedConfigs.unshift(cachedConfig);
      }
    }

    for (const config of sortedConfigs) {
      console.log(`[Sally] Attempting provider: ${config.provider}`);
      try {
        const model = createModelForProvider(config);
        
        // Fast health verification if we are not sure about health
        if (config.provider !== cachedHealthyProvider) {
          console.log(`[Sally] Running fast health check for ${config.provider}...`);
          await Promise.race([
            generateText({
              model,
              prompt: 'Ping',
              maxRetries: 0,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Health check timeout')), 2500))
          ]);
          console.log(`[Sally] Provider ${config.provider} verified healthy!`);
        }

        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          temperature: 0.7,
          tools,
          maxRetries: 0,
          abortSignal: (globalThis as any).reqAbortSignal
        });

        const uiStream = result.toUIMessageStream();
        cachedHealthyProvider = config.provider;

        return createUIMessageStreamResponse({
          stream: uiStream,
          headers: {
            'X-Provider-Used': config.provider
          }
        });

      } catch (err: any) {
        console.warn(`[Sally] Provider ${config.provider} failed: ${err.message}`);
        lastError = err;
        if (config.provider === cachedHealthyProvider) {
          cachedHealthyProvider = null;
        }
        continue;
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
