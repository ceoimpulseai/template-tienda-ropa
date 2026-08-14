import type { NextFunction, Request, Response } from 'express';
import { Branch } from '../modules/branches/branch.model.js';

export async function requireBranch(req: Request, res: Response, next: NextFunction) {
  if (!req.auth?.businessId) return res.status(401).json({ error: 'UNAUTHENTICATED' });

  const headerBranchId = req.header('X-Branch-Id');
  const branch = headerBranchId
    ? await Branch.findOne({ where: { id: headerBranchId, businessId: req.auth.businessId } })
    : await Branch.findOne({ where: { businessId: req.auth.businessId, isDefault: true } });

  if (!branch) {
    return res.status(400).json({ error: 'BRANCH_REQUIRED' });
  }

  req.auth.branchId = branch.id;
  next();
}
