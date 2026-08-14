import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ConflictError, NotFoundError } from '../lib/errors.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.flatten() });
  }
  if (err instanceof ConflictError) {
    return res.status(409).json({ error: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'INTERNAL_ERROR' });
}
