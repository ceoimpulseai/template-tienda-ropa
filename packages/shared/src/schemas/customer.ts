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
  // Campos de indumentaria
  preferredSizes: z.record(z.string()).optional().nullable(),
  preferredCategories: z.array(z.string()).optional().nullable(),
  fitNotes: z.string().optional().nullable(),
});
export type Customer = z.infer<typeof customerSchema>;

export const createCustomerSchema = customerSchema
  .pick({ name: true })
  .extend({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    preferredSizes: z.record(z.string()).optional(),
    preferredCategories: z.array(z.string()).optional(),
    fitNotes: z.string().optional(),
  });
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = customerSchema
  .pick({
    name: true,
    email: true,
    phone: true,
    cuit: true,
    dni: true,
    vatCondition: true,
    preferredSizes: true,
    preferredCategories: true,
    fitNotes: true,
  })
  .partial();
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;