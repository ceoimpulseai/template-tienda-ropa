import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from '../../test/testApp.js';
import { resetTestDb } from '../../test/setupTestDb.js';
import { Business } from './business.model.js';
import { Branch } from '../branches/branch.model.js';
import { BusinessMember } from '../team/team.model.js';

const app = createTestApp();

async function seedBusinessWithAdmin(userId: string) {
  const business = await Business.create({ id: randomUUID(), name: 'Test Business' });
  await Branch.create({
    id: randomUUID(),
    businessId: business.id,
    name: 'Sucursal Principal',
    isDefault: true,
  });
  await BusinessMember.create({ id: randomUUID(), businessId: business.id, userId, role: 'admin' });
  return business;
}

describe('GET /api/business', () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/business');
    expect(res.status).toBe(401);
  });

  it('returns the current business for an authenticated member', async () => {
    const userId = randomUUID();
    const business = await seedBusinessWithAdmin(userId);

    const res = await request(app).get('/api/business').set('X-Test-User-Id', userId);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(business.id);
  });
});
