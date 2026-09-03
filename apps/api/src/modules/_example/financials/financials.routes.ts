// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../../middleware/requireAuth.js';
import { requireBusiness } from '../../../middleware/requireBusiness.js';
import { financialsController } from './financials.controller.js';

export const financialsRoutes = Router();

financialsRoutes.use(requireAuth, requireBusiness);
financialsRoutes.get('/income-statement', financialsController.getIncomeStatement);
financialsRoutes.get('/break-even', financialsController.getBreakEven);
financialsRoutes.get('/product-margins', financialsController.getProductMargins);
financialsRoutes.get('/ratios', financialsController.getRatios);