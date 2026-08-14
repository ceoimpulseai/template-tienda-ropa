// EJEMPLO: adaptar a la lógica del rubro concreto.
import type { Request, Response, NextFunction } from 'express';
import { metricsService } from './metrics.service.js';

export const metricsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await metricsService.dashboard(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },
};
