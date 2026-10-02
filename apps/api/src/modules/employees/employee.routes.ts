import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { employeeController } from './employee.controller.js';

export const employeeRoutes = Router();

employeeRoutes.use(requireAuth, requireBusiness);
employeeRoutes.get('/', requirePermission('employees:read'), employeeController.list);
employeeRoutes.get('/schedules', requirePermission('employees:read'), employeeController.getSchedules);
employeeRoutes.get('/:id', requirePermission('employees:read'), employeeController.getById);
employeeRoutes.post('/', requirePermission('employees:create'), employeeController.create);
employeeRoutes.patch('/:id', requirePermission('employees:update'), employeeController.update);
employeeRoutes.delete('/:id', requirePermission('employees:delete'), employeeController.remove);