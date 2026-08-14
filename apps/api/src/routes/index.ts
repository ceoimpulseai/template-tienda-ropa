import { Router } from 'express';
import { businessRoutes } from '../modules/business/business.routes.js';
import { branchRoutes } from '../modules/branches/branch.routes.js';
import { teamRoutes } from '../modules/team/team.routes.js';
import { customerRoutes } from '../modules/customers/customer.routes.js';
import { purchaseRoutes } from '../modules/purchases/purchase.routes.js';
import { saleRoutes } from '../modules/sales/sale.routes.js';
import { costRoutes } from '../modules/costs/cost.routes.js';
import { metricsRoutes } from '../modules/metrics/metrics.routes.js';

export const routes = Router();

routes.use('/business', businessRoutes);
routes.use('/branches', branchRoutes);
routes.use('/team', teamRoutes);
routes.use('/customers', customerRoutes);
routes.use('/purchases', purchaseRoutes);
routes.use('/sales', saleRoutes);
routes.use('/costs', costRoutes);
routes.use('/metrics', metricsRoutes);
