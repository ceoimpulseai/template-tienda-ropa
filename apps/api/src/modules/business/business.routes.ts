import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { businessController } from './business.controller.js';

export const businessRoutes = Router();

businessRoutes.use(requireAuth, requireBusiness);
businessRoutes.get('/', requirePermission('business:read'), businessController.getCurrent);
businessRoutes.patch('/', requirePermission('business:update'), businessController.updateCurrent);
