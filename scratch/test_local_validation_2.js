import { tool } from 'ai';
import { z } from 'zod';

const getInventoryStock = tool({
  description: 'Lookup the current available stock for training materials and equipment at a specific location.',
  parameters: z.object({
    locationName: z.string().optional().describe('The training location (e.g. Kibera)'),
    location_name: z.string().optional().describe('The training location (e.g. Kibera)'),
    location: z.string().optional().describe('The training location (e.g. Kibera)'),
    itemName: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
    item_name: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
    item: z.string().optional().describe('Specific item name to check (e.g. Multimeter)'),
  }),
  execute: async (args) => {
    return { ok: true };
  }
});

const result = getInventoryStock.parameters['~standard'].validate({ location: "Kibera", item: "multimeter" });
console.log("Validation result:", JSON.stringify(result, null, 2));
