import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { branchController } from './branch.controller.js';

export const branchRoutes = Router();

branchRoutes.use(requireAuth, requireBusiness);
branchRoutes.get('/', requirePermission('branches:read'), branchController.list);
branchRoutes.post('/', requirePermission('branches:create'), branchController.create);
branchRoutes.delete('/:id', requirePermission('branches:delete'), branchController.remove);
