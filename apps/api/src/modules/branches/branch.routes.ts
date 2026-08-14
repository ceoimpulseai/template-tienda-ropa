import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { branchController } from './branch.controller.js';

export const branchRoutes = Router();

branchRoutes.use(requireAuth, requireBusiness);
branchRoutes.get('/', branchController.list);
branchRoutes.post('/', branchController.create);
branchRoutes.delete('/:id', branchController.remove);
