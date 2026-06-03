import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getPrioritizedProviderConfigs } from '../lib/aiProvider.ts';

// Helper to pre-flight a stream. Returns the stream and any read chunks if successful.
// Throws if the stream fails or yields an error chunk during initialization.
async function preflightStream(result: any) {
  const uiStream = result.toUIMessageStream();
  const reader = uiStream.getReader();
  const consumed: any[] = [];
  
  // Read chunks until we get something meaningful (like text delta, tool call) or hit an error.
  // Usually, the first chunk is 'start', and subsequent chunks are content.
  // If we get an 'error' type chunk, we immediately abort and fail.
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      consumed.push(value);
      
      if (value.type === 'error') {
        throw new Error(value.errorText || 'Stream returned error part');
      }
      
      // If we successfully get a text-delta or a tool-call or assistant message part, we are good to go!
      if (value.type === 'text-delta' || value.type === 'tool-call' || value.type === 'tool-call-streaming-start') {
        break;
      }
      
      // If we read more than 5 chunks without any content and no error, let's assume it is working
      if (consumed.length >= 5) {
        break;
      }
    }
  } catch (err) {
    reader.releaseLock();
    throw err;
  }
  
  reader.releaseLock();
  return { uiStream, consumed };
}

// Reconstructs the UIMessageStreamResponse from consumed parts and the remaining stream
function createPreflightedResponse(uiStream: any, consumed: any[]) {
  const reader = uiStream.getReader();
  
  const customStream = new ReadableStream({
    async start(controller) {
      // 1. Enqueue the already consumed chunks
      for (const chunk of consumed) {
        controller.enqueue(chunk);
      }
    },
    async pull(controller) {
      // 2. Stream the rest of the chunks
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

  // Convert the custom UI stream of objects to an SSE Response
  // Vercel AI SDK 6.x's StreamData or response pipe helper can be used,
  // or we can format it exactly as SSE.
  // Wait, does result.toUIMessageStreamResponse() just call a helper?
  // Let's check!
  // In the AI SDK, there is a class or helper. Let's see how they pipe it.
}

async function run() {
  const configs = await getPrioritizedProviderConfigs();
  console.log("Configs found:", configs.map(c => c.provider));
  
  // Let's try simulating Groq (which fails/times out) and falling back to Google or Cerebras
  // Wait, we need to format the response to the client.
}

run();
