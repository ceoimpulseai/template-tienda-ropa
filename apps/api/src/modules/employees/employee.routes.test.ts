import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from '../../test/testApp.js';
import { resetTestDb } from '../../test/setupTestDb.js';
import { Business } from '../business/business.model.js';
import { BusinessMember } from '../team/team.model.js';
import { Employee } from './employee.model.js';

const app = createTestApp();

function setupTestUser(userId: string, businessId: string) {
  return BusinessMember.create({ id: randomUUID(), businessId, userId, role: 'admin' });
}

describe('GET /api/employees', () => {
  let userId: string;
  let businessId: string;

  beforeEach(async () => {
    await resetTestDb();
    userId = randomUUID();
    businessId = randomUUID();
    await Business.create({ id: businessId, name: 'Test' });
    await setupTestUser(userId, businessId);
    await Employee.create({ id: randomUUID(), businessId, name: 'Juan', hasAccount: false, status: 'active' });
    await Employee.create({ id: randomUUID(), businessId, name: 'María', hasAccount: false, status: 'active' });
  });

  it('lists the employees of the caller business', async () => {
    const res = await request(app).get('/api/employees').set('X-Test-User-Id', userId);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});