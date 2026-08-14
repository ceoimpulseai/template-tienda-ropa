// EJEMPLO: adaptar a la lógica del rubro concreto.
import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { costController } from './cost.controller.js';

export const costRoutes = Router();

costRoutes.use(requireAuth, requireBusiness);
costRoutes.get('/', costController.list);
costRoutes.post('/', costController.create);
costRoutes.delete('/:id', costController.remove);
