import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from '../../test/testApp.js';
import { resetTestDb } from '../../test/setupTestDb.js';
import { Business } from '../business/business.model.js';
import { BusinessMember } from './team.model.js';

const app = createTestApp();

describe('GET /api/team', () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it('lists the members of the caller business', async () => {
    const userId = randomUUID();
    const business = await Business.create({ id: randomUUID(), name: 'Test' });
    await BusinessMember.create({ id: randomUUID(), businessId: business.id, userId, role: 'admin' });

    const res = await request(app).get('/api/team').set('X-Test-User-Id', userId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
