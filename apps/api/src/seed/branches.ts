import { Branch } from '../modules/branches/branch.model.js';

const DEMO_BRANCHES = [
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-012345678901',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Sucursal Principal',
    isDefault: true,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-def0-123456789012',
    businessId: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    name: 'Sucursal Norte',
    isDefault: false,
  },
];

export async function seedBranches() {
  for (const branch of DEMO_BRANCHES) {
    const existing = await Branch.findOne({
      where: { businessId: branch.businessId, name: branch.name },
    });

    if (!existing) {
      await Branch.create(branch);
      console.log(`Branch created: ${branch.name}`);
    } else {
      console.log(`Branch already exists: ${branch.name}`);
    }
  }

  return DEMO_BRANCHES;
}