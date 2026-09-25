import { Item } from '../modules/items/item.model.js';

const DEMO_ITEMS = [
  {
    id: 'f6a7b8c9-d0e1-2345-f012-345678901234',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Laptop Pro X1',
    price: 2499.99,
    stock: 15,
    visibleInCatalog: true,
  },
  {
    id: 'a7b8c9d0-e1f2-3456-0123-456789012345',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Monitor 27" 4K',
    price: 899.99,
    stock: 25,
    visibleInCatalog: true,
  },
  {
    id: 'b8c9d0e1-f2a3-4567-1234-567890123456',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Teclado Mecánico RGB',
    price: 149.99,
    stock: 50,
    visibleInCatalog: true,
  },
  {
    id: 'c9d0e1f2-a3b4-5678-2345-678901234567',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Mouse Inalámbrico Ergo',
    price: 79.99,
    stock: 100,
    visibleInCatalog: true,
  },
  {
    id: 'd0e1f2a3-b4c5-6789-3456-789012345678',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Cámara Web HD 1080p',
    price: 129.99,
    stock: 30,
    visibleInCatalog: true,
  },
  {
    id: 'e1f2a3b4-c5d6-7890-4567-890123456789',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Hub USB-C 7 puertos',
    price: 69.99,
    stock: 45,
    visibleInCatalog: true,
  },
  {
    id: 'f2a3b4c5-d6e7-8901-5678-901234567890',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Disco SSD 1TB NVMe',
    price: 199.99,
    stock: 60,
    visibleInCatalog: true,
  },
  {
    id: 'a3b4c5d6-e7f8-9012-6789-012345678901',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Auriculares Bluetooth',
    price: 89.99,
    stock: 35,
    visibleInCatalog: true,
  },
];

export async function seedItems() {
  for (const item of DEMO_ITEMS) {
    const existing = await Item.findOne({
      where: { businessId: item.businessId, name: item.name },
    });

    if (!existing) {
      await Item.create(item);
      console.log(`Item created: ${item.name}`);
    } else {
      console.log(`Item already exists: ${item.name}`);
    }
  }

  return DEMO_ITEMS;
}