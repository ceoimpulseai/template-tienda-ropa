import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().default('dev-secret-change-me'),
  BETTER_AUTH_URL: z.string().default('http://localhost:4000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default('no-reply@template.local'),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production' && data.BETTER_AUTH_SECRET === 'dev-secret-change-me') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['BETTER_AUTH_SECRET'],
      message: 'BETTER_AUTH_SECRET must be set to a real secret in production (refusing to boot with the dev default).',
    });
  }
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
