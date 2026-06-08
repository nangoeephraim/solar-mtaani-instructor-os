import { asSchema } from '@ai-sdk/provider-utils';
import { z } from 'zod';

const schema = asSchema(z.object({
  locationName: z.string().optional(),
  location_name: z.string().optional(),
  location: z.string().optional(),
  itemName: z.string().optional(),
  item_name: z.string().optional(),
  item: z.string().optional(),
}));

console.log("asSchema output keys:", Object.keys(schema));
console.log("asSchema output value:", JSON.stringify(schema, null, 2));
if (schema.jsonSchema) {
  console.log("JSON Schema:", JSON.stringify(schema.jsonSchema, null, 2));
}
