import type { NextFunction, Request, Response } from 'express';
import { BusinessMember } from '../modules/team/team.model.js';

export async function requireBusiness(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const member = await BusinessMember.findOne({ where: { userId: req.auth.userId } });
  if (!member) {
    return res.status(403).json({ error: 'NO_BUSINESS_MEMBERSHIP' });
  }

  req.auth.businessId = member.businessId;
  req.auth.memberId = member.id;
  req.auth.role = member.role;
  next();
}
