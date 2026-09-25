import { Supplier } from '../modules/suppliers/supplier.model.js';

const DEMO_SUPPLIERS = [
  {
    id: 'f8a9b0c1-d2e3-4567-1234-567890123456',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Distribuidora Tech S.A.',
    email: 'ventas@distitech.com',
    phone: '+5491111111111',
    address: 'Av. Corrientes 1234, CABA',
    notes: 'Distribuidor principal de hardware',
  },
  {
    id: 'a9b0c1d2-e3f4-5678-2345-678901234567',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Importadora Global',
    email: 'info@importglobal.com',
    phone: '+5491122222222',
    address: 'San Martín 567, Buenos Aires',
    notes: 'Importación directa desde Asia',
  },
  {
    id: 'b0c1d2e3-f4a5-6789-3456-789012345678',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Suministros PC',
    email: 'pedidos@suministrospc.com',
    phone: '+5491133333333',
    address: 'Rivadavia 890, Buenos Aires',
    notes: 'Proveedor local de periféricos',
  },
];

export async function seedSuppliers() {
  for (const supplier of DEMO_SUPPLIERS) {
    const existing = await Supplier.findOne({
      where: { businessId: supplier.businessId, name: supplier.name },
    });

    if (!existing) {
      await Supplier.create(supplier);
      console.log(`Supplier created: ${supplier.name}`);
    } else {
      console.log(`Supplier already exists: ${supplier.name}`);
    }
  }

  return DEMO_SUPPLIERS;
}