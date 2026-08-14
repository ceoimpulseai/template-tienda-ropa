import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { businessController } from './business.controller.js';

export const businessRoutes = Router();

businessRoutes.use(requireAuth, requireBusiness);
businessRoutes.get('/', businessController.getCurrent);
businessRoutes.patch('/', businessController.updateCurrent);
