import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

async function run() {
  const model = createGroq({ apiKey: 'invalid-key' })('llama-3.3-70b-versatile');
  
  try {
    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'Hello' }],
    });
    
    console.log("StreamTextResult keys:", Object.keys(result));
    console.log("StreamTextResult constructor/prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
    
    // Let's inspect if we can check errors or catch them
    // E.g., result.text or other properties.
  } catch (err) {
    console.error("Caught error directly from streamText:", err);
  }
}

run();
