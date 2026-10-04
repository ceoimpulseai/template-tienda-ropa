import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

// Load .env from project root
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: path.resolve(projectRoot, '.env') });

const DEV_ARCA_MASTER_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().default('http://localhost:3000'),
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
  TEST_AUTH_HEADER_ENABLED: z.coerce.boolean().default(false),
  ARCA_MASTER_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/).default(DEV_ARCA_MASTER_KEY),
  ARCA_TIMEOUT_MS: z.coerce.number().default(20_000),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production' && data.BETTER_AUTH_SECRET === 'dev-secret-change-me') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['BETTER_AUTH_SECRET'],
      message: 'BETTER_AUTH_SECRET must be set to a real secret in production (refusing to boot with the dev default).',
    });
  }
  if (data.NODE_ENV === 'production' && data.ARCA_MASTER_KEY === DEV_ARCA_MASTER_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ARCA_MASTER_KEY'],
      message: 'ARCA_MASTER_KEY must be set to a real 64-char hex key in production (refusing to boot with the dev default).',
    });
  }
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
