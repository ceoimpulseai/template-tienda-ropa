import type { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service.js';
import { createCustomerSchema } from '@template/shared';

export const customerController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createCustomerSchema.parse(req.body);
      const customer = await customerService.create(req.auth!.businessId!, input);
      res.status(201).json(customer);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
