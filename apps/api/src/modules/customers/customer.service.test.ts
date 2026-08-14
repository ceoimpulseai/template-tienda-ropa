import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { customerService } from './customer.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('customerService', () => {
  it('creates a customer scoped to a business', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    const customer = await customerService.create(business.id, { name: 'Ana' });
    expect(customer.businessId).toBe(business.id);
    expect(customer.email).toBeNull();
  });

  it('only lists customers for the given business', async () => {
    const businessA = await Business.create({ id: randomUUID(), name: 'A' });
    const businessB = await Business.create({ id: randomUUID(), name: 'B' });
    await customerService.create(businessA.id, { name: 'Cliente A' });
    await customerService.create(businessB.id, { name: 'Cliente B' });

    const customers = await customerService.list(businessA.id);
    expect(customers).toHaveLength(1);
    expect(customers[0]!.name).toBe('Cliente A');
  });
});
