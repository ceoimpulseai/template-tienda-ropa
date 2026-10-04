import { randomUUID } from 'node:crypto';
import { Sale } from '../modules/_example/sales/sale.model.js';
import { Item } from '../modules/items/item.model.js';
import { Customer } from '../modules/customers/customer.model.js';
import { Branch } from '../modules/branches/branch.model.js';

const BUSINESS_ID = 'b2c3d4e5-f6a7-8901-bcde-f23456789012';

const DEMO_SALES = [
  {
    itemName: 'Remera Lisa Algodón',
    customerName: 'Juan Pérez',
    branchName: 'Sucursal Principal',
    quantity: 2,
    unitPrice: 14999.99,
    amountReceived: 29999.98,
  },
  {
    itemName: 'Jean Slim Fit',
    customerName: 'Carlos López',
    branchName: 'Sucursal Principal',
    quantity: 1,
    unitPrice: 44999.99,
    amountReceived: 44999.99,
  },
  {
    itemName: 'Vestido Floral Midi',
    customerName: 'María García',
    branchName: 'Sucursal Principal',
    quantity: 1,
    unitPrice: 54999.99,
    amountReceived: 54999.99,
  },
  {
    itemName: 'Campera Rompevientos',
    customerName: 'Ana Rodríguez',
    branchName: 'Sucursal Norte',
    quantity: 1,
    unitPrice: 79999.99,
    amountReceived: 79999.99,
  },
  {
    itemName: 'Zapatillas Urbanas',
    customerName: 'Juan Pérez',
    branchName: 'Sucursal Norte',
    quantity: 1,
    unitPrice: 89999.99,
    amountReceived: 89999.99,
  },
  {
    itemName: 'Buzo Oversize',
    customerName: 'Carlos López',
    branchName: 'Sucursal Principal',
    quantity: 2,
    unitPrice: 39999.99,
    amountReceived: 79999.98,
  },
  {
    itemName: 'Pollera Tableada',
    customerName: 'María García',
    branchName: 'Sucursal Norte',
    quantity: 1,
    unitPrice: 29999.99,
    amountReceived: 29999.99,
  },
  {
    itemName: 'Camisa Oxford',
    customerName: 'Carlos López',
    branchName: 'Sucursal Principal',
    quantity: 1,
    unitPrice: 49999.99,
    amountReceived: 49999.99,
  },
  {
    itemName: 'Short Deportivo',
    customerName: 'Ana Rodríguez',
    branchName: 'Sucursal Norte',
    quantity: 2,
    unitPrice: 24999.99,
    amountReceived: 49999.98,
  },
  {
    itemName: 'Musculosa Básica',
    customerName: 'María García',
    branchName: 'Sucursal Principal',
    quantity: 3,
    unitPrice: 11999.99,
    amountReceived: 35999.97,
  },
  {
    itemName: 'Cinturón Cuero',
    customerName: 'Juan Pérez',
    branchName: 'Sucursal Principal',
    quantity: 1,
    unitPrice: 34999.99,
    amountReceived: 34999.99,
  },
  {
    itemName: 'Mochila Impermeable',
    customerName: 'Ana Rodríguez',
    branchName: 'Sucursal Norte',
    quantity: 1,
    unitPrice: 59999.99,
    amountReceived: 59999.99,
  },
];

export async function seedSales() {
  for (const s of DEMO_SALES) {
    const item = await Item.findOne({
      where: { businessId: BUSINESS_ID, name: s.itemName },
    });
    const customer = await Customer.findOne({
      where: { businessId: BUSINESS_ID, name: s.customerName },
    });
    const branch = await Branch.findOne({
      where: { businessId: BUSINESS_ID, name: s.branchName },
    });

    if (!item || !customer || !branch) {
      console.warn(`Skipping sale for ${s.itemName}: missing ref (item: ${!!item}, customer: ${!!customer}, branch: ${!!branch})`);
      continue;
    }

    const existing = await Sale.findOne({
      where: {
        businessId: BUSINESS_ID,
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
        businessId: BUSINESS_ID,
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