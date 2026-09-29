import { z } from 'zod';

export const issuerConditionEnum = z.enum([
  'IVA Responsable Inscripto',
  'IVA Responsable No Inscripto',
  'IVA No Responsable',
  'IVA Sujeto Exento',
  'Consumidor Final',
  'Responsable Monotributo',
  'Sujeto No Categorizado',
  'Proveedor del Exterior',
  'Cliente del Exterior',
  'Liberado - Ley 19.640',
  'IVA Responsable Inscripto - Agente de Percepción',
  'Pequeño Contribuyente Eventual',
  'Monotributista Social',
  'Pequeño Contribuyente Eventual Social',
]);

export type IssuerCondition = z.infer<typeof issuerConditionEnum>;

export const arcaEnvironmentEnum = z.enum(['production', 'homologation']);

export type ArcaEnvironment = z.infer<typeof arcaEnvironmentEnum>;

const baseArcaConfigSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/, 'CUIT must be exactly 11 digits'),
  issuerCondition: issuerConditionEnum,
  arcaEnvironment: arcaEnvironmentEnum,
  certPem: z.string().optional(),
  keyPem: z.string().optional(),
});

export const arcaConfigSchema = baseArcaConfigSchema.superRefine((data, ctx) => {
  const hasCert = Boolean(data.certPem);
  const hasKey = Boolean(data.keyPem);
  if (hasCert !== hasKey) {
    if (hasCert) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['keyPem'],
        message: 'keyPem is required when certPem is provided',
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['certPem'],
        message: 'certPem is required when keyPem is provided',
      });
    }
  }
});

export type ArcaConfig = z.infer<typeof arcaConfigSchema>;

export const arcaUpdateSchema = baseArcaConfigSchema.partial().superRefine((data, ctx) => {
  const hasCert = Boolean(data.certPem);
  const hasKey = Boolean(data.keyPem);
  if (hasCert !== hasKey) {
    if (hasCert) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['keyPem'],
        message: 'keyPem is required when certPem is provided',
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['certPem'],
        message: 'certPem is required when keyPem is provided',
      });
    }
  }
});

export type ArcaUpdateInput = z.infer<typeof arcaUpdateSchema>;