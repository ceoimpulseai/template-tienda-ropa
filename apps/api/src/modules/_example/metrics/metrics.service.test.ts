// EJEMPLO: adaptar a la lógica del rubro concreto.
import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../../config/database.js';
import { Business } from '../../business/business.model.js';
import { Branch } from '../../branches/branch.model.js';
import { Item } from '../../items/item.model.js';
import { purchaseService } from '../purchases/purchase.service.js';
import { saleService } from '../sales/sale.service.js';
import { costService } from '../costs/cost.service.js';
import { metricsService } from './metrics.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('metricsService.dashboard', () => {
  it('aggregates revenue, cost and fixed costs for a business', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({ id: randomUUID(), businessId: business.id, name: 'Item A', price: 10, stock: 0 });

    await purchaseService.create(business.id, branch.id, { itemId: item.id, quantity: 10, unitCost: 5 });
    await saleService.create(business.id, branch.id, { itemId: item.id, quantity: 4, unitPrice: 20 });
    await costService.create(business.id, { type: 'fixed', label: 'Alquiler', amount: 1000 });
    await costService.create(business.id, { type: 'variable', label: 'Flete', amount: 200 });
    await costService.create(business.id, { type: 'extraordinary', label: 'Incendio', amount: 500 });

    const metrics = await metricsService.dashboard(business.id);

    expect(metrics.totalRevenue).toBe(80);
    expect(metrics.totalCost).toBe(50);
    expect(metrics.grossProfit).toBe(30);
    expect(metrics.grossMarginPercent).toBe(37.5);
    expect(metrics.totalFixedCosts).toBe(1000);
    expect(metrics.totalVariableCosts).toBe(200);
    expect(metrics.totalExtraordinaryCosts).toBe(500);
    expect(metrics.netProfit).toBe(-1670);
    expect(metrics.netMarginPercent).toBe(-2087.5);
    expect(metrics.breakEvenRevenue).toBeCloseTo(2666.67, 0);
    expect(metrics.salesCount).toBe(1);
  });
});