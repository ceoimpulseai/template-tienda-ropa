// Orchestration layer for ARCA invoice emission.
// Fetches entities using Sequelize models, runs preconditions, decrypts PEMs,
// creates an ephemeral ARCA client, calls the adapter, stores the voucher in a transaction,
// and updates Sale.arcaStatus.

import { randomUUID } from 'node:crypto';
import { decryptPem, EncryptionError } from './crypto.js';
import { createClient, type IssueInvoiceInput } from './factory.js';
import { Business, Branch, Customer, Item, Sale, ArcaVoucher } from '../../models/index.js';
import { ValidationError, ConflictError, NotFoundError } from '../errors.js';
import { env } from '../../config/env.js';

// ---- Types ----

export interface VoucherRecord {
  id: string;
  saleId: string;
  result: 'authorized' | 'rejected' | 'indeterminate' | 'conflict';
  arcaVoucherId: string | null;
  arcaVoucherNumber: number | null;
  emissionCode: string | null;
  emissionMessage: string | null;
  rawResponse?: string;
  emittedAt: Date;
}

// ---- Precondition check helpers ----

function checkPreconditions(
  business: { taxId: string | null; issuerCondition: string | null; arcaCertPem: string | null; arcaPrivateKeyPem: string | null; arcaEnvironment: string },
  branch: { salesPoint: number | null },
  sale: { customerId: string | null; arcaStatus: string | null },
  customer: { cuit: string | null; dni: string | null; vatCondition: string | null } | null,
): void {
  if (!business.arcaCertPem || !business.arcaPrivateKeyPem) {
    throw new ValidationError('ARCA_NOT_CONFIGURED');
  }
  if (!business.taxId) {
    throw new ValidationError('BUSINESS_MISSING_TAX_ID');
  }
  if (!business.issuerCondition) {
    throw new ValidationError('BUSINESS_MISSING_ISSUER_CONDITION');
  }
  if (branch.salesPoint == null) {
    throw new ValidationError('BRANCH_MISSING_SALES_POINT');
  }
  if (!sale.customerId) {
    throw new ValidationError('SALE_MISSING_CUSTOMER');
  }
  if (!customer || (!customer.cuit && !customer.dni)) {
    throw new ValidationError('CUSTOMER_MISSING_FISCAL_ID');
  }
  if (sale.arcaStatus === 'authorized' || sale.arcaStatus === 'indeterminate') {
    throw new ConflictError('SALE_ALREADY_EMITTED');
  }
}

// ---- Main function ----

export async function issueInvoice(
  businessId: string,
  branchId: string,
  saleId: string,
): Promise<VoucherRecord> {
  // 1. Fetch Business using model
  const business = await Business.findByPk(businessId);
  if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');

  // 2. Fetch Branch using model
  const branch = await Branch.findOne({
    where: { id: branchId, businessId },
  });
  if (!branch) throw new NotFoundError('BRANCH_NOT_FOUND');

  // 3. Fetch Sale with Customer and Item using model associations
  const sale = await Sale.findOne({
    where: { id: saleId, businessId },
    include: [
      { model: Customer, as: 'customer', required: false },
      { model: Item, as: 'item', required: false },
    ],
  });
  if (!sale) throw new NotFoundError('SALE_NOT_FOUND');

  // 4. Precondition checks
  checkPreconditions(business, branch, sale, sale.customer);

  // 5. Decrypt PEMs
  let certPem: string;
  let privateKeyPem: string;
  try {
    certPem = decryptPem(businessId, business.arcaCertPem);
    privateKeyPem = decryptPem(businessId, business.arcaPrivateKeyPem);
  } catch (err) {
    if (err instanceof EncryptionError) {
      throw new ValidationError('ENCRYPTION_ERROR');
    }
    throw err;
  }

  // 6. Build input, create client
  const production = business.arcaEnvironment === 'production';
  const client = createClient({
    cuit: business.taxId!.replace(/\D/g, ''),
    certPem,
    privateKeyPem,
    production,
  });

  const issueInput: IssueInvoiceInput = {
    cuit: business.taxId!.replace(/\D/g, ''),
    salesPoint: branch.salesPoint!,
    issuerCondition: business.issuerCondition!,
    customer: {
      cuit: sale.customer?.cuit?.replace(/\D/g, ''),
      dni: sale.customer?.dni,
      vatCondition: sale.customer?.vatCondition ?? 'Consumidor Final',
    },
    invoice: {
      items: [
        {
          name: sale.item?.name ?? 'Producto',
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
        },
      ],
    },
    idempotencyKey: sale.id,
  };

  // 7. Call adapter with timeout (configurable via env)
  const controller = new AbortController();
  const timeoutMs = env.ARCA_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let outcome: import('./factory.js').VoucherResult;
  try {
    outcome = await client.issueInvoice(issueInput);
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      throw new ValidationError('ARCA_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  // 8. Handle outcome — inside a Sequelize transaction
  const emittedAt = new Date();

  // conflict: the SDK returned conflict — look up existing voucher using model
  if (outcome.result === 'conflict') {
    const existing = await ArcaVoucher.findOne({
      where: { saleId },
    });
    if (existing) {
      return {
        id: existing.id,
        saleId: existing.saleId,
        result: existing.result as VoucherRecord['result'],
        arcaVoucherId: existing.arcaVoucherId,
        arcaVoucherNumber: existing.arcaVoucherNumber,
        emissionCode: existing.emissionCode,
        emissionMessage: existing.emissionMessage,
        rawResponse: existing.rawResponse,
        emittedAt: new Date(existing.emittedAt),
      };
    }
    // No existing voucher found for conflict — unexpected; treat as indeterminate
    outcome.result = 'indeterminate';
  }

  // Check if voucher already exists for this sale (for retries on rejected/indeterminate)
  const existing = await ArcaVoucher.findOne({
    where: { saleId },
  });

  // For authorized / rejected / indeterminate: INSERT or UPDATE voucher + UPDATE sale
  await ArcaVoucher.sequelize!.transaction(async (transaction) => {
    const saleArcaStatus = outcome.result === 'authorized' || outcome.result === 'indeterminate'
      ? outcome.result
      : 'rejected';

    if (existing) {
      // UPDATE existing voucher (retry case)
      await existing.update(
        {
          result: outcome.result,
          arcaVoucherId: outcome.arcaVoucherId,
          arcaVoucherNumber: outcome.arcaVoucherNumber,
          emissionCode: outcome.emissionCode,
          emissionMessage: outcome.emissionMessage,
          rawResponse: outcome.rawResponse ?? '{}',
          emittedAt,
        },
        { transaction },
      );
    } else {
      // INSERT new voucher (first attempt)
      await ArcaVoucher.create(
        {
          id: randomUUID(),
          businessId,
          saleId,
          result: outcome.result,
          arcaVoucherId: outcome.arcaVoucherId,
          arcaVoucherNumber: outcome.arcaVoucherNumber,
          emissionCode: outcome.emissionCode,
          emissionMessage: outcome.emissionMessage,
          rawResponse: outcome.rawResponse ?? '{}',
          idempotencyKey: sale.id,
          emittedAt,
        },
        { transaction },
      );
    }

    // UPDATE Sale.arcaStatus using model
    await sale.update(
      { arcaStatus: saleArcaStatus },
      { transaction },
    );
  });

  return {
    id: existing?.id ?? randomUUID(),
    saleId,
    result: outcome.result,
    arcaVoucherId: outcome.arcaVoucherId,
    arcaVoucherNumber: outcome.arcaVoucherNumber,
    emissionCode: outcome.emissionCode,
    emissionMessage: outcome.emissionMessage,
    rawResponse: outcome.rawResponse,
    emittedAt,
  };
}