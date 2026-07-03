import fs from 'fs';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';

// Read .env.local manually without external dependencies
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
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    process.env[key] = value;
  });
} catch (e) {
  console.log("Warning: Could not read .env.local file. Relying on current system environment variables.");
}

const configs = [
  {
    name: 'Google Gemini (gemini-2.0-flash)',
    provider: 'google',
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
    getModel: (key) => createGoogleGenerativeAI({ apiKey: key })('gemini-2.0-flash')
  },
  {
    name: 'Groq (llama-3.3-70b-versatile)',
    provider: 'groq',
    apiKey: process.env.GROQ_API_KEY,
    getModel: (key) => createGroq({ apiKey: key })('llama-3.3-70b-versatile')
  },
  {
    name: 'Cerebras (gpt-oss-120b)',
    provider: 'cerebras',
    apiKey: process.env.CEREBRAS_API_KEY,
    getModel: (key) => createOpenAI({
      baseURL: 'https://api.cerebras.ai/v1',
      apiKey: key,
    }).chat('gpt-oss-120b')
  },
  {
    name: 'OpenRouter (meta-llama/llama-3.3-70b-instruct)',
    provider: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    getModel: (key) => createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: key,
    }).chat('meta-llama/llama-3.3-70b-instruct')
  }
];

async function testAll() {
  console.log("Starting production AI provider validation tests...\n");
  for (const config of configs) {
    console.log(`=== Testing ${config.name} ===`);
    if (!config.apiKey) {
      console.log("Skipping: No API key found in environment.\n");
      continue;
    }
    console.log(`API Key: ${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}`);
    try {
      const model = config.getModel(config.apiKey);
      const start = Date.now();
      const { text } = await generateText({
        model,
        messages: [{ role: 'user', content: 'Say healthy' }],
        maxRetries: 0
      });
      const elapsed = Date.now() - start;
      console.log(`Status: SUCCESS! Latency: ${elapsed}ms. Response: "${text.trim()}"\n`);
    } catch (err) {
      console.log(`Status: FAILED. Error: ${err.message}\n`);
    }
  }
}

testAll();
