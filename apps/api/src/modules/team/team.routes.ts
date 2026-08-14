import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { teamController } from './team.controller.js';

export const teamRoutes = Router();

teamRoutes.use(requireAuth, requireBusiness);
teamRoutes.get('/', teamController.list);
teamRoutes.post('/', teamController.invite);
teamRoutes.delete('/:id', teamController.remove);
