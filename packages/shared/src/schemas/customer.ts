import { z } from 'zod';
import { issuerConditionEnum } from './arca.js';

export const customerSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  cuit: z.string().nullable().default(null),
  dni: z.string().nullable().default(null),
  vatCondition: issuerConditionEnum.nullable().default(null),
});
export type Customer = z.infer<typeof customerSchema>;

export const createCustomerSchema = customerSchema
  .pick({ name: true })
  .extend({ email: z.string().email().optional(), phone: z.string().optional() });
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
