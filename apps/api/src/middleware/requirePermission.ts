import type { NextFunction, Request, Response } from 'express';
import { getPermissionsForRole } from '@template/shared';

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.role) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const userPermissions = getPermissionsForRole(req.auth.role);

    if (userPermissions.includes(permission as any)) {
      return next();
    }

    return res.status(403).json({ error: 'FORBIDDEN' });
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.role) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const userPermissions = getPermissionsForRole(req.auth.role);

    if (permissions.some((p) => userPermissions.includes(p as any))) {
      return next();
    }

    return res.status(403).json({ error: 'FORBIDDEN' });
  };
}

export function requireAllPermissions(permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth?.role) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const userPermissions = getPermissionsForRole(req.auth.role);

    if (permissions.every((p) => userPermissions.includes(p as any))) {
      return next();
    }

    return res.status(403).json({ error: 'FORBIDDEN' });
  };
}