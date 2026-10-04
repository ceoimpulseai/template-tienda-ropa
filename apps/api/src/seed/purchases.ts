import { randomUUID } from 'node:crypto';
import { Purchase } from '../modules/_example/purchases/purchase.model.js';
import { Item } from '../modules/items/item.model.js';
import { Supplier } from '../modules/suppliers/supplier.model.js';
import { Branch } from '../modules/branches/branch.model.js';

const BUSINESS_ID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

const DEMO_PURCHASES = [
  {
    itemName: 'Remera Lisa Algodón',
    supplierName: 'Textil Mayorista del Centro',
    branchName: 'Sucursal Principal',
    quantity: 60,
    unitCost: 7500,
  },
  {
    itemName: 'Jean Slim Fit',
    supplierName: 'Denim Argentina S.A.',
    branchName: 'Sucursal Principal',
    quantity: 30,
    unitCost: 22000,
  },
  {
    itemName: 'Vestido Floral Midi',
    supplierName: 'Confecciones Flor de Luna',
    branchName: 'Sucursal Principal',
    quantity: 18,
    unitCost: 28000,
  },
  {
    itemName: 'Campera Rompevientos',
    supplierName: 'Outdoor Gear Argentina',
    branchName: 'Sucursal Norte',
    quantity: 12,
    unitCost: 40000,
  },
  {
    itemName: 'Zapatillas Urbanas',
    supplierName: 'Calzado Urbano Importado',
    branchName: 'Sucursal Principal',
    quantity: 24,
    unitCost: 45000,
  },
  {
    itemName: 'Buzo Oversize',
    supplierName: 'Textil Mayorista del Centro',
    branchName: 'Sucursal Norte',
    quantity: 40,
    unitCost: 20000,
  },
  {
    itemName: 'Pollera Tableada',
    supplierName: 'Confecciones Flor de Luna',
    branchName: 'Sucursal Principal',
    quantity: 24,
    unitCost: 15000,
  },
  {
    itemName: 'Camisa Oxford',
    supplierName: 'Confecciones Flor de Luna',
    branchName: 'Sucursal Principal',
    quantity: 20,
    unitCost: 25000,
  },
  {
    itemName: 'Short Deportivo',
    supplierName: 'Textil Mayorista del Centro',
    branchName: 'Sucursal Norte',
    quantity: 30,
    unitCost: 12000,
  },
  {
    itemName: 'Musculosa Básica',
    supplierName: 'Textil Mayorista del Centro',
    branchName: 'Sucursal Principal',
    quantity: 50,
    unitCost: 6000,
  },
  {
    itemName: 'Cinturón Cuero',
    supplierName: 'Accesorios de Cuero Sur',
    branchName: 'Sucursal Principal',
    quantity: 25,
    unitCost: 17000,
  },
  {
    itemName: 'Mochila Impermeable',
    supplierName: 'Accesorios de Cuero Sur',
    branchName: 'Sucursal Norte',
    quantity: 15,
    unitCost: 30000,
  },
];

export async function seedPurchases() {
  for (const p of DEMO_PURCHASES) {
    const item = await Item.findOne({
      where: { businessId: BUSINESS_ID, name: p.itemName },
    });
    const supplier = await Supplier.findOne({
      where: { businessId: BUSINESS_ID, name: p.supplierName },
    });
    const branch = await Branch.findOne({
      where: { businessId: BUSINESS_ID, name: p.branchName },
    });

    if (!item || !supplier || !branch) {
      console.warn(
        `Skipping purchase for ${p.itemName}: missing ref (item: ${!!item}, supplier: ${!!supplier}, branch: ${!!branch})`
      );
      continue;
    }

    const existing = await Purchase.findOne({
      where: {
        businessId: BUSINESS_ID,
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
        businessId: BUSINESS_ID,
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