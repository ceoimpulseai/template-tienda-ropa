// EJEMPLO: adaptar a la lógica del rubro concreto.
import type { Request, Response, NextFunction } from 'express';
import { saleService } from './sale.service.js';
import { createSaleSchema } from '@template/shared';

export const saleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await saleService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSaleSchema.parse(req.body);
      const sale = await saleService.create(req.auth!.businessId!, req.auth!.branchId!, input);
      res.status(201).json(sale);
    } catch (err) {
      next(err);
    }
  },
};
