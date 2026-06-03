const keys = [
  'GROQ_API_KEY',
  'CEREBRAS_API_KEY',
  'OPENROUTER_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GEMINI_API_KEY'
];

console.log("Checking process environment variables:");
keys.forEach(k => {
  const val = process.env[k];
  console.log(`- ${k}: ${val ? 'DEFINED (len=' + val.length + ')' : 'UNDEFINED'}`);
});
