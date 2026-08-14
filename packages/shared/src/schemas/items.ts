// Entidad genérica: catálogo de items de un negocio. Se mantiene entre forks del
// template porque purchases, sales y el catálogo público dependen de ella.
import { z } from 'zod';

export const itemSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  name: z.string().min(1),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  visibleInCatalog: z.boolean().default(false),
});
export type Item = z.infer<typeof itemSchema>;

export const createItemSchema = itemSchema
  .pick({ name: true, price: true, stock: true })
  .extend({ visibleInCatalog: z.boolean().optional() });
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = itemSchema
  .pick({ name: true, price: true, stock: true, visibleInCatalog: true })
  .partial();
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
