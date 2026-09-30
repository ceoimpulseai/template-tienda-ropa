import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createTestApp } from '../../test/testApp.js';
import { resetTestDb } from '../../test/setupTestDb.js';
import { Business } from '../../modules/business/business.model.js';
import { Branch } from '../../modules/branches/branch.model.js';
import { BusinessMember } from '../../modules/team/team.model.js';
import { Customer } from '../../modules/customers/customer.model.js';
import { Item } from '../../modules/items/item.model.js';
import { Sale } from '../../modules/_example/sales/sale.model.js';
import { encryptPem } from '../../lib/arca/crypto.js';

import { tenantCache, branchCache } from '../../lib/tenantCache.js';

const app = createTestApp();

const TEST_CERT_PEM = '-----BEGIN CERTIFICATE-----\nTESTCERT\n-----END CERTIFICATE-----';
const TEST_KEY_PEM = '-----BEGIN PRIVATE KEY-----\nTESTKEY\n-----END PRIVATE KEY-----';

// Mock the factory at top level
const mockIssueInvoice = vi.fn();
vi.mock('../../lib/arca/factory.js', () => ({
  createClient: vi.fn(() => ({
    issueInvoice: mockIssueInvoice,
  })),
}));

async function seedBusinessWithAdmin(userId: string) {
  const business = await Business.create({ id: randomUUID(), name: 'Test Business' });
  const branch = await Branch.create({
    id: randomUUID(),
    businessId: business.id,
    name: 'Sucursal Principal',
    isDefault: true,
    salesPoint: 1,
  });
  await BusinessMember.create({ id: randomUUID(), businessId: business.id, userId, role: 'admin' });
  return { business, branch };
}

async function seedArcaConfiguredBusiness(userId: string) {
  const businessId = randomUUID();
  const branchId = randomUUID();

  const encryptedCert = encryptPem(businessId, TEST_CERT_PEM);
  const encryptedKey = encryptPem(businessId, TEST_KEY_PEM);

  await Business.create({
    id: businessId,
    name: 'Test Business',
    taxId: '30123456789',
    issuerCondition: 'IVA Responsable Inscripto',
    arcaEnvironment: 'homologation',
    arcaCertPem: encryptedCert,
    arcaPrivateKeyPem: encryptedKey,
  });

  await Branch.create({
    id: branchId,
    businessId,
    name: 'Sucursal Principal',
    isDefault: true,
    salesPoint: 1,
  });

  await BusinessMember.create({ id: randomUUID(), businessId, userId, role: 'admin' });

  return { businessId, branchId };
}

async function seedFullTestData(businessId: string, branchId: string) {
  const itemId = randomUUID();
  const customerId = randomUUID();
  const saleId = randomUUID();

  await Item.create({
    id: itemId,
    businessId,
    name: 'Test Product',
    price: 100,
  });

  await Customer.create({
    id: customerId,
    businessId,
    name: 'Test Customer',
    cuit: '20123456789',
    dni: null,
    vatCondition: 'IVA Responsable Inscripto',
  });

  await Sale.create({
    id: saleId,
    businessId,
    branchId,
    itemId,
    customerId,
    quantity: 2,
    unitPrice: 100,
    arcaStatus: null,
  });

  return { itemId, customerId, saleId };
}

function setupMockIssueInvoice(result: any) {
  mockIssueInvoice.mockResolvedValue(result);
}

beforeAll(async () => {
  await resetTestDb();
});

beforeEach(async () => {
  await resetTestDb();
  tenantCache.clear();
  branchCache.clear();
  vi.clearAllMocks();
});

describe('ARCA routes', () => {
  describe('GET /api/business/arca', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/business/arca');
      expect(res.status).toBe(401);
    });

    it('returns ARCA config for authenticated business member', async () => {
      const userId = randomUUID();
      const { business, branch } = await seedBusinessWithAdmin(userId);

      const res = await request(app)
        .get('/api/business/arca')
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        taxId: null,
        issuerCondition: null,
        arcaEnvironment: 'homologation',
        arcaConfigured: false,
      });
    });

    it('returns ARCA config with configured status when PEMs are set', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);

      const res = await request(app)
        .get('/api/business/arca')
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        taxId: '30123456789',
        issuerCondition: 'IVA Responsable Inscripto',
        arcaEnvironment: 'homologation',
        arcaConfigured: true,
      });
    });
  });

  describe('PUT /api/business/arca', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).put('/api/business/arca').send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 without business:update permission', async () => {
      const userId = randomUUID();
      const business = await Business.create({ id: randomUUID(), name: 'Test Business' });
      await Branch.create({
        id: randomUUID(),
        businessId: business.id,
        name: 'Sucursal Principal',
        isDefault: true,
      });
      await BusinessMember.create({ id: randomUUID(), businessId: business.id, userId, role: 'member' });

      const res = await request(app)
        .put('/api/business/arca')
        .set('X-Test-User-Id', userId)
        .send({
          cuit: '30123456789',
          issuerCondition: 'IVA Responsable Inscripto',
        });

      expect(res.status).toBe(403);
    });

    it('updates ARCA config and encrypts PEMs', async () => {
      const userId = randomUUID();
      const { business, branch } = await seedBusinessWithAdmin(userId);

      const res = await request(app)
        .put('/api/business/arca')
        .set('X-Test-User-Id', userId)
        .send({
          cuit: '30123456789',
          issuerCondition: 'IVA Responsable Inscripto',
          arcaEnvironment: 'production',
          certPem: TEST_CERT_PEM,
          keyPem: TEST_KEY_PEM,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        taxId: '30123456789',
        issuerCondition: 'IVA Responsable Inscripto',
        arcaEnvironment: 'production',
        arcaConfigured: true,
      });

// Verify encryption in DB
      const updatedBusiness = await Business.findByPk(business.id);
      expect(updatedBusiness?.taxId).toBe('30123456789');
      expect(updatedBusiness?.issuerCondition).toBe('IVA Responsable Inscripto');
      expect(updatedBusiness?.arcaEnvironment).toBe('production');
      expect(updatedBusiness?.arcaCertPem).toBeDefined();
      expect(updatedBusiness?.arcaPrivateKeyPem).toBeDefined();
      expect(updatedBusiness?.arcaCertPem).not.toBe(TEST_CERT_PEM);
      expect(updatedBusiness?.arcaPrivateKeyPem).not.toBe(TEST_KEY_PEM);

      // Verify they can be decrypted
      const { decryptPem } = await import('../../lib/arca/crypto.js');
      expect(decryptPem(business.id, updatedBusiness!.arcaCertPem!)).toBe(TEST_CERT_PEM);
      expect(decryptPem(business.id, updatedBusiness!.arcaPrivateKeyPem!)).toBe(TEST_KEY_PEM);
    });

    it('updates config without PEMs when not provided', async () => {
      const userId = randomUUID();
      const { businessId } = await seedArcaConfiguredBusiness(userId);

      const res = await request(app)
        .put('/api/business/arca')
        .set('X-Test-User-Id', userId)
        .send({
          cuit: '30123456789',
          issuerCondition: 'Responsable Monotributo',
          arcaEnvironment: 'homologation',
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        taxId: '30123456789',
        issuerCondition: 'Responsable Monotributo',
        arcaEnvironment: 'homologation',
        arcaConfigured: true,
      });

      const business = await Business.findByPk(businessId);
      expect(business?.issuerCondition).toBe('Responsable Monotributo');
      expect(business?.arcaCertPem).toBeDefined();
    });

    it('rejects with validation error when CUIT is invalid', async () => {
      const userId = randomUUID();
      await seedBusinessWithAdmin(userId);

      const res = await request(app)
        .put('/api/business/arca')
        .set('X-Test-User-Id', userId)
        .send({
          cuit: 'invalid',
          issuerCondition: 'IVA Responsable Inscripto',
          arcaEnvironment: 'homologation',
        });

      expect(res.status).toBe(400);
    });

    it('rejects with validation error when certPem provided without keyPem', async () => {
      const userId = randomUUID();
      await seedBusinessWithAdmin(userId);

      const res = await request(app)
        .put('/api/business/arca')
        .set('X-Test-User-Id', userId)
        .send({
          cuit: '30123456789',
          issuerCondition: 'IVA Responsable Inscripto',
          arcaEnvironment: 'homologation',
          certPem: TEST_CERT_PEM,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/sales/:id/issue', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/sales/fake-id/issue');
      expect(res.status).toBe(401);
    });

    it('returns 403 without sales:update permission', async () => {
      const userId = randomUUID();
      const business = await Business.create({ id: randomUUID(), name: 'Test Business' });
      await Branch.create({
        id: randomUUID(),
        businessId: business.id,
        name: 'Sucursal Principal',
        isDefault: true,
      });
      await BusinessMember.create({ id: randomUUID(), businessId: business.id, userId, role: 'member' });

      const res = await request(app)
        .post('/api/sales/fake-id/issue')
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(403);
    });

    it('returns 404 when sale not found', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      await seedFullTestData(businessId, branchId);

      const fakeSaleId = randomUUID();
      const res = await request(app)
        .post(`/api/sales/${fakeSaleId}/issue`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: { code: 'SALE_NOT_FOUND' } });
    });

    it('returns 404 when sale belongs to different business', async () => {
      const userId = randomUUID();
      const userId2 = randomUUID();

      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      await seedFullTestData(businessId, branchId);

      // Create another business with a sale
      const businessId2 = randomUUID();
      const branchId2 = randomUUID();
      await Business.create({ id: businessId2, name: 'Business 2' });
      await Branch.create({ id: branchId2, businessId: businessId2, name: 'Branch', salesPoint: 1 });
      await BusinessMember.create({ id: randomUUID(), businessId: businessId2, userId: userId2, role: 'admin' });
      const { saleId: saleId2 } = await seedFullTestData(businessId2, branchId2);

      // User 1 tries to issue sale from business 2
      const res = await request(app)
        .post(`/api/sales/${saleId2}/issue`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: { code: 'SALE_NOT_FOUND' } });
    });

    it('issues invoice successfully and returns voucher', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      const { saleId } = await seedFullTestData(businessId, branchId);

      setupMockIssueInvoice({
        result: 'authorized',
        arcaVoucherId: '12345678901234',
        arcaVoucherNumber: 1,
        emissionCode: null,
        emissionMessage: null,
        rawResponse: '{}',
      });

      const res = await request(app)
        .post(`/api/sales/${saleId}/issue`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        result: 'authorized',
        arcaVoucherId: '12345678901234',
        arcaVoucherNumber: 1,
        saleId,
      });

      // Verify sale arcaStatus updated
      const sale = await Sale.findByPk(saleId);
      expect(sale?.arcaStatus).toBe('authorized');
    });

    it('returns error when ARCA not configured', async () => {
      const userId = randomUUID();
      const { business, branch } = await seedBusinessWithAdmin(userId);
      const { saleId } = await seedFullTestData(business.id, branch.id);

      // Update business with ARCA config but no PEMs
      await Business.update(
        {
          taxId: '30123456789',
          issuerCondition: 'IVA Responsable Inscripto',
          arcaEnvironment: 'homologation',
          arcaCertPem: null,
          arcaPrivateKeyPem: null,
        },
        { where: { id: business.id } },
      );

      const res = await request(app)
        .post(`/api/sales/${saleId}/issue`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ success: false, error: { code: 'ARCA_NOT_CONFIGURED' } });
    });

    it('returns error when sale already emitted (authorized)', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      const { saleId } = await seedFullTestData(businessId, branchId);

      // Set sale as already authorized
      await Sale.update({ arcaStatus: 'authorized' }, { where: { id: saleId } });

      const res = await request(app)
        .post(`/api/sales/${saleId}/issue`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ success: false, error: { code: 'SALE_ALREADY_EMITTED' } });
    });
  });

  describe('GET /api/sales/:id/arca-voucher', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/sales/fake-id/arca-voucher');
      expect(res.status).toBe(401);
    });

    it('returns 404 when voucher not found', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      const { saleId } = await seedFullTestData(businessId, branchId);

      const res = await request(app)
        .get(`/api/sales/${saleId}/arca-voucher`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, error: { code: 'ARCA_VOUCHER_NOT_FOUND' } });
    });

    it('returns voucher when it exists', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      const { saleId } = await seedFullTestData(businessId, branchId);

      setupMockIssueInvoice({
        result: 'authorized',
        arcaVoucherId: '12345678901234',
        arcaVoucherNumber: 1,
        emissionCode: null,
        emissionMessage: null,
        rawResponse: '{"test": "data"}',
      });

      // First issue the invoice to create the voucher
      await request(app)
        .post(`/api/sales/${saleId}/issue`)
        .set('X-Test-User-Id', userId);

      const res = await request(app)
        .get(`/api/sales/${saleId}/arca-voucher`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        result: 'authorized',
        arcaVoucherId: '12345678901234',
        arcaVoucherNumber: 1,
        saleId,
      });
      expect(res.body.rawResponse).toBeUndefined();
    });

    it('returns voucher with rawResponse when includeRaw=true', async () => {
      const userId = randomUUID();
      const { businessId, branchId } = await seedArcaConfiguredBusiness(userId);
      const { saleId } = await seedFullTestData(businessId, branchId);

      setupMockIssueInvoice({
        result: 'authorized',
        arcaVoucherId: '12345678901234',
        arcaVoucherNumber: 1,
        emissionCode: null,
        emissionMessage: null,
        rawResponse: '{"test": "data"}',
      });

      await request(app)
        .post(`/api/sales/${saleId}/issue`)
        .set('X-Test-User-Id', userId);

      const res = await request(app)
        .get(`/api/sales/${saleId}/arca-voucher?includeRaw=true`)
        .set('X-Test-User-Id', userId);

      expect(res.status).toBe(200);
      expect(res.body.rawResponse).toBe('{"test": "data"}');
    });
  });
});