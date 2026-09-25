import { z } from 'zod';
import { roleSchema } from './user.js';

export const businessMemberSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  userId: z.string(),
  role: roleSchema,
});
export type BusinessMember = z.infer<typeof businessMemberSchema>;

export const inviteMemberSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: roleSchema.default('operator'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
