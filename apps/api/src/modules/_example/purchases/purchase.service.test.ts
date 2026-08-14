// EJEMPLO: adaptar a la lógica del rubro concreto.
import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../../config/database.js';
import { Business } from '../../business/business.model.js';
import { Branch } from '../../branches/branch.model.js';
import { Item } from '../../items/item.model.js';
import { purchaseService } from './purchase.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('purchaseService', () => {
  it('increments item stock on purchase', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const branch = await Branch.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Principal',
      isDefault: true,
    });
    const item = await Item.create({ id: randomUUID(), businessId: business.id, name: 'Item A', price: 10, stock: 0 });

    await purchaseService.create(business.id, branch.id, { itemId: item.id, quantity: 5, unitCost: 3 });

    await item.reload();
    expect(item.stock).toBe(5);
  });
});
