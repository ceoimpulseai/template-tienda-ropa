// EJEMPLO: schemas de referencia para los módulos de ejemplo (purchases/sales/costs).
// Reemplazar por los schemas reales del rubro adaptado. La entidad `Item` en sí
// es genérica y vive en `./item.ts`.
import { z } from 'zod';

export const purchaseSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  branchId: z.string(),
  itemId: z.string(),
  supplierId: z.string().nullable(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

export const createPurchaseSchema = purchaseSchema.pick({
  itemId: true,
  quantity: true,
  unitCost: true,
}).extend({ supplierId: z.string().optional() });
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const saleSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  branchId: z.string(),
  itemId: z.string(),
  customerId: z.string().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  isInternal: z.boolean(),
  amountReceived: z.number().nonnegative(),
});
export type Sale = z.infer<typeof saleSchema>;

export const createSaleSchema = saleSchema
  .pick({ itemId: true, quantity: true, unitPrice: true })
  .extend({
    customerId: z.string().optional(),
    isInternal: z.boolean().optional().default(false),
    amountReceived: z.number().nonnegative().optional(),
  });
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const costTypeSchema = z.enum(['fixed', 'variable', 'extraordinary']);
export type CostType = z.infer<typeof costTypeSchema>;

export const costSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  type: costTypeSchema,
  label: z.string().min(1),
  amount: z.number().nonnegative(),
});
export type Cost = z.infer<typeof costSchema>;

export const createCostSchema = costSchema.pick({ type: true, label: true, amount: true });
export type CreateCostInput = z.infer<typeof createCostSchema>;
