import { randomUUID } from 'node:crypto';
import { Variant } from '../modules/items/variant.model.js';
import { Item } from '../modules/items/item.model.js';

const BUSINESS_ID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

const ITEM_VARIANTS: Record<string, { sizes: string[]; colors: { name: string; hex: string }[] }> = {
  'Remera Lisa Algodón': {
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris', hex: '#808080' },
      { name: 'Azul marino', hex: '#1B2A4A' },
    ],
  },
  'Jean Slim Fit': {
    sizes: ['38', '40', '42', '44', '46'],
    colors: [
      { name: 'Azul oscuro', hex: '#1B2A4A' },
      { name: 'Negro', hex: '#000000' },
    ],
  },
  'Vestido Floral Midi': {
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Floral azul', hex: '#4A90D9' },
      { name: 'Floral rojo', hex: '#C0392B' },
      { name: 'Floral verde', hex: '#27AE60' },
    ],
  },
  'Campera Rompevientos': {
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Verde militar', hex: '#4B5320' },
      { name: 'Azul marino', hex: '#1B2A4A' },
    ],
  },
  'Zapatillas Urbanas': {
    sizes: ['38', '39', '40', '41', '42', '43', '44'],
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris', hex: '#808080' },
    ],
  },
  'Buzo Oversize': {
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Gris melange', hex: '#B0B0B0' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Beige', hex: '#F5F0E1' },
      { name: 'Bordó', hex: '#800020' },
    ],
  },
  'Pollera Tableada': {
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Beige', hex: '#F5F0E1' },
      { name: 'Azul marino', hex: '#1B2A4A' },
    ],
  },
  'Camisa Oxford': {
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Celeste', hex: '#87CEEB' },
      { name: 'Rosa pálido', hex: '#FADADD' },
    ],
  },
  'Short Deportivo': {
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris', hex: '#808080' },
      { name: 'Verde militar', hex: '#4B5320' },
    ],
  },
  'Musculosa Básica': {
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Gris', hex: '#808080' },
      { name: 'Rosa', hex: '#FFC0CB' },
    ],
  },
  'Cinturón Cuero': {
    sizes: ['85', '90', '95', '100', '105'],
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Marrón', hex: '#8B4513' },
    ],
  },
  'Mochila Impermeable': {
    sizes: ['Único'],
    colors: [
      { name: 'Negro', hex: '#000000' },
      { name: 'Verde militar', hex: '#4B5320' },
      { name: 'Azul marino', hex: '#1B2A4A' },
      { name: 'Gris', hex: '#808080' },
    ],
  },
};

function generateSKU(itemName: string, size: string, colorName: string): string {
  const itemPrefix = itemName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
  const sizeCode = size === 'Único' ? 'UNI' : size.padStart(2, '0');
  const colorCode = colorName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  return `${itemPrefix}-${sizeCode}-${colorCode}`;
}

function generateVariants() {
  const variants = [];

  for (const [itemName, config] of Object.entries(ITEM_VARIANTS)) {
    for (const size of config.sizes) {
      for (const color of config.colors) {
        const sku = generateSKU(itemName, size, color.name);
        const baseStock = size === 'Único' ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 30) + 10;
        variants.push({
          id: randomUUID(),
          businessId: BUSINESS_ID,
          itemId: '', // Se llena después buscando el item por nombre
          itemName,
          size,
          color: color.name,
          colorHex: color.hex,
          sku,
          price: null,
          stock: baseStock,
          imagePublicId: null,
          isActive: true,
        });
      }
    }
  }

  return variants;
}

export async function seedVariants() {
  const variantsToCreate = generateVariants();

  for (const variant of variantsToCreate) {
    const item = await Item.findOne({
      where: { businessId: BUSINESS_ID, name: variant.itemName },
    });

    if (!item) {
      console.warn(`Item not found for variant: ${variant.itemName} - ${variant.size} ${variant.color}`);
      continue;
    }

    const existing = await Variant.findOne({
      where: { businessId: BUSINESS_ID, itemId: item.id, size: variant.size, color: variant.color },
    });

    if (!existing) {
      await Variant.create({
        id: variant.id,
        businessId: variant.businessId,
        itemId: item.id,
        size: variant.size,
        color: variant.color,
        colorHex: variant.colorHex,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        imagePublicId: variant.imagePublicId,
        isActive: variant.isActive,
      });
      console.log(`Variant created: ${variant.itemName} - ${variant.size} ${variant.color} (${variant.sku})`);
    } else {
      console.log(`Variant already exists: ${variant.itemName} - ${variant.size} ${variant.color}`);
    }
  }

  return variantsToCreate;
}