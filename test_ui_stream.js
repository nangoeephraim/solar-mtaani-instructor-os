import fs from 'fs';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Read .env.local manually
try {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    let value = trimmed.substring(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  });
} catch (e) {
  console.log("Could not load env", e);
}

async function testStream() {
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!geminiKey) {
    console.log("No Google API Key found");
    return;
  }

  const model = createGoogleGenerativeAI({ apiKey: geminiKey })('gemini-2.5-flash');
  
  try {
    console.log("Calling streamText with Gemini...");
    const result = streamText({
      model,
      system: "You are a helpful assistant.",
      messages: [{ role: 'user', content: 'Say hello in one word' }],
      maxRetries: 0
    });

    const uiStream = result.toUIMessageStream();
    const reader = uiStream.getReader();

    console.log("Reading chunks from toUIMessageStream:\n");
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log("\nStream done.");
        break;
      }
      console.log(`- Type: ${typeof value}`);
      console.log(`- IsArray: ${Array.isArray(value)}`);
      console.log(`- Value:`, JSON.stringify(value), "\n");
    }
  } catch (err) {
    console.error("Stream error:", err);
  }
}

testStream();
