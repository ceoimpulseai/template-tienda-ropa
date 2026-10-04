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
  // Campos de indumentaria
  category: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  season: z.array(z.string()).optional().nullable(),
  material: z.array(z.string()).optional().nullable(),
  careInstructions: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});
export type Item = z.infer<typeof itemSchema>;

export const createItemSchema = itemSchema
  .pick({ name: true, price: true, stock: true })
  .extend({
    visibleInCatalog: z.boolean().optional(),
    category: z.string().optional(),
    gender: z.string().optional(),
    season: z.array(z.string()).optional(),
    material: z.array(z.string()).optional(),
    careInstructions: z.string().optional(),
    brand: z.string().optional(),
    description: z.string().optional(),
  });
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = itemSchema
  .pick({
    name: true,
    price: true,
    stock: true,
    visibleInCatalog: true,
    category: true,
    gender: true,
    season: true,
    material: true,
    careInstructions: true,
    brand: true,
    description: true,
  })
  .partial();
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// Variant schemas
export const variantSchema = z.object({
  id: z.string(),
  businessId: z.string(),
  itemId: z.string(),
  size: z.string().min(1),
  color: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  sku: z.string().min(1),
  price: z.number().nonnegative().optional().nullable(),
  stock: z.number().int().nonnegative().default(0),
  imagePublicId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});
export type Variant = z.infer<typeof variantSchema>;

export const createVariantSchema = variantSchema
  .pick({ itemId: true, size: true, color: true, sku: true })
  .extend({
    colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    price: z.number().nonnegative().optional(),
    stock: z.number().int().nonnegative().optional(),
    imagePublicId: z.string().optional(),
    isActive: z.boolean().optional(),
  });
export type CreateVariantInput = z.infer<typeof createVariantSchema>;

export const updateVariantSchema = variantSchema
  .pick({ size: true, color: true, colorHex: true, sku: true, price: true, stock: true, imagePublicId: true, isActive: true })
  .partial();
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;