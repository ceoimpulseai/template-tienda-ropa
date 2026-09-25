import type { NextFunction, Request, Response } from 'express';
import { Branch } from '../modules/branches/branch.model.js';
import { branchCache, makeBranchCacheKey } from '../lib/tenantCache.js';

export async function requireBranch(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.businessId) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const headerBranchId = req.header('X-Branch-Id');
  const cacheKey = makeBranchCacheKey(req.auth.businessId, headerBranchId ?? 'default');
  const cached = branchCache.get(cacheKey);
  if (cached) {
    req.auth.branchId = cached.branchId!;
    return next();
  }

  const branch = headerBranchId
    ? await Branch.findOne({ where: { id: headerBranchId, businessId: req.auth.businessId } })
    : await Branch.findOne({ where: { businessId: req.auth.businessId, isDefault: true } });

  if (!branch) {
    branchCache.set(cacheKey, { branchId: null });
    return res.status(400).json({ error: 'BRANCH_REQUIRED' });
  }

  branchCache.set(cacheKey, { branchId: branch.id });
  req.auth.branchId = branch.id;
  next();
}
