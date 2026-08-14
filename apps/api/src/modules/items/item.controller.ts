import type { Request, Response, NextFunction } from 'express';
import { itemService } from './item.service.js';
import { createItemSchema, updateItemSchema } from '@template/shared';

export const itemController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await itemService.list(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createItemSchema.parse(req.body);
      const item = await itemService.create(req.auth!.businessId!, input);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = updateItemSchema.parse(req.body);
      const item = await itemService.update(req.auth!.businessId!, req.params.id!, input);
      res.json(item);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await itemService.remove(req.auth!.businessId!, req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};
