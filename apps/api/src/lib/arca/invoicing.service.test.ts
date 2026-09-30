import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { sequelize } from '../../config/database.js';
import { resetTestDb } from '../../test/setupTestDb.js';
import { Business } from '../../modules/business/business.model.js';
import { Branch } from '../../modules/branches/branch.model.js';
import { Customer } from '../../modules/customers/customer.model.js';
import { Item } from '../../modules/items/item.model.js';
import { Sale } from '../../modules/_example/sales/sale.model.js';
import { issueInvoice } from './invoicing.service.js';
import { encryptPem } from './crypto.js';
import { ValidationError, ConflictError, NotFoundError } from '../errors.js';

// Mock the factory to return a controlled ArcaService
vi.mock('./factory.js', () => ({
  createClient: vi.fn(() => ({
    issueInvoice: vi.fn(),
  })),
}));

import { createClient } from './factory.js';

const TEST_CERT_PEM = '-----BEGIN CERTIFICATE-----\nTESTCERT\n-----END CERTIFICATE-----';
const TEST_KEY_PEM = '-----BEGIN PRIVATE KEY-----\nTESTKEY\n-----END PRIVATE KEY-----';

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await resetTestDb();
  vi.clearAllMocks();
});

async function seedTestData() {
  const businessId = randomUUID();
  const branchId = randomUUID();
  const itemId = randomUUID();
  const customerId = randomUUID();
  const saleId = randomUUID();

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
    salesPoint: 1,
  });

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

  return { businessId, branchId, itemId, customerId, saleId };
}

function setupMockClient(result: any) {
  const mockClient = {
    issueInvoice: vi.fn().mockResolvedValue(result),
  };
  (createClient as any).mockReturnValue(mockClient);
  return mockClient;
}

describe('issueInvoice', () => {
  it('emits authorized invoice and stores voucher', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    setupMockClient({
      result: 'authorized',
      arcaVoucherId: '12345678901234',
      arcaVoucherNumber: 1,
      emissionCode: null,
      emissionMessage: null,
      rawResponse: '{}',
    });

    const voucher = await issueInvoice(businessId, branchId, saleId);

    expect(voucher.result).toBe('authorized');
    expect(voucher.arcaVoucherId).toBe('12345678901234');
    expect(voucher.arcaVoucherNumber).toBe(1);

    // Verify voucher stored in DB
    const [rows] = await sequelize.query(
      `SELECT * FROM arca_vouchers WHERE "saleId" = ?`,
      { replacements: [saleId] },
    );
    expect((rows as any[]).length).toBe(1);
    expect((rows as any[])[0].result).toBe('authorized');

    // Verify sale arcaStatus updated
    const sale = await Sale.findByPk(saleId);
    expect(sale?.arcaStatus).toBe('authorized');
  });

  it('rejects with ARCA_NOT_CONFIGURED when PEMs are null', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    // Remove PEMs
    await Business.update(
      { arcaCertPem: null, arcaPrivateKeyPem: null },
      { where: { id: businessId } },
    );

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'ARCA_NOT_CONFIGURED',
    });

    // Verify SDK was NOT called
    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with BUSINESS_MISSING_TAX_ID when taxId is null', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Business.update({ taxId: null }, { where: { id: businessId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'BUSINESS_MISSING_TAX_ID',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with BUSINESS_MISSING_ISSUER_CONDITION when issuerCondition is null', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Business.update({ issuerCondition: null }, { where: { id: businessId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'BUSINESS_MISSING_ISSUER_CONDITION',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with BRANCH_MISSING_SALES_POINT when salesPoint is null', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Branch.update({ salesPoint: null }, { where: { id: branchId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'BRANCH_MISSING_SALES_POINT',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with SALE_MISSING_CUSTOMER when sale has no customerId', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Sale.update({ customerId: null }, { where: { id: saleId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'SALE_MISSING_CUSTOMER',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with CUSTOMER_MISSING_FISCAL_ID when customer has no cuit or dni', async () => {
    const { businessId, branchId, saleId, customerId } = await seedTestData();

    await Customer.update({ cuit: null, dni: null }, { where: { id: customerId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'CUSTOMER_MISSING_FISCAL_ID',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with SALE_ALREADY_EMITTED when arcaStatus is authorized', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Sale.update({ arcaStatus: 'authorized' }, { where: { id: saleId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ConflictError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'SALE_ALREADY_EMITTED',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects with SALE_ALREADY_EMITTED when arcaStatus is indeterminate', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Sale.update({ arcaStatus: 'indeterminate' }, { where: { id: saleId } });

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ConflictError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'SALE_ALREADY_EMITTED',
    });

    expect(createClient).not.toHaveBeenCalled();
  });

  it('allows re-emission when arcaStatus is rejected', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    await Sale.update({ arcaStatus: 'rejected' }, { where: { id: saleId } });

    setupMockClient({
      result: 'authorized',
      arcaVoucherId: '12345678901234',
      arcaVoucherNumber: 2,
      emissionCode: null,
      emissionMessage: null,
      rawResponse: '{}',
    });

    const voucher = await issueInvoice(businessId, branchId, saleId);

    expect(voucher.result).toBe('authorized');
    expect(createClient).toHaveBeenCalled();
  });

  it('handles conflict outcome by returning existing voucher', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

// Pre-insert an existing voucher
    const existingVoucherId = randomUUID();
    await sequelize.query(
      `INSERT INTO arca_vouchers
        (id, "businessId", "saleId", result, "arcaVoucherId", "arcaVoucherNumber",
         "emissionCode", "emissionMessage", "rawResponse", "idempotencyKey", "emittedAt",
         "createdAt", "updatedAt")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      {
        replacements: [
          existingVoucherId,
          businessId,
          saleId,
          'authorized',
          'EXISTING_CAE',
          99,
          null,
          null,
          '{}',
          saleId,
          new Date().toISOString(),
        ],
      },
    );

    setupMockClient({
      result: 'conflict',
      arcaVoucherId: null,
      arcaVoucherNumber: null,
      emissionCode: null,
      emissionMessage: null,
      rawResponse: '{}',
    });

    const voucher = await issueInvoice(businessId, branchId, saleId);

    expect(voucher.id).toBe(existingVoucherId);
    expect(voucher.arcaVoucherId).toBe('EXISTING_CAE');
    expect(voucher.arcaVoucherNumber).toBe(99);
    expect(voucher.result).toBe('authorized');
  });

  it('throws ARCA_TIMEOUT when SDK times out', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    // Create a client that rejects with AbortError (simulating timeout)
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    const mockClient = {
      issueInvoice: vi.fn().mockRejectedValue(abortError),
    };
    (createClient as any).mockReturnValue(mockClient);

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'ARCA_TIMEOUT',
    });
  });

  it('handles rejected outcome and stores voucher with rejected status', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    setupMockClient({
      result: 'rejected',
      arcaVoucherId: null,
      arcaVoucherNumber: null,
      emissionCode: '100',
      emissionMessage: 'CUIT inválido',
      rawResponse: '{}',
    });

    const voucher = await issueInvoice(businessId, branchId, saleId);

    expect(voucher.result).toBe('rejected');
    expect(voucher.emissionCode).toBe('100');
    expect(voucher.emissionMessage).toBe('CUIT inválido');

    const sale = await Sale.findByPk(saleId);
    expect(sale?.arcaStatus).toBe('rejected');
  });

  it('handles indeterminate outcome and stores voucher', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    setupMockClient({
      result: 'indeterminate',
      arcaVoucherId: null,
      arcaVoucherNumber: null,
      emissionCode: null,
      emissionMessage: null,
      rawResponse: '{}',
    });

    const voucher = await issueInvoice(businessId, branchId, saleId);

    expect(voucher.result).toBe('indeterminate');

    const sale = await Sale.findByPk(saleId);
    expect(sale?.arcaStatus).toBe('indeterminate');
  });

  it('throws NotFoundError when business not found', async () => {
    const { branchId, saleId } = await seedTestData();
    const fakeBusinessId = randomUUID();

    await expect(issueInvoice(fakeBusinessId, branchId, saleId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(issueInvoice(fakeBusinessId, branchId, saleId)).rejects.toMatchObject({
      message: 'BUSINESS_NOT_FOUND',
    });
  });

  it('throws NotFoundError when branch not found or not owned by business', async () => {
    const { businessId, saleId } = await seedTestData();
    const fakeBranchId = randomUUID();

    await expect(issueInvoice(businessId, fakeBranchId, saleId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(issueInvoice(businessId, fakeBranchId, saleId)).rejects.toMatchObject({
      message: 'BRANCH_NOT_FOUND',
    });
  });

  it('throws NotFoundError when sale not found or not owned by business', async () => {
    const { businessId, branchId } = await seedTestData();
    const fakeSaleId = randomUUID();

    await expect(issueInvoice(businessId, branchId, fakeSaleId)).rejects.toThrow(
      NotFoundError,
    );
    await expect(issueInvoice(businessId, branchId, fakeSaleId)).rejects.toMatchObject({
      message: 'SALE_NOT_FOUND',
    });
  });

  it('throws ENCRYPTION_ERROR when PEM decryption fails', async () => {
    const { businessId, branchId, saleId } = await seedTestData();

    // Corrupt the encrypted PEM
    await Business.update(
      { arcaCertPem: 'invalid-json', arcaPrivateKeyPem: 'invalid-json' },
      { where: { id: businessId } },
    );

    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toThrow(
      ValidationError,
    );
    await expect(issueInvoice(businessId, branchId, saleId)).rejects.toMatchObject({
      message: 'ENCRYPTION_ERROR',
    });

    expect(createClient).not.toHaveBeenCalled();
  });
});