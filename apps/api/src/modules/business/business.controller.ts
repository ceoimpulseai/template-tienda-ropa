import type { Request, Response, NextFunction } from 'express';
import { businessService } from './business.service.js';
import { updateBusinessSchema } from '@template/shared';

export const businessController = {
  async getCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await businessService.getById(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async updateCurrent(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateBusinessSchema.parse(req.body);
      res.json(await businessService.update(req.auth!.businessId!, input));
    } catch (err) {
      next(err);
    }
  },
};
