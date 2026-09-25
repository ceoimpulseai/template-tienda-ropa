// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../../middleware/requireAuth.js';
import { requireBusiness } from '../../../middleware/requireBusiness.js';
import { requirePermission } from '../../../middleware/requirePermission.js';
import { costController } from './cost.controller.js';

export const costRoutes = Router();

costRoutes.use(requireAuth, requireBusiness);
costRoutes.get('/', requirePermission('costs:read'), costController.list);
costRoutes.post('/', requirePermission('costs:create'), costController.create);
costRoutes.delete('/:id', requirePermission('costs:delete'), costController.remove);
