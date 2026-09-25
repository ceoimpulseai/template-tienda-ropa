import { randomUUID } from 'node:crypto';
import { Purchase } from '../modules/_example/purchases/purchase.model.js';
import { Item } from '../modules/items/item.model.js';
import { Supplier } from '../modules/suppliers/supplier.model.js';
import { Branch } from '../modules/branches/branch.model.js';

const DEMO_PURCHASES = [
  {
    itemName: 'Laptop Pro X1',
    supplierName: 'Distribuidora Tech S.A.',
    branchName: 'Sucursal Principal',
    quantity: 5,
    unitCost: 1800,
  },
  {
    itemName: 'Monitor 27" 4K',
    supplierName: 'Distribuidora Tech S.A.',
    branchName: 'Sucursal Norte',
    quantity: 10,
    unitCost: 650,
  },
  {
    itemName: 'Teclado Mecánico RGB',
    supplierName: 'Importadora Global',
    branchName: 'Sucursal Principal',
    quantity: 20,
    unitCost: 90,
  },
  {
    itemName: 'Disco SSD 1TB NVMe',
    supplierName: 'Suministros PC',
    branchName: 'Sucursal Principal',
    quantity: 15,
    unitCost: 140,
  },
  {
    itemName: 'Auriculares Bluetooth',
    supplierName: 'Importadora Global',
    branchName: 'Sucursal Norte',
    quantity: 12,
    unitCost: 55,
  },
];

export async function seedPurchases() {
  for (const p of DEMO_PURCHASES) {
    const item = await Item.findOne({
      where: { businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: p.itemName },
    });
    const supplier = await Supplier.findOne({
      where: { businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: p.supplierName },
    });
    const branch = await Branch.findOne({
      where: { businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: p.branchName },
    });

    if (!item || !supplier || !branch) {
      console.warn(`Skipping purchase for ${p.itemName}: missing ref (item: ${!!item}, supplier: ${!!supplier}, branch: ${!!branch})`);
      continue;
    }

    const existing = await Purchase.findOne({
      where: {
        businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        branchId: branch.id,
        itemId: item.id,
        supplierId: supplier.id,
        quantity: p.quantity,
        unitCost: p.unitCost,
      },
    });

    if (!existing) {
      await Purchase.create({
        id: randomUUID(),
        businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        branchId: branch.id,
        itemId: item.id,
        supplierId: supplier.id,
        quantity: p.quantity,
        unitCost: p.unitCost,
      });
      console.log(`Purchase created: ${p.itemName} x${p.quantity} from ${p.supplierName} @ ${p.branchName}`);
    } else {
      console.log(`Purchase already exists: ${p.itemName} x${p.quantity}`);
    }
  }

  return DEMO_PURCHASES;
}