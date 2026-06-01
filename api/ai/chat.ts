import { streamText, convertToModelMessages, tool, createUIMessageStreamResponse } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { buildPrismAIContext, buildPrismSystemPrompt } from '../../lib/aiContext.ts';
import { createServerSupabaseClient } from '../../lib/supabase-server.ts';
import { getPrioritizedProviderConfigs } from '../../lib/aiProvider.ts';

// Ensure the API key is set for the Gemini provider
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    console.log("Parsed request body:", body);
    const { messages } = body;

    // Sanitize client-sent messages to ensure compatibility with Vercel AI SDK 6.x convertToModelMessages
    const sanitizeMessage = (msg: any): any => {
      if (msg.parts && Array.isArray(msg.parts)) {
        return msg;
      }
      const parts: any[] = [];
      if (typeof msg.content === 'string' && msg.content.trim() !== '') {
        parts.push({
          type: 'text',
          text: msg.content
        });
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
            errorText: toolInv.errorText
          });
        }
      }
      return {
        ...msg,
        parts
      };
    };

    const sanitizedMessages = (messages || [])
      .filter((msg: any) => msg && (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system'))
      .map(sanitizeMessage);

    const modelMessages = await convertToModelMessages(sanitizedMessages);

    // 1. Compile live database context
    const ctx = await buildPrismAIContext();
    const systemPrompt = buildPrismSystemPrompt(ctx);

    // 2. Resolve prioritized list of providers to try
    const configs = await getPrioritizedProviderConfigs();

    // 3. Define tools to pass to streamText
    const tools = {
      // TOOL 1: Check inventory details
      getInventoryStock: tool({
        description: 'Lookup the current available stock for training materials and equipment at a specific location.',
        parameters: z.object({
          locationName: z.string().describe('The training location (e.g. Kibera)'),
          itemName: z.string().optional().describe('Specific item name to check (e.g. Multimeter)')
        }),
        execute: async ({ locationName, itemName }: any) => {
          const supabase = await createServerSupabaseClient();
          let query = supabase
            .from('equipment_inventory')
            .select('*')
            .ilike('location', `%${locationName}%`);
          
          if (itemName) {
            query = query.ilike('item_name', `%${itemName}%`);
          }

          const { data, error } = await query;
          if (error) return { error: error.message };
          return { inventory: data || [] };
        }
      } as any),

      // TOOL 2: Log assessment grade for a student
      logStudentAssessment: tool({
        description: 'Submit a training module grade/score for a student directly from conversation.',
        parameters: z.object({
          studentName: z.string().describe('Full name of the student'),
          moduleName: z.string().describe('Solar training module name (e.g. PV Wiring)'),
          score: z.number().describe('Assessment score out of 100'),
          comments: z.string().optional().describe('Brief feedback notes')
        }),
        execute: async ({ studentName, moduleName, score, comments }: any) => {
          const supabase = await createServerSupabaseClient();
          
          // Resolve student ID
          const { data: students, error: stdErr } = await supabase
            .from('students')
            .select('id, name, cohort_id')
            .ilike('name', `%${studentName}%`);

          if (stdErr || !students?.length) {
            return { error: `Could not find student matching ${studentName}` };
          }

          const targetStudent = students[0];

          // Insert assessment
          const { data: gradeData, error: insErr } = await supabase
            .from('assessments')
            .insert({
              student_id: targetStudent.id,
              module_name: moduleName,
              score: score,
              comments: comments || 'Graded via Sally Copilot.'
            })
            .select();

          if (insErr) return { error: insErr.message };

          // Trigger Recalculation: Update student overall average score
          const { data: allAssessments } = await supabase
            .from('assessments')
            .select('score')
            .eq('student_id', targetStudent.id);
          
          const scores = allAssessments || [];
          const newAvg = scores.length > 0 
            ? scores.reduce((sum, a) => sum + Number(a.score), 0) / scores.length
            : 0;

          await supabase
            .from('students')
            .update({ average_score: newAvg })
            .eq('id', targetStudent.id);

          return {
            success: true,
            message: `Logged score of ${score} for ${targetStudent.name} in ${moduleName}.`
          };
        }
      } as any)
    };

    // 4. Stream response using the prioritized fallback chain with pre-flight checks
    let finalResponseStream: ReadableStream<any> | null = null;
    let lastError: any = null;

    // Helper to check stream within a timeout
    const timeoutPromise = (ms: number, message: string) => {
      return new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms));
    };

    for (const config of configs) {
      try {
        let model;
        switch (config.provider) {
          case 'groq':
            model = createGroq({ apiKey: config.apiKey })('llama-3.3-70b-versatile');
            break;
          case 'cerebras':
            model = createOpenAI({
              baseURL: 'https://api.cerebras.ai/v1',
              apiKey: config.apiKey,
            }).chat('llama3.3-70b');
            break;
          case 'openrouter':
            model = createOpenAI({
              baseURL: 'https://openrouter.ai/api/v1',
              apiKey: config.apiKey,
            }).chat('meta-llama/llama-3.3-70b-instruct');
            break;
          case 'google':
          default:
            model = createGoogleGenerativeAI({
              apiKey: config.apiKey,
            })('gemini-2.0-flash');
            break;
        }

        console.log(`Starting stream validation for provider: ${config.provider}`);
        const streamResult = await streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          maxOutputTokens: 1548,
          temperature: 0.7, // Balanced for technical precision + conversation
          tools,
        });

        const uiStream = streamResult.toUIMessageStream();
        const reader = uiStream.getReader();
        const consumed: any[] = [];

        // Pre-flight check: read first 2 chunks to confirm successful connection and auth
        const readPreflight = async () => {
          // Read 1st chunk
          const chunk1 = await reader.read();
          if (chunk1.done) return;
          consumed.push(chunk1.value);
          if (chunk1.value?.type === 'error') {
            throw new Error(chunk1.value.errorText || 'Error chunk yielded');
          }

          // Read 2nd chunk
          const chunk2 = await reader.read();
          if (chunk2.done) return;
          consumed.push(chunk2.value);
          if (chunk2.value?.type === 'error') {
            throw new Error(chunk2.value.errorText || 'Error chunk yielded');
          }
        };

        // Enforce a 6-second timeout for the pre-flight connection check
        await Promise.race([
          readPreflight(),
          timeoutPromise(6000, `Pre-flight verification timeout for provider "${config.provider}"`)
        ]);

        console.log(`Provider "${config.provider}" passed pre-flight! Reconstructing response stream.`);

        // Reconstruct the response stream from preflight chunks and the remaining reader
        finalResponseStream = new ReadableStream({
          async start(controller) {
            for (const chunk of consumed) {
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

        break;
      } catch (err: any) {
        console.warn(`Failed to execute fallback chain for provider "${config.provider}":`, err.message || err);
        lastError = err;
      }
    }

    if (!finalResponseStream) {
      throw new Error(`All configured AI providers failed. Last error: ${lastError?.message || lastError}`);
    }

    return createUIMessageStreamResponse({ stream: finalResponseStream });
  } catch (error: any) {
    console.error("Handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

