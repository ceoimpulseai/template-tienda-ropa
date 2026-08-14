// EJEMPLO: adaptar a la lógica del rubro concreto.
import type { Request, Response, NextFunction } from 'express';
import { purchaseService } from './purchase.service.js';
import { createPurchaseSchema } from '@template/shared';

export const purchaseController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await purchaseService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPurchaseSchema.parse(req.body);
      const purchase = await purchaseService.create(req.auth!.businessId!, req.auth!.branchId!, input);
      res.status(201).json(purchase);
    } catch (err) {
      next(err);
    }
  },
};
