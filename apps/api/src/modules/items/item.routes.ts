import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { itemController } from './item.controller.js';

export const itemRoutes = Router();

itemRoutes.use(requireAuth, requireBusiness);
itemRoutes.get('/', requirePermission('items:read'), itemController.list);
itemRoutes.post('/', requirePermission('items:create'), itemController.create);
itemRoutes.patch('/:id', requirePermission('items:update'), itemController.update);
itemRoutes.delete('/:id', requirePermission('items:delete'), itemController.remove);
