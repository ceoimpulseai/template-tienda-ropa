// EJEMPLO: adaptar a la lógica del rubro concreto.
import type { Request, Response, NextFunction } from 'express';
import { financialsService } from './financials.service.js';

export const financialsController = {
  async getIncomeStatement(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await financialsService.incomeStatement(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async getBreakEven(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await financialsService.breakEven(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async getProductMargins(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await financialsService.productMargins(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },

  async getRatios(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await financialsService.ratios(req.auth!.businessId!));
    } catch (err) {
      next(err);
    }
  },
};