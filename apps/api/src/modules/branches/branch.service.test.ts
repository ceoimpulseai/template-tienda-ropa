import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { branchService } from './branch.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('branchService', () => {
  it('creates a non-default branch for a business', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const branch = await branchService.create(business.id, { name: 'Sucursal 2' });
    expect(branch.isDefault).toBe(false);
    expect(branch.businessId).toBe(business.id);
  });
});
