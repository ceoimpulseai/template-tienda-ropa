import { z } from 'zod';

export const supplierSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  // Campos de indumentaria
  garmentTypes: z.array(z.string()).optional().nullable(),
  minOrderQuantity: z.number().int().nonnegative().optional().nullable(),
  leadTimeDays: z.number().int().nonnegative().optional().nullable(),
});
export type Supplier = z.infer<typeof supplierSchema>;

export const createSupplierSchema = supplierSchema.pick({
  name: true,
  phone: true,
  email: true,
  address: true,
  notes: true,
  garmentTypes: true,
  minOrderQuantity: true,
  leadTimeDays: true,
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = createSupplierSchema.partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;