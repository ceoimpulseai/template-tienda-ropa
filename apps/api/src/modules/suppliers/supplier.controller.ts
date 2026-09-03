import type { Request, Response, NextFunction } from 'express';
import { supplierService } from './supplier.service.js';
import { createSupplierSchema, updateSupplierSchema } from '@template/shared';

export const supplierController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await supplierService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSupplierSchema.parse(req.body);
      const supplier = await supplierService.create(req.auth!.businessId!, input);
      res.status(201).json(supplier);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateSupplierSchema.parse(req.body);
      const supplier = await supplierService.update(req.auth!.businessId!, req.params.id!, input);
      res.json(supplier);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await supplierService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};