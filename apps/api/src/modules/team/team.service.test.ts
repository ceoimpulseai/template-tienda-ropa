import { describe, expect, it, beforeAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { Business } from '../business/business.model.js';
import { BusinessMember } from './team.model.js';
import { teamService } from './team.service.js';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

describe('teamService', () => {
  it('lists members of a business', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    await BusinessMember.create({
      id: randomUUID(),
      businessId: business.id,
      userId: randomUUID(),
      role: 'admin',
    });

    const members = await teamService.list(business.id);
    expect(members).toHaveLength(1);
  });

  it('removes a member', async () => {
    const business = await Business.create({ id: randomUUID(), name: 'Test 2' });
    const member = await BusinessMember.create({
      id: randomUUID(),
      businessId: business.id,
      userId: randomUUID(),
      role: 'staff',
    });

    await teamService.remove(business.id, member.id);
    const remaining = await teamService.list(business.id);
    expect(remaining).toHaveLength(0);
  });
});
