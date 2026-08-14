import { z } from 'zod';

export const branchSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1),
  isDefault: z.boolean().default(false),
});
export type Branch = z.infer<typeof branchSchema>;

export const createBranchSchema = branchSchema.pick({ name: true });
export type CreateBranchInput = z.infer<typeof createBranchSchema>;
