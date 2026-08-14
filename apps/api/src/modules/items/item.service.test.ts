import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { itemService } from './item.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('itemService', () => {
  it('creates an item scoped to a business, defaulting visibleInCatalog to false', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const item = await itemService.create(business.id, { name: 'Producto A', price: 10, stock: 5 });
    expect(item.businessId).toBe(business.id);
    expect(item.visibleInCatalog).toBe(false);
  });

  it('only lists items for the given business', async () => {
    const businessA = await Business.create({ id: randomUUID(), name: 'A' });
    const businessB = await Business.create({ id: randomUUID(), name: 'B' });
    await itemService.create(businessA.id, { name: 'Item A', price: 10, stock: 1 });
    await itemService.create(businessB.id, { name: 'Item B', price: 20, stock: 2 });

    const items = await itemService.list(businessA.id);
    expect(items).toHaveLength(1);
    expect(items[0]!.name).toBe('Item A');
  });

  it('updates an item scoped by businessId, e.g. toggling visibleInCatalog', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test 2' });
    const item = await itemService.create(business.id, { name: 'Item C', price: 15, stock: 3 });

    const updated = await itemService.update(business.id, item.id, { visibleInCatalog: true });
    expect(updated.visibleInCatalog).toBe(true);
  });

  it('rejects updating an item from another business', async () => {
    const businessA = await Business.create({ id: randomUUID(), name: 'A2' });
    const businessB = await Business.create({ id: randomUUID(), name: 'B2' });
    const item = await itemService.create(businessA.id, { name: 'Item D', price: 5, stock: 1 });

    await expect(
      itemService.update(businessB.id, item.id, { visibleInCatalog: true }),
    ).rejects.toThrow('ITEM_NOT_FOUND');
  });
});
