import type { Request, Response, NextFunction } from 'express';
import { catalogService } from './catalog.service.js';

export const catalogController = {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const catalog = await catalogService.getById(req.params.businessId!);
      if (!catalog) {
        return res.status(404).json({ error: 'CATALOG_NOT_FOUND' });
      }
      res.json(catalog);
    } catch (err) {
      next(err);
    }
  },
};
