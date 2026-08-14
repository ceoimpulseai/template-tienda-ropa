// EJEMPLO: entidad genérica de referencia para los módulos de ejemplo (purchases/sales/costs).
// Reemplazar por las entidades reales del rubro adaptado.
import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
});
export type Item = z.infer<typeof itemSchema>;

export const createItemSchema = itemSchema.pick({ name: true, price: true, stock: true });
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const purchaseSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  branchId: z.string(),
  itemId: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
});
export type Purchase = z.infer<typeof purchaseSchema>;

export const createPurchaseSchema = purchaseSchema.pick({
  itemId: true,
  quantity: true,
  unitCost: true,
});
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const saleSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  branchId: z.string(),
  itemId: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});
export type Sale = z.infer<typeof saleSchema>;

export const createSaleSchema = saleSchema.pick({ itemId: true, quantity: true, unitPrice: true });
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const costTypeSchema = z.enum(['fixed', 'variable']);
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
