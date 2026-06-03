import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getPrioritizedProviderConfigs } from '../lib/aiProvider.ts';

async function run() {
  const configs = await getPrioritizedProviderConfigs();
  const googleConfig = configs.find(c => c.provider === 'google');
  if (!googleConfig || !googleConfig.apiKey) {
    console.log("No Google Gemini key found to run test");
    return;
  }
  
  const model = createGoogleGenerativeAI({ apiKey: googleConfig.apiKey })('gemini-2.0-flash');
  
  try {
    const result = await streamText({
      model,
      messages: [{ role: 'user', content: 'Say hello in 3 words' }]
    });
    
    console.log("Getting toUIMessageStream()...");
    const uiStream = result.toUIMessageStream();
    const reader = uiStream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log("PART:", JSON.stringify(value));
    }
  } catch (err) {
    console.error("UI Stream reading failed:", err);
  }
}

run();
