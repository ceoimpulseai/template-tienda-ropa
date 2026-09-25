import { Cost, CostType } from '../modules/_example/costs/cost.model.js';

const DEMO_COSTS = [
  {
    id: 'c1d2e3f4-a5b6-7890-cdef-123456789012',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    type: 'fixed' as CostType,
    label: 'Alquiler local',
    amount: 1500,
  },
  {
    id: 'd2e3f4a5-b6c7-8901-def0-234567890123',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    type: 'fixed' as CostType,
    label: 'Internet + telefonía',
    amount: 200,
  },
  {
    id: 'e3f4a5b6-c7d8-9012-ef01-345678901234',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    type: 'variable' as CostType,
    label: 'Envíos mensuales',
    amount: 350,
  },
  {
    id: 'f4a5b6c7-d8e9-0123-f012-456789012345',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    type: 'extraordinary' as CostType,
    label: 'Compra estantería',
    amount: 1200,
  },
];

export async function seedCosts() {
  for (const cost of DEMO_COSTS) {
    const existing = await Cost.findOne({
      where: { businessId: cost.businessId, label: cost.label },
    });

    if (!existing) {
      await Cost.create(cost);
      console.log(`Cost created: ${cost.label} (${cost.type}) - $${cost.amount}`);
    } else {
      console.log(`Cost already exists: ${cost.label}`);
    }
  }

  return DEMO_COSTS;
}