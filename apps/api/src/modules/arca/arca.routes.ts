import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requireBranch } from '../../middleware/requireBranch.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { arcaController } from './arca.controller.js';

export const arcaRoutes = Router();

arcaRoutes.use(requireAuth, requireBusiness);

arcaRoutes.get('/business/arca', requirePermission('business:read'), arcaController.getConfig);
arcaRoutes.put('/business/arca', requirePermission('business:update'), arcaController.updateConfig);
arcaRoutes.post('/sales/:id/issue', requireBranch, requirePermission('sales:update'), arcaController.issue);
arcaRoutes.get('/sales/:id/arca-voucher', requirePermission('sales:read'), arcaController.getVoucher);