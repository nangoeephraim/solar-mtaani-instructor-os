// Import ESM using dynamic import since package.json has "type": "module"
// but we want to run this check simply. Let's write it as a .js file and use import.

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

console.log("Tool object keys:", Object.keys(getInventoryStock));
console.log("Tool parameters:", JSON.stringify(getInventoryStock.parameters, null, 2));
