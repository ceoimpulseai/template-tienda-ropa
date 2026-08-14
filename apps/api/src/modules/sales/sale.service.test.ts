// EJEMPLO: adaptar a la lógica del rubro concreto.
import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { Branch } from '../branches/branch.model.js';
import { Item } from '../purchases/item.model.js';
import { saleService } from './sale.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('saleService', () => {
  it('decrements item stock on sale', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({ id: randomUUID(), businessId: business.id, name: 'Item A', price: 10, stock: 10 });

    await saleService.create(business.id, branch.id, { itemId: item.id, quantity: 4, unitPrice: 15 });

    await item.reload();
    expect(item.stock).toBe(6);
  });

  it('rejects a sale that exceeds available stock', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test 2' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({ id: randomUUID(), businessId: business.id, name: 'Item B', price: 10, stock: 2 });

    await expect(
      saleService.create(business.id, branch.id, { itemId: item.id, quantity: 5, unitPrice: 15 }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');
  });
});
