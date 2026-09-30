import { Customer } from '../modules/customers/customer.model.js';

const DEMO_CUSTOMERS = [
  {
    id: 'b4c5d6e7-f8a9-0123-7890-123456789012',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Juan Pérez',
    email: 'juan@email.com',
    phone: '+5491123456789',
    cuit: '20416986925',
    vatCondition: 'Consumidor Final',
  },
  {
    id: 'c5d6e7f8-a9b0-1234-8901-234567890123',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'María García',
    email: 'maria@email.com',
    phone: '+5491198765432',
    cuit: '27345678901',
    vatCondition: 'Consumidor Final',
  },
  {
    id: 'd6e7f8a9-b0c1-2345-9012-345678901234',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Carlos López',
    email: 'carlos@email.com',
    phone: '+5491155566778',
    dni: '32145678',
    vatCondition: 'Consumidor Final',
  },
  {
    id: 'e7f8a9b0-c1d2-3456-0123-456789012345',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Ana Rodríguez',
    email: 'ana@email.com',
    phone: '+5491144477889',
    cuit: '20333333333',
    vatCondition: 'IVA Responsable Inscripto',
  },
];

export async function seedCustomers() {
  for (const customer of DEMO_CUSTOMERS) {
    const existing = await Customer.findOne({
      where: { businessId: customer.businessId, name: customer.name },
    });

    if (!existing) {
      await Customer.create(customer);
      console.log(`Customer created: ${customer.name}`);
    } else {
      // Update existing customer with fiscal data if missing
      const needsUpdate = !existing.cuit && !existing.dni;
      if (needsUpdate) {
        await existing.update({
          cuit: customer.cuit ?? null,
          dni: customer.dni ?? null,
          vatCondition: customer.vatCondition ?? 'Consumidor Final',
        });
        console.log(`Customer updated with fiscal data: ${customer.name}`);
      } else {
        console.log(`Customer already exists: ${existing.name}`);
      }
    }
  }

  return DEMO_CUSTOMERS;
}