import type { NextFunction, Request, Response } from 'express';
import { formatError } from '../lib/response.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const { statusCode, error } = formatError(err);
  res.status(statusCode).json({ success: false, error });
}
