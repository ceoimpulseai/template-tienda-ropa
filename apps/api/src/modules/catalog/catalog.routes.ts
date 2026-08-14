import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { catalogController } from './catalog.controller.js';

// A propósito SIN requireAuth/requireBusiness: este es el storefront público
// (GET /api/catalog/:businessId), no un módulo autenticado. No copiar el middleware
// de auth de un módulo hermano acá — eso rompería el caso de uso.
export const catalogRoutes = Router();

// ponytail: rate limiter en memoria (Map<ip, {count, resetAt}>), ventana fija.
// Ceiling: es por-proceso — se resetea al reiniciar y no coordina entre
// múltiples instancias. Alcanza para dev/una sola instancia. Si se escala
// horizontalmente, reemplazar por un store compartido (ej. Redis).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'TOO_MANY_REQUESTS' });
  }

  entry.count += 1;
  next();
}

catalogRoutes.get('/:businessId', rateLimit, catalogController.getById);
