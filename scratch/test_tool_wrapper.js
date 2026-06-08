import { tool as aiTool } from 'ai';
import { z } from 'zod';
import { asSchema } from '@ai-sdk/provider-utils';

const tool = (options) => {
  if (options.parameters && typeof options.parameters.passthrough === 'function') {
    options.parameters = options.parameters.passthrough();
  }
  return aiTool(options);
};

const getInventoryStock = tool({
  description: 'Lookup...',
  parameters: z.object({
    location: z.string().optional()
  }),
  execute: async (args) => {}
});

const schema = asSchema(getInventoryStock.parameters);
console.log("JSON Schema:", JSON.stringify(schema.jsonSchema, null, 2));
