import { randomUUID } from 'node:crypto';
import { Sale } from '../modules/_example/sales/sale.model.js';
import { Item } from '../modules/items/item.model.js';
import { Customer } from '../modules/customers/customer.model.js';
import { Branch } from '../modules/branches/branch.model.js';

const DEMO_SALES = [
  {
    itemName: 'Laptop Pro X1',
    customerName: 'Juan Pérez',
    branchName: 'Sucursal Principal',
    quantity: 1,
    unitPrice: 2499.99,
    amountReceived: 2499.99,
  },
  {
    itemName: 'Monitor 27" 4K',
    customerName: 'María García',
    branchName: 'Sucursal Principal',
    quantity: 2,
    unitPrice: 899.99,
    amountReceived: 1799.98,
  },
  {
    itemName: 'Teclado Mecánico RGB',
    customerName: 'Carlos López',
    branchName: 'Sucursal Norte',
    quantity: 3,
    unitPrice: 149.99,
    amountReceived: 449.97,
  },
  {
    itemName: 'Mouse Inalámbrico Ergo',
    customerName: 'Ana Rodríguez',
    branchName: 'Sucursal Norte',
    quantity: 5,
    unitPrice: 79.99,
    amountReceived: 399.95,
  },
  {
    itemName: 'Auriculares Bluetooth',
    customerName: 'Juan Pérez',
    branchName: 'Sucursal Principal',
    quantity: 2,
    unitPrice: 89.99,
    amountReceived: 179.98,
  },
];

export async function seedSales() {
  for (const s of DEMO_SALES) {
    const item = await Item.findOne({
      where: { businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: s.itemName },
    });
    const customer = await Customer.findOne({
      where: { businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: s.customerName },
    });
    const branch = await Branch.findOne({
      where: { businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', name: s.branchName },
    });

    if (!item || !customer || !branch) {
      console.warn(`Skipping sale for ${s.itemName}: missing ref (item: ${!!item}, customer: ${!!customer}, branch: ${!!branch})`);
      continue;
    }

    const existing = await Sale.findOne({
      where: {
        businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        branchId: branch.id,
        itemId: item.id,
        customerId: customer.id,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
      },
    });

    if (!existing) {
      await Sale.create({
        id: randomUUID(),
        businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        branchId: branch.id,
        itemId: item.id,
        customerId: customer.id,
        quantity: s.quantity,
        unitPrice: s.unitPrice,
        isInternal: false,
        amountReceived: s.amountReceived,
      });
      console.log(`Sale created: ${s.itemName} x${s.quantity} to ${s.customerName} @ ${s.branchName}`);
    } else {
      console.log(`Sale already exists: ${s.itemName} x${s.quantity}`);
    }
  }

  return DEMO_SALES;
}