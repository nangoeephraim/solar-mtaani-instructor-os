import { getPrioritizedProviderConfigs } from '../lib/aiProvider.ts';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

async function run() {
  const configs = await getPrioritizedProviderConfigs();
  console.log("Resolved configs count:", configs.length);
  
  // Find a config with a non-empty key to test
  const googleConfig = configs.find(c => c.provider === 'google');
  if (!googleConfig || !googleConfig.apiKey) {
    console.log("Google Gemini API key not found in configs");
    return;
  }
  
  console.log("Using Google Gemini provider to test a valid stream...");
  const model = createGoogleGenerativeAI({ apiKey: googleConfig.apiKey })('gemini-2.0-flash');
  
  try {
    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'Say hi!' }],
    });
    
    console.log("Stream created. Fetching UI response stream...");
    const response = result.toUIMessageStreamResponse();
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const reader = response.body?.getReader();
    if (!reader) {
      console.log("No response body reader available");
      return;
    }
    
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log("CHUNK:", JSON.stringify(decoder.decode(value)));
    }
  } catch (err) {
    console.error("Test stream failed:", err);
  }
}

run();
