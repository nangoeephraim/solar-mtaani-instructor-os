import { streamText, createUIMessageStreamResponse } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { getPrioritizedProviderConfigs } from '../lib/aiProvider.ts';

// Helper to check stream in 10s timeout
function timeoutPromise(ms: number, message: string) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

async function run() {
  const configs = await getPrioritizedProviderConfigs();
  console.log("Resolved Prioritized configs:", configs.map(c => c.provider));

  let finalResponseStream: any = null;
  let successProvider: string = '';

  for (const config of configs) {
    console.log(`\n--- Trying Provider: ${config.provider} ---`);
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

      console.log("Calling streamText...");
      const result = await streamText({
        model,
        messages: [{ role: 'user', content: 'Say hello in 3 words!' }],
        maxOutputTokens: 1548,
        temperature: 0.7,
      });

      console.log("Obtaining UI Message Stream...");
      const uiStream = result.toUIMessageStream();
      const reader = uiStream.getReader();
      const consumed: any[] = [];

      // Perform pre-flight check by reading first 2 chunks with a timeout
      console.log("Reading first chunk (pre-flight)...");
      const readPromise = async () => {
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

      // Set timeout for pre-flight to 5 seconds
      await Promise.race([
        readPromise(),
        timeoutPromise(5000, `Pre-flight timeout for provider ${config.provider}`)
      ]);

      console.log(`Pre-flight succeeded for provider ${config.provider}! Consumed chunks count:`, consumed.length);
      console.log("Consumed chunks:", JSON.stringify(consumed, null, 2));

      // Build the reconstructed stream
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

      successProvider = config.provider;
      break;
    } catch (err: any) {
      console.warn(`Provider ${config.provider} failed:`, err.message || err);
    }
  }

  if (!finalResponseStream) {
    console.error("All providers failed pre-flight!");
    return;
  }

  console.log(`\nSuccess! Reconstructing stream with ${successProvider}...`);
  const response = createUIMessageStreamResponse({ stream: finalResponseStream });
  console.log("Response headers:", Object.fromEntries(response.headers.entries()));
  
  const reader = response.body?.getReader();
  if (reader) {
    const decoder = new TextDecoder();
    console.log("Reading response stream:");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log("SSE Chunk:", JSON.stringify(decoder.decode(value)));
    }
  }
}

run();
