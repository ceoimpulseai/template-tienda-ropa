import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createClient, type IssueInvoiceInput } from './factory.js';
import { sequelize } from '../../config/database.js';
import '../../models/index.js';

// Mock the @arcasdk/core module — must use a real function for constructor compatibility
const mockCreateNextVoucher = vi.fn();
vi.mock('@arcasdk/core', () => {
  function MockArca(this: any, _options: any) {
    this.electronicBillingService = { createNextVoucher: mockCreateNextVoucher };
  }
  return { Arca: MockArca };
});

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createClient', () => {
  it('returns an ArcaService with issueInvoice method', () => {
    const client = createClient({
      cuit: '30123456789',
      certPem: 'fake-cert',
      privateKeyPem: 'fake-key',
      production: false,
    });
    expect(client).toBeDefined();
    expect(typeof client.issueInvoice).toBe('function');
  });

  it('maps authorized SDK response to VoucherResult', async () => {
    const client = createClient({
      cuit: '30123456789',
      certPem: 'fake-cert',
      privateKeyPem: 'fake-key',
      production: false,
    });

    mockCreateNextVoucher.mockResolvedValueOnce({
      response: {
        FeCabResp: { Resultado: 'A', Cuit: 30123456789, PtoVta: 1 },
        FeDetResp: {
          FECAEDetResponse: [
            {
              Resultado: 'A',
              CAE: '12345678901234',
              CAEFchVto: '20261231',
              CbteDesde: 1,
              CbteHasta: 1,
            },
          ],
        },
      },
    });

    const input: IssueInvoiceInput = {
      cuit: '30123456789',
      salesPoint: 1,
      issuerCondition: 'IVA Responsable Inscripto',
      customer: {
        cuit: '20123456789',
        dni: null,
        vatCondition: 'IVA Responsable Inscripto',
      },
      invoice: {
        items: [{ name: 'Product A', quantity: 2, unitPrice: 100 }],
      },
      idempotencyKey: randomUUID(),
    };

    const result = await client.issueInvoice(input);

    expect(result.result).toBe('authorized');
    expect(result.arcaVoucherId).toBe('12345678901234');
    expect(result.arcaVoucherNumber).toBe(1);
    expect(result.rawResponse).toBeDefined();
  });

  it('maps rejected SDK response to VoucherResult', async () => {
    const client = createClient({
      cuit: '30123456789',
      certPem: 'fake-cert',
      privateKeyPem: 'fake-key',
      production: false,
    });

    mockCreateNextVoucher.mockResolvedValueOnce({
      response: {
        FeCabResp: { Resultado: 'R' },
        Errors: { Err: [{ Code: 100, Msg: 'CUIT inválido' }] },
      },
    });

    const input: IssueInvoiceInput = {
      cuit: '30123456789',
      salesPoint: 1,
      issuerCondition: 'Consumidor Final',
      customer: {
        cuit: '20123456789',
        dni: null,
        vatCondition: 'Consumidor Final',
      },
      invoice: {
        items: [{ name: 'Product A', quantity: 1, unitPrice: 50 }],
      },
      idempotencyKey: randomUUID(),
    };

    const result = await client.issueInvoice(input);

    expect(result.result).toBe('rejected');
    expect(result.emissionCode).toBe('100');
    expect(result.emissionMessage).toBe('CUIT inválido');
  });

  it('wraps SDK exception into rejected VoucherResult', async () => {
    const client = createClient({
      cuit: '30123456789',
      certPem: 'fake-cert',
      privateKeyPem: 'fake-key',
      production: false,
    });

    mockCreateNextVoucher.mockRejectedValueOnce(new Error('Connection refused'));

    const input: IssueInvoiceInput = {
      cuit: '30123456789',
      salesPoint: 1,
      issuerCondition: 'Responsable Monotributo',
      customer: {
        cuit: null,
        dni: '12345678',
        vatCondition: 'Consumidor Final',
      },
      invoice: {
        items: [{ name: 'Product', quantity: 1, unitPrice: 100 }],
      },
      idempotencyKey: randomUUID(),
    };

    const result = await client.issueInvoice(input);

    expect(result.result).toBe('rejected');
    expect(result.emissionCode).toBe('SDK_ERROR');
    expect(result.emissionMessage).toContain('Connection refused');
  });

  it('returns indeterminate for unknown SDK Resultado', async () => {
    const client = createClient({
      cuit: '30123456789',
      certPem: 'fake-cert',
      privateKeyPem: 'fake-key',
      production: false,
    });

    mockCreateNextVoucher.mockResolvedValueOnce({
      response: {
        FeCabResp: { Resultado: 'O' },
      },
    });

    const input: IssueInvoiceInput = {
      cuit: '30123456789',
      salesPoint: 1,
      issuerCondition: 'IVA Responsable Inscripto',
      customer: {
        cuit: '20123456789',
        dni: null,
        vatCondition: 'Consumidor Final',
      },
      invoice: {
        items: [{ name: 'Test', quantity: 1, unitPrice: 100 }],
      },
      idempotencyKey: randomUUID(),
    };

    const result = await client.issueInvoice(input);
    expect(result.result).toBe('indeterminate');
  });
});