import { z } from 'zod';

export const businessSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  currencySymbol: z.string().default('$'),
  taxPercent: z.number().min(0).max(100).default(0),
});
export type Business = z.infer<typeof businessSchema>;

export const updateBusinessSchema = businessSchema
  .pick({ name: true, currencySymbol: true, taxPercent: true })
  .partial();
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
