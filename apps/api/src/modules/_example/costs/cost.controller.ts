// EJEMPLO: adaptar a la lógica del rubro concreto.
import type { Request, Response, NextFunction } from 'express';
import { costService } from './cost.service.js';
import { createCostSchema } from '@template/shared';

export const costController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await costService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createCostSchema.parse(req.body);
      const cost = await costService.create(req.auth!.businessId!, input);
      res.status(201).json(cost);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await costService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
