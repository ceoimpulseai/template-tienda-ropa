import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { variantController } from './variant.controller.js';

export const variantRoutes = Router();

variantRoutes.use(requireAuth, requireBusiness);
variantRoutes.get('/:itemId/variants', requirePermission('variants:read'), variantController.list);
variantRoutes.post('/:itemId/variants', requirePermission('variants:create'), variantController.create);
variantRoutes.get('/:itemId/variants/:id', requirePermission('variants:read'), variantController.getById);
variantRoutes.patch('/:itemId/variants/:id', requirePermission('variants:update'), variantController.update);
variantRoutes.delete('/:itemId/variants/:id', requirePermission('variants:delete'), variantController.remove);