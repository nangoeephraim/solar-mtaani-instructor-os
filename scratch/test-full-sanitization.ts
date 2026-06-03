import { convertToModelMessages } from 'ai';

function sanitizeMessage(msg: any): any {
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg;
  }

  const parts: any[] = [];

  if (typeof msg.content === 'string' && msg.content.trim() !== '') {
    parts.push({
      type: 'text',
      text: msg.content
    });
  }

  if (msg.toolInvocations && Array.isArray(msg.toolInvocations)) {
    for (const toolInv of msg.toolInvocations) {
      parts.push({
        type: 'dynamic-tool',
        toolCallId: toolInv.toolCallId,
        toolName: toolInv.toolName,
        state: toolInv.state,
        input: toolInv.input,
        output: toolInv.result,
        errorText: toolInv.errorText
      });
    }
  }

  return {
    ...msg,
    parts
  };
}

async function run() {
  const messages = [
    { role: 'user', content: 'Check the multimeter stock in Kibera' },
    {
      role: 'assistant',
      content: 'Let me look that up for you.',
      toolInvocations: [
        {
          toolCallId: 'call-123',
          toolName: 'getInventoryStock',
          state: 'output-available',
          input: { locationName: 'Kibera' },
          result: { inventory: [{ item_name: 'Multimeter', quantity: 5 }] }
        }
      ]
    },
    { role: 'user', content: 'Great, thank you!' }
  ];

  const sanitizedMessages = messages.map(sanitizeMessage);

  try {
    const modelMessages = await convertToModelMessages(sanitizedMessages);
    console.log("Success! Converted messages:", JSON.stringify(modelMessages, null, 2));
  } catch (err) {
    console.error("Conversion failed:", err);
  }
}

run();
