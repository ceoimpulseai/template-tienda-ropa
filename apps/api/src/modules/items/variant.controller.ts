import type { Request, Response, NextFunction } from 'express';
import { variantService } from './variant.service.js';
import { createVariantSchema, updateVariantSchema } from '@template/shared';

export const variantController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await variantService.list(req.auth!.businessId!, req.params.itemId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createVariantSchema.parse(req.body);
      const variant = await variantService.create(req.auth!.businessId!, req.params.itemId!, input);
      res.status(201).json(variant);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const variant = await variantService.getById(req.auth!.businessId!, req.params.id!);
      res.json(variant);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateVariantSchema.parse(req.body);
      const variant = await variantService.update(req.auth!.businessId!, req.params.id!, input);
      res.json(variant);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await variantService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};