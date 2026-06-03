import { convertToModelMessages } from 'ai';

async function run() {
  const messages = [
    { role: 'user', content: 'Say hello in 5 words!' }
  ];

  const sanitizedMessages = messages.map((msg: any) => {
    if (!msg.parts && typeof msg.content === 'string') {
      return {
        ...msg,
        parts: [{ type: 'text', text: msg.content }]
      };
    }
    return msg;
  });

  try {
    const modelMessages = await convertToModelMessages(sanitizedMessages);
    console.log("Success! Converted messages:", JSON.stringify(modelMessages, null, 2));
  } catch (err) {
    console.error("Conversion failed:", err);
  }
}

run();
