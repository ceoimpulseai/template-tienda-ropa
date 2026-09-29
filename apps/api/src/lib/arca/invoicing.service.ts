// Orchestration layer for ARCA invoice emission.
// Fetches entities, runs preconditions, decrypts PEMs, creates an ephemeral ARCA client,
// calls the adapter, stores the voucher in a transaction, and updates Sale.arcaStatus.

import { randomUUID } from 'node:crypto';
import { deriveTenantKey, decryptPem, EncryptionError } from './crypto.js';
import { createClient, type IssueInvoiceInput } from './factory.js';
import { sequelize } from '../../config/database.js';
import { ValidationError, ConflictError, NotFoundError } from '../errors.js';

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

// ---- Entity shapes (from raw query) ----

interface SaleRow {
  id: string;
  businessId: string;
  branchId: string;
  itemId: string;
  customerId: string | null;
  quantity: number;
  unitPrice: number;
  arcaStatus: string | null;
}

interface CustomerRow {
  id: string;
  cuit: string | null;
  dni: string | null;
  vatCondition: string | null;
}

interface ItemRow {
  id: string;
  name: string;
}

// ---- Precondition check helpers ----

function checkPreconditions(
  business: { taxId: string | null; issuerCondition: string | null; arcaCertPem: string | null; arcaPrivateKeyPem: string | null },
  branch: { salesPoint: number | null },
  sale: { customerId: string | null; arcaStatus: string | null },
  customer: { cuit: string | null; dni: string | null } | null,
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
  // 1. Fetch Business
  const [bizRows] = await sequelize.query(
    `SELECT id, taxId, issuerCondition, arcaEnvironment, arcaCertPem, arcaPrivateKeyPem
     FROM businesses WHERE id = ?`,
    { replacements: [businessId] },
  );
  const business = (bizRows as any[])[0];
  if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');

  // 2. Fetch Branch
  const [branchRows] = await sequelize.query(
    `SELECT id, "salesPoint" FROM branches WHERE id = ? AND "businessId" = ?`,
    { replacements: [branchId, businessId] },
  );
  const branch = (branchRows as any[])[0];
  if (!branch) throw new NotFoundError('BRANCH_NOT_FOUND');

  // 3. Fetch Sale + Customer + Item in one joined query
  const [joinedRows] = await sequelize.query(
    `SELECT s.id AS sale_id, s."businessId", s."branchId", s."itemId", s."customerId",
            s.quantity, s."unitPrice", s."arcaStatus",
            c.id AS customer_id, c.cuit, c.dni, c."vatCondition",
            i.id AS item_id, i.name AS item_name
     FROM sales s
     LEFT JOIN customers c ON c.id = s."customerId"
     LEFT JOIN items i ON i.id = s."itemId"
     WHERE s.id = ? AND s."businessId" = ?`,
    { replacements: [saleId, businessId] },
  );
  const row = (joinedRows as any[])[0];
  if (!row) throw new NotFoundError('SALE_NOT_FOUND');

  const sale: SaleRow = {
    id: row.sale_id,
    businessId: row.businessId,
    branchId: row.branchId,
    itemId: row.itemId,
    customerId: row.customerId,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    arcaStatus: row.arcaStatus,
  };

  const customer: CustomerRow | null = row.customer_id
    ? { id: row.customer_id, cuit: row.cuit, dni: row.dni, vatCondition: row.vatCondition }
    : null;

  const item: ItemRow | null = row.item_id
    ? { id: row.item_id, name: row.item_name }
    : null;

  // 4. Precondition checks
  checkPreconditions(business, branch, sale, customer);

  // 5. Decrypt PEMs
  let certPem: string;
  let privateKeyPem: string;
  try {
    const tenantKey = deriveTenantKey(businessId);
    certPem = decryptPem(tenantKey, business.arcaCertPem);
    privateKeyPem = decryptPem(tenantKey, business.arcaPrivateKeyPem);
  } catch (err) {
    if (err instanceof EncryptionError) {
      throw new ValidationError('ENCRYPTION_ERROR');
    }
    throw err;
  }

  // 6. Build input, create client
  const production = business.arcaEnvironment === 'production';
  const client = createClient({
    cuit: business.taxId.replace(/\D/g, ''),
    certPem,
    privateKeyPem,
    production,
  });

  const issueInput: IssueInvoiceInput = {
    cuit: business.taxId.replace(/\D/g, ''),
    salesPoint: branch.salesPoint,
    issuerCondition: business.issuerCondition,
    customer: {
      cuit: customer!.cuit?.replace(/\D/g, ''),
      dni: customer!.dni,
      vatCondition: customer!.vatCondition ?? 'Consumidor Final',
    },
    invoice: {
      items: [
        {
          name: item?.name ?? 'Producto',
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
        },
      ],
    },
    idempotencyKey: sale.id,
  };

  // 7. Call adapter with timeout (20s)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

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
  const voucherId = randomUUID();
  const emittedAt = new Date();

  // conflict: the SDK returned conflict — look up existing voucher
  if (outcome.result === 'conflict') {
    const [existingRows] = await sequelize.query(
      `SELECT id, "saleId", result, "arcaVoucherId", "arcaVoucherNumber",
              "emissionCode", "emissionMessage", "rawResponse", "emittedAt"
       FROM arca_vouchers WHERE "saleId" = ?`,
      { replacements: [saleId] },
    );
    const existing = (existingRows as any[])[0];
    if (existing) {
      return {
        id: existing.id,
        saleId: existing.saleId,
        result: existing.result,
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

  // For authorized / rejected / indeterminate: INSERT voucher + UPDATE sale
  await sequelize.transaction(async (transaction) => {
    const saleArcaStatus = outcome.result === 'authorized' || outcome.result === 'indeterminate'
      ? outcome.result
      : 'rejected';

    // INSERT arca_vouchers
    await sequelize.query(
      `INSERT INTO arca_vouchers
        (id, "businessId", "saleId", result, "arcaVoucherId", "arcaVoucherNumber",
         "emissionCode", "emissionMessage", "rawResponse", "idempotencyKey", "emittedAt",
         "createdAt", "updatedAt")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      {
        replacements: [
          voucherId,
          businessId,
          saleId,
          outcome.result,
          outcome.arcaVoucherId,
          outcome.arcaVoucherNumber,
          outcome.emissionCode,
          outcome.emissionMessage,
          outcome.rawResponse ?? '{}',
          sale.id,
          emittedAt.toISOString(),
        ],
        transaction,
      },
    );

    // UPDATE Sale.arcaStatus
    await sequelize.query(
      `UPDATE sales SET "arcaStatus" = ? WHERE id = ?`,
      { replacements: [saleArcaStatus, saleId], transaction },
    );
  });

  return {
    id: voucherId,
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