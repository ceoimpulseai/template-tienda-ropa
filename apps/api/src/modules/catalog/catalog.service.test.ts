import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { Item } from '../items/item.model.js';
import { Variant } from '../items/variant.model.js';
import '../../models/index.js';
import { catalogService } from './catalog.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('catalogService.getById', () => {
  it('returns null when no business has that id', async () => {
    const result = await catalogService.getById(randomUUID());
    expect(result).toBeNull();
  });

  it('returns only visible items with variants for the matching business', async () => {
    const business = await Business.create({
      id: randomUUID(),
      name: 'Tienda Test',
      catalogWhatsapp: '+54 9 11 1234-5678',
    });
    const otherBusiness = await Business.create({ id: randomUUID(), name: 'Otro' });

    const item = await Item.create({
      id: randomUUID(),
      businessId: business.id,
      name: 'Remera Básica',
      price: 100,
      stock: 5,
      visibleInCatalog: true,
      category: 'remera',
      gender: 'unisex',
    });

    const variant = await Variant.create({
      id: randomUUID(),
      businessId: business.id,
      itemId: item.id,
      size: 'M',
      color: 'Rojo',
      colorHex: '#FF0000',
      sku: 'REM-ROJO-M',
      price: 120,
      stock: 10,
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
      businessId: otherBusiness.id,
      name: 'De otro negocio',
      price: 10,
      stock: 5,
      visibleInCatalog: true,
    });

    const result = await catalogService.getById(business.id);

    expect(result).not.toBeNull();
    expect(result!.business).toEqual({
      id: business.id,
      name: 'Tienda Test',
      displayName: null,
      description: null,
      logoUrl: null,
      coverUrl: null,
      whatsapp: '+54 9 11 1234-5678',
      currencySymbol: '$',
      shippingPolicy: null,
      returnPolicy: null,
      socialLinks: null,
    });
    expect(result!.items).toHaveLength(1);
    expect(result!.items[0]).toMatchObject({
      id: item.id,
      name: 'Remera Básica',
      price: 100,
      category: 'remera',
      gender: 'unisex',
      brand: null,
      description: null,
      material: null,
      careInstructions: null,
      variants: [
        {
          id: variant.id,
          size: 'M',
          color: 'Rojo',
          colorHex: '#FF0000',
          sku: 'REM-ROJO-M',
          price: 120,
          stock: 10,
          imageUrl: null,
          thumbnailUrl: null,
        },
      ],
    });
  });
});