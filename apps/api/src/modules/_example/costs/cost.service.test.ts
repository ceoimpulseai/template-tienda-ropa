// EJEMPLO: adaptar a la lógica del rubro concreto.
import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../../config/database.js';
import { Business } from '../../business/business.model.js';
import { costService } from './cost.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('costService', () => {
  it('sums fixed costs only', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    await costService.create(business.id, { type: 'fixed', label: 'Alquiler', amount: 1000 });
    await costService.create(business.id, { type: 'variable', label: 'Comisión', amount: 50 });

    const total = await costService.totalFixed(business.id);
    expect(total).toBe(1000);
  });
});
