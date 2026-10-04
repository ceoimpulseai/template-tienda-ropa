import { z } from 'zod';
import { issuerConditionEnum, arcaEnvironmentEnum } from './arca.js';

export const businessSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  currencySymbol: z.string().default('$'),
  taxPercent: z.number().min(0).max(100).default(0),
  catalogWhatsapp: z.string().nullable().default(null),
  taxId: z.string().nullable().default(null),
  issuerCondition: issuerConditionEnum.nullable().default(null),
  arcaEnvironment: arcaEnvironmentEnum.default('homologation'),
  arcaCertPem: z.string().nullable().default(null),
  arcaPrivateKeyPem: z.string().nullable().default(null),
  // Branding / tienda pública
  displayName: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  logoPublicId: z.string().optional().nullable(),
  coverPublicId: z.string().optional().nullable(),
  themeConfig: z.record(z.unknown()).optional().nullable(),
  shippingPolicy: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  socialLinks: z.record(z.string()).optional().nullable(),
});
export type Business = z.infer<typeof businessSchema>;

export const updateBusinessSchema = businessSchema
  .pick({
    name: true,
    currencySymbol: true,
    taxPercent: true,
    catalogWhatsapp: true,
    displayName: true,
    description: true,
    logoPublicId: true,
    coverPublicId: true,
    themeConfig: true,
    shippingPolicy: true,
    returnPolicy: true,
    socialLinks: true,
  })
  .partial();
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;