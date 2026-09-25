import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { teamController } from './team.controller.js';

export const teamRoutes = Router();

teamRoutes.use(requireAuth, requireBusiness);
teamRoutes.get('/', requirePermission('team:read'), teamController.list);
teamRoutes.post('/', requirePermission('team:invite'), teamController.invite);
teamRoutes.delete('/:id', requirePermission('team:remove'), teamController.remove);
