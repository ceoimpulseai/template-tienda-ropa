import type { Request, Response, NextFunction } from 'express';
import { branchService } from './branch.service.js';
import { createBranchSchema, updateBranchSchema } from '@template/shared';
import { NotFoundError } from '../../lib/errors.js';

export const branchController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await branchService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createBranchSchema.parse(req.body);
      const branch = await branchService.create(req.auth!.businessId!, input);
      res.status(201).json(branch);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateBranchSchema.parse(req.body);
      const branch = await branchService.update(req.auth!.businessId!, req.params.id!, input);
      if (!branch) throw new NotFoundError('BRANCH_NOT_FOUND');
      res.json(branch);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await branchService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
