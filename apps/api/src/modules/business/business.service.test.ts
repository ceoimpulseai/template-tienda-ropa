import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from './business.model.js';
import { businessService } from './business.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('businessService', () => {
  it('updates a business name', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Original' });
    const updated = await businessService.update(business.id, { name: 'Updated' });
    expect(updated.name).toBe('Updated');
  });
});
