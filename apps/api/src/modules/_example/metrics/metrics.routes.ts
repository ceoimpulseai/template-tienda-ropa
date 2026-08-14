// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../../middleware/requireAuth.js';
import { requireBusiness } from '../../../middleware/requireBusiness.js';
import { metricsController } from './metrics.controller.js';

export const metricsRoutes = Router();

metricsRoutes.use(requireAuth, requireBusiness);
metricsRoutes.get('/dashboard', metricsController.dashboard);
