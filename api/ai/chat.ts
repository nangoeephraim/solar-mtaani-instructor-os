import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { buildPrismAIContext, buildPrismSystemPrompt } from '../../lib/aiContext';
import { createServerSupabaseClient } from '../../lib/supabase-server';
import { getPrioritizedProviderConfigs } from '../../lib/aiProvider';

// Ensure the API key is set for the Gemini provider
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();
    const modelMessages = await convertToModelMessages(messages);

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

    // 4. Stream response using the prioritized fallback chain
    let result = null;
    let lastError = null;

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

        result = await streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          maxOutputTokens: 1548,
          temperature: 0.7, // Balanced for technical precision + conversation
          tools,
        });

        // Break if we successfully initialized and called streamText
        break;
      } catch (err: any) {
        console.warn(`Failed to initialize stream with AI provider "${config.provider}":`, err.message || err);
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(`All configured AI providers failed. Last error: ${lastError?.message || lastError}`);
    }

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

