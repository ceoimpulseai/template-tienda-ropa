import { Router } from 'express';
import { businessRoutes } from '../modules/business/business.routes.js';
import { branchRoutes } from '../modules/branches/branch.routes.js';
import { teamRoutes } from '../modules/team/team.routes.js';
import { customerRoutes } from '../modules/customers/customer.routes.js';
import { itemRoutes } from '../modules/items/item.routes.js';
import { catalogRoutes } from '../modules/catalog/catalog.routes.js';
import { supplierRoutes } from '../modules/suppliers/supplier.routes.js';
import { purchaseRoutes } from '../modules/_example/purchases/purchase.routes.js';
import { saleRoutes } from '../modules/_example/sales/sale.routes.js';
import { costRoutes } from '../modules/_example/costs/cost.routes.js';
import { metricsRoutes } from '../modules/_example/metrics/metrics.routes.js';
import { financialsRoutes } from '../modules/_example/financials/financials.routes.js';
import { arcaRoutes } from '../modules/arca/arca.routes.js';

export const routes = Router();

routes.use('/business', businessRoutes);
routes.use('/branches', branchRoutes);
routes.use('/team', teamRoutes);
routes.use('/customers', customerRoutes);
routes.use('/items', itemRoutes);
// Sin requireAuth/requireBusiness a propósito: catalogRoutes es el storefront
// público. No copiar el middleware de auth de un módulo hermano acá.
routes.use('/catalog', catalogRoutes);
routes.use('/suppliers', supplierRoutes);
routes.use('/purchases', purchaseRoutes);
routes.use('/sales', saleRoutes);
routes.use('/costs', costRoutes);
routes.use('/metrics', metricsRoutes);
routes.use('/financials', financialsRoutes);
routes.use('/', arcaRoutes);
