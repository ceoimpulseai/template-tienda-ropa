import { z } from 'zod';

export const roleSchema = z.enum(['admin', 'manager', 'operator', 'viewer']);
export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
});
export type User = z.infer<typeof userSchema>;
