import type { NextFunction, Request, Response } from 'express';
import { findMemberByUserId } from '../modules/team/team.repository.js';
import { tenantCache, makeMemberCacheKey } from '../lib/tenantCache.js';

export async function requireBusiness(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const cacheKey = makeMemberCacheKey(req.auth.userId);
  const cached = tenantCache.get(cacheKey);
  if (cached) {
    req.auth.businessId = cached.businessId;
    req.auth.memberId = cached.memberId;
    req.auth.role = cached.role;
    return next();
  }

  const member = await findMemberByUserId(req.auth.userId);
  if (!member) {
    return res.status(403).json({ error: 'NO_BUSINESS_MEMBERSHIP' });
  }

  tenantCache.set(cacheKey, {
    businessId: member.businessId,
    memberId: member.id,
    role: member.role,
  });

  req.auth.businessId = member.businessId;
  req.auth.memberId = member.id;
  req.auth.role = member.role;
  next();
}
