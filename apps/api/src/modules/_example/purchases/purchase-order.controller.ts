// EJEMPLO: adaptar a la lógica del rubro concreto.
import type { Request, Response, NextFunction } from 'express';
import { purchaseOrderService } from './purchase-order.service.js';
import { createPurchaseOrderSchema } from '@template/shared';

export const purchaseOrderController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await purchaseOrderService.list(req.auth!.businessId as string));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrder = await purchaseOrderService.getById(req.auth!.businessId as string, req.params.id as string);
      if (!purchaseOrder) {
        return res.status(404).json({ error: 'PURCHASE_ORDER_NOT_FOUND' });
      }
      res.json(purchaseOrder);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createPurchaseOrderSchema.parse(req.body);
      const branchId = req.auth!.branchId as string;
      const purchaseOrder = await purchaseOrderService.create(req.auth!.businessId as string, branchId, input);
      res.status(201).json(purchaseOrder);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrder = await purchaseOrderService.cancel(req.auth!.businessId as string, req.params.id as string);
      res.json(purchaseOrder);
    } catch (err) {
      next(err);
    }
  },
};