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
});
export type Business = z.infer<typeof businessSchema>;

export const updateBusinessSchema = businessSchema
  .pick({ name: true, currencySymbol: true, taxPercent: true, catalogWhatsapp: true })
  .partial();
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
