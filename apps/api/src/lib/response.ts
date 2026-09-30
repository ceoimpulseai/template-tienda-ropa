import type { Response } from 'express';
import { ZodError } from 'zod';
import { AppError, isAppError } from './errors.js';

interface FormattedError {
  code: string;
  message: string;
  details?: any;
}

function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError || (err && typeof err === 'object' && 'issues' in err && Array.isArray((err as any).issues));
}

function formatZodError(err: ZodError): { fields: Record<string, string> } {
  const flat = err.flatten();
  const fields: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages && messages.length > 0) {
      fields[key] = messages.join(', ');
    }
  }
  return { fields };
}

export function formatError(err: unknown): { statusCode: number; error: FormattedError } {
  if (isAppError(err)) {
    const body: FormattedError = { code: err.code, message: err.message };
    if (err.details !== undefined) body.details = err.details;
    return { statusCode: err.statusCode, error: body };
  }
  if (isZodError(err)) {
    return {
      statusCode: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: formatZodError(err),
      },
    };
  }
  console.error('[UnhandledError]', err);
  return {
    statusCode: 500,
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
  };
}

export function sendError(res: Response, err: unknown) {
  const { statusCode, error } = formatError(err);
  return res.status(statusCode).json({ success: false, error });
}