import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { Item } from '../items/item.model.js';
import { catalogService } from './catalog.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('catalogService.getById', () => {
  it('returns null when no business has that id', async () => {
    const result = await catalogService.getById(randomUUID());
    expect(result).toBeNull();
  });

  it('returns only visible, in-stock items for the matching business', async () => {
    const business = await Business.create({
      id: randomUUID(),
      name: 'Tienda Test',
      catalogWhatsapp: '+54 9 11 1234-5678',
    });
    const otherBusiness = await Business.create({ id: randomUUID(), name: 'Otro' });

    const visible = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Visible',
      price: 100,
      stock: 5,
      visibleInCatalog: true,
    });
    await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Oculto',
      price: 50,
      stock: 5,
      visibleInCatalog: false,
    });
    await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Sin stock',
      price: 30,
      stock: 0,
      visibleInCatalog: true,
    });
    await Item.create({
      id: randomUUID(),
      businessId: otherBusiness.id,
      name: 'De otro negocio',
      price: 10,
      stock: 5,
      visibleInCatalog: true,
    });

    const result = await catalogService.getById(business.id);

    expect(result).not.toBeNull();
    expect(result!.business).toEqual({ name: 'Tienda Test', whatsapp: '+54 9 11 1234-5678' });
    expect(result!.items).toEqual([{ id: visible.id, name: 'Visible', price: 100 }]);
  });
});
