import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { itemController } from './item.controller.js';

export const itemRoutes = Router();

itemRoutes.use(requireAuth, requireBusiness);
itemRoutes.get('/', itemController.list);
itemRoutes.post('/', itemController.create);
itemRoutes.patch('/:id', itemController.update);
itemRoutes.delete('/:id', itemController.remove);
