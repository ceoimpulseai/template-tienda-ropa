import { randomUUID } from 'node:crypto';
import { PurchaseOrder } from '../modules/_example/purchases/purchase-order.model.js';
import { PurchaseLineItem } from '../modules/_example/purchases/purchase-line-item.model.js';
import { PurchaseItemVariantDist } from '../modules/_example/purchases/purchase-item-variant-dist.model.js';
import { Item } from '../modules/items/item.model.js';
import { Supplier } from '../modules/suppliers/supplier.model.js';
import { Branch } from '../modules/branches/branch.model.js';
import { Variant } from '../modules/items/variant.model.js';

const BUSINESS_ID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

const DEMO_PURCHASE_ORDERS = [
  {
    supplierName: 'Textil Mayorista del Centro',
    branchName: 'Sucursal Principal',
    notes: null,
    lines: [
      { itemName: 'Remera Lisa Algodón', quantity: 60, unitCost: 7500 },
      { itemName: 'Buzo Oversize', quantity: 40, unitCost: 20000 },
      { itemName: 'Musculosa Básica', quantity: 50, unitCost: 6000 },
    ],
  },
  {
    supplierName: 'Denim Argentina S.A.',
    branchName: 'Sucursal Principal',
    notes: 'Pedido mensual',
    lines: [
      { itemName: 'Jean Slim Fit', quantity: 30, unitCost: 22000 },
    ],
  },
  {
    supplierName: 'Confecciones Flor de Luna',
    branchName: 'Sucursal Norte',
    notes: null,
    lines: [
      { itemName: 'Vestido Floral Midi', quantity: 18, unitCost: 28000 },
      { itemName: 'Pollera Tableada', quantity: 24, unitCost: 15000 },
      { itemName: 'Camisa Oxford', quantity: 20, unitCost: 25000 },
    ],
  },
  {
    supplierName: 'Outdoor Gear Argentina',
    branchName: 'Sucursal Principal',
    notes: null,
    lines: [
      { itemName: 'Campera Rompevientos', quantity: 12, unitCost: 40000 },
    ],
  },
  {
    supplierName: 'Calzado Urbano Importado',
    branchName: 'Sucursal Principal',
    notes: 'Incluye distribución por talles',
    lines: [
      { itemName: 'Zapatillas Urbanas', quantity: 24, unitCost: 45000 },
    ],
  },
  {
    supplierName: 'Accesorios de Cuero Sur',
    branchName: 'Sucursal Norte',
    notes: null,
    lines: [
      { itemName: 'Cinturón Cuero', quantity: 25, unitCost: 17000 },
      { itemName: 'Mochila Impermeable', quantity: 15, unitCost: 30000 },
    ],
  },
];

export async function seedPurchases() {
  for (const po of DEMO_PURCHASE_ORDERS) {
    const supplier = await Supplier.findOne({
      where: { businessId: BUSINESS_ID, name: po.supplierName },
    });
    const branch = await Branch.findOne({
      where: { businessId: BUSINESS_ID, name: po.branchName },
    });

    if (!supplier || !branch) {
      console.warn(`Skipping purchase order for ${po.supplierName}: missing supplier or branch`);
      continue;
    }

    // Check if a similar order already exists
    const existing = await PurchaseOrder.findOne({
      where: { businessId: BUSINESS_ID, supplierId: supplier.id, branchId: branch.id },
    });

    if (existing) {
      console.log(`Purchase order for ${po.supplierName} already exists`);
      continue;
    }

    const orderId = randomUUID();
    let totalCost = 0;

    await PurchaseOrder.create({
      id: orderId,
      businessId: BUSINESS_ID,
      branchId: branch.id,
      supplierId: supplier.id,
      notes: po.notes,
      totalCost: 0,
      status: 'completed',
    });

    for (const line of po.lines) {
      const item = await Item.findOne({
        where: { businessId: BUSINESS_ID, name: line.itemName },
      });

      if (!item) {
        console.warn(`Item not found: ${line.itemName}`);
        continue;
      }

      const lineItemId = randomUUID();
      await PurchaseLineItem.create({
        id: lineItemId,
        purchaseOrderId: orderId,
        businessId: BUSINESS_ID,
        itemId: item.id,
        quantity: line.quantity,
        unitCost: line.unitCost,
      });

      totalCost += line.quantity * line.unitCost;

      // Try to distribute across variants if available
      const variants = await Variant.findAll({
        where: { businessId: BUSINESS_ID, itemId: item.id, isActive: true },
      });

      if (variants.length > 0) {
        const perVariant = Math.floor(line.quantity / variants.length);
        const remainder = line.quantity - perVariant * variants.length;

        for (let i = 0; i < variants.length; i++) {
          const qty = perVariant + (i < remainder ? 1 : 0);
          if (qty > 0) {
            const v = variants[i]!;
            await PurchaseItemVariantDist.create({
              id: randomUUID(),
              purchaseLineItemId: lineItemId,
              variantId: v.id,
              quantity: qty,
              unitCost: null,
            });

            // Update variant stock
            await v.increment('stock', { by: qty });
          }
        }
      } else {
        // Update item-level stock (backward compat)
        await item.increment('stock', { by: line.quantity });
      }
    }

    // Update totalCost
    await PurchaseOrder.update({ totalCost }, { where: { id: orderId } });

    console.log(`Purchase order created: ${po.supplierName} — ${po.lines.length} items, total $${totalCost}`);
  }

  return DEMO_PURCHASE_ORDERS;
}