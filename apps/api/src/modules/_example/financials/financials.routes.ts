// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../../middleware/requireAuth.js';
import { requireBusiness } from '../../../middleware/requireBusiness.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { financialsController } from './financials.controller.js';

export const financialsRoutes = Router();

financialsRoutes.use(requireAuth, requireBusiness);
financialsRoutes.get('/income-statement', requirePermission('financials:read'), financialsController.getIncomeStatement);
financialsRoutes.get('/break-even', requirePermission('financials:read'), financialsController.getBreakEven);
financialsRoutes.get('/product-margins', requirePermission('financials:read'), financialsController.getProductMargins);
financialsRoutes.get('/ratios', requirePermission('financials:read'), financialsController.getRatios);