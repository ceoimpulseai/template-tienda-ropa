import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../config/auth.js';
import { env } from '../config/env.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // ponytail: bypass de auth solo-test vía header, evita depender de un Postgres real
  // para better-auth en tests de integración. Si hace falta probar el login real
  // (better-auth end-to-end), usar una DB de test contra Postgres en vez de este atajo.
  // Seguridad: solo habilitado si TEST_AUTH_HEADER_ENABLED=true (default: false).
  const testUserId = req.header('X-Test-User-Id');
  if (env.TEST_AUTH_HEADER_ENABLED && testUserId) {
    req.auth = { userId: testUserId, userEmail: 'test@example.com' };
    return next();
  }

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    return res.status(401).json({ error: 'UNAUTHENTICATED' });
  }
  req.auth = { userId: session.user.id, userEmail: session.user.email };
  next();
}
