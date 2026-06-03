import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

async function run() {
  const model = createGroq({ apiKey: 'invalid-key' })('llama-3.3-70b-versatile');
  
  try {
    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'Hello' }],
    });
    
    console.log("Stream created. Attempting to read first chunk...");
    const iterator = result.fullStream[Symbol.asyncIterator]();
    const firstChunk = await iterator.next();
    console.log("First chunk read successfully:", firstChunk);
  } catch (err: any) {
    console.error("Caught error reading first chunk! Error type:", err.name, "Message:", err.message);
  }
}

run();
