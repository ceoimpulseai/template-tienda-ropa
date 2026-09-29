# Tasks: ARCA Multi-Tenant Electronic Invoicing

> One implementation batch per task. Each task is self-contained with clear files, dependencies, and verification steps.

---

### T1: Bump Node engine to >=22 and add `@arcasdk/core` SDK dependency

**Files**: `package.json`, `apps/api/package.json`
**Depends on**: none
**Spec ref**: arca-configuration.md#R6
**Test**: none (structural change)

**Implementation notes**:
- Root `package.json`: change `"engines": { "node": ">=20" }` → `"engines": { "node": ">=22" }`
- `apps/api/package.json`: change `"engines": { "node": ">=20" }` → `"engines": { "node": ">=22" }`
- `apps/api/package.json`: add `"@arcasdk/core": "^1.0.0"` (latest published version) to `dependencies`
- Run `npm install` after editing to update lockfile
- The `@arcasdk/core` SDK is CJS-only, requires Node 22+. Use `import Arca from '@arcasdk/core';` with CJS interop (default export handling).

**Verification**:
- `node -e "process.exit(process.versions.node.startsWith('22') ? 0 : 1)"` exits 0
- `npm ls @arcasdk/core` shows the dependency resolved
- `npm run typecheck --workspace=apps/api` passes

---

### T2: Add `ValidationError` class, `ARCA_MASTER_KEY` env var, and error handler update

**Files**: `apps/api/src/lib/errors.ts`, `apps/api/src/config/env.ts`, `apps/api/src/middleware/errorHandler.ts`
**Depends on**: none
**Spec ref**: arca-configuration.md#R5, arca-invoicing.md (error table)
**Test**: `apps/api/src/lib/errors.test.ts` (optional one-shot)

**Implementation notes**:
- `lib/errors.ts`: add `export class ValidationError extends Error {}` (allows `error.message` to carry error code like `'ARCA_NOT_CONFIGURED'`)
- `config/env.ts`:
  - Add to `envSchema` object: `ARCA_MASTER_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/).default('0000000000000000000000000000000000000000000000000000000000000000')`
  - Add `superRefine` check: if `NODE_ENV === 'production'` and the value is the dev default, refuse to boot (same pattern as `BETTER_AUTH_SECRET`)
  - Import pattern: `z.string().regex(...)` — see spec R5 for exact regex `/^[0-9a-fA-F]{64}$/`
- `middleware/errorHandler.ts`:
  - Import `ValidationError`
  - Add handler before the generic `500` catch: `if (err instanceof ValidationError) { return res.status(400).json({ error: err.message }); }`
  - Keep the ZodError → 400 handler above it (ZodError is checked first, so ValidationError only catches our domain errors)

**Verification**:
- `ValidationError` is exported and throws/catches correctly
- `env.ARCA_MASTER_KEY` is a 64-char hex string at runtime
- Set `ARCA_MASTER_KEY=wrong` on boot → `.parse()` throws (validation fails)
- Error handler maps `new ValidationError('TEST_ERROR')` → 400 response with `{ error: "TEST_ERROR" }`

---

### T3: Create `arca.ts` Zod schema and update shared package exports

**Files**: `packages/shared/src/schemas/arca.ts` (NEW), `packages/shared/src/index.ts`
**Depends on**: none
**Spec ref**: arca-configuration.md#R7, R8
**Test**: none (schema types are tested implicitly)

**Implementation notes**:
- Create `packages/shared/src/schemas/arca.ts` with:
  ```typescript
  import { z } from 'zod';

  export const issuerConditionEnum = z.enum([
    'monotributo',
    'responsable_inscripto',
    'exento',
    'consumidor_final',
  ]);

  export const arcaEnvironmentEnum = z.enum(['testing', 'production']);

  export const arcaConfigSchema = z.object({
    taxId: z.string().min(11).max(11).regex(/^\d{11}$/, 'CUIT must be exactly 11 digits'),
    issuerCondition: issuerConditionEnum,
    arcaEnvironment: arcaEnvironmentEnum.default('testing'),
    arcaCertPem: z.string().optional(),
    arcaPrivateKeyPem: z.string().optional(),
  }).superRefine((data, ctx) => {
    // Both PEMs or neither
    const hasCert = 'arcaCertPem' in data && data.arcaCertPem !== undefined;
    const hasKey = 'arcaPrivateKeyPem' in data && data.arcaPrivateKeyPem !== undefined;
    if (hasCert !== hasKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['arcaCertPem'],
        message: 'Both arcaCertPem and arcaPrivateKeyPem must be provided together or neither',
      });
    }
  });

  export type ArcaConfig = z.infer<typeof arcaConfigSchema>;

  export const arcaUpdateSchema = arcaConfigSchema.partial();
  export type ArcaUpdateInput = z.infer<typeof arcaUpdateSchema>;
  ```
- `packages/shared/src/index.ts`: add `export * from './schemas/arca.js';` after the existing exports (alphabetical order with schemas)
- Note: `taxId` accepts both raw `30123456789` and formatted `30-12345678-9` — the service layer will normalize before persistence

**Verification**:
- `arcaConfigSchema.parse(...)` succeeds with valid data
- `arcaConfigSchema.parse({ taxId: '123', issuerCondition: 'monotributo' })` fails — CUIT too short
- PEM pair validation: one PEM without the other → Zod error
- `index.ts` exports `arcaConfigSchema`, `ArcaConfig`, `issuerConditionEnum`, etc.

---

### T4: Add ARCA fiscal fields to `business`, `branch`, `customer` Zod schemas

**Files**: `packages/shared/src/schemas/business.ts`, `packages/shared/src/schemas/branch.ts`, `packages/shared/src/schemas/customer.ts`
**Depends on**: T3
**Spec ref**: arca-configuration.md#R1, R2, R3
**Test**: none

**Implementation notes**:
- `business.ts` — add to `businessSchema`:
  ```typescript
  taxId: z.string().nullable().default(null),
  issuerCondition: issuerConditionEnum.nullable().default(null),
  arcaEnvironment: arcaEnvironmentEnum.default('testing'),
  arcaCertPem: z.string().nullable().default(null),
  arcaPrivateKeyPem: z.string().nullable().default(null),
  ```
  - Import `issuerConditionEnum, arcaEnvironmentEnum` from `./arca.js`
  - The `updateBusinessSchema` uses `.pick()` so new fields are NOT automatically included in updates — that's fine, ARCA config has its own endpoint
- `branch.ts` — add to `branchSchema`:
  ```typescript
  salesPoint: z.number().int().positive().nullable().default(null),
  ```
- `customer.ts` — add to `customerSchema`:
  ```typescript
  cuit: z.string().nullable().default(null),
  dni: z.string().nullable().default(null),
  vatCondition: issuerConditionEnum.nullable().default(null),
  ```
  - Import `issuerConditionEnum` from `./arca.js`

**Verification**:
- `businessSchema.parse({...})` works with and without the new nullable fields
- `customerSchema.parse(...)` includes `cuit`, `dni`, `vatCondition`
- `branchSchema.parse(...)` includes `salesPoint`
- Existing tests that use these schemas continue to pass (all new fields have defaults)

---

### T5: Add `arcaStatus` to Sale Zod schema

**Files**: `packages/shared/src/schemas/example.ts`
**Depends on**: T3
**Spec ref**: arca-vouchers.md#R2
**Test**: none

**Implementation notes**:
- `example.ts` — add to `saleSchema`:
  ```typescript
  arcaStatus: z.enum(['authorized', 'rejected', 'indeterminate']).nullable().default(null),
  ```
- No modification needed for `createSaleSchema` — `arcaStatus` is not set on creation

**Verification**:
- `saleSchema.parse({...})` includes `arcaStatus: null` by default
- `createSaleSchema.parse(...)` does NOT accept `arcaStatus`

---

### T6: Add ARCA columns to `Business.model` and `Branch.model`

**Files**: `apps/api/src/modules/business/business.model.ts`, `apps/api/src/modules/branches/branch.model.ts`
**Depends on**: T4
**Spec ref**: arca-configuration.md#R1, R2
**Test**: none (model tests covered in migration + integration)

**Implementation notes**:
- `business.model.ts`:
  - Add declare properties:
    ```typescript
    declare taxId: CreationOptional<string | null>;
    declare issuerCondition: CreationOptional<string | null>;
    declare arcaEnvironment: CreationOptional<string>;
    declare arcaCertPem: CreationOptional<string | null>;
    declare arcaPrivateKeyPem: CreationOptional<string | null>;
    ```
  - Add to `Business.init` columns:
    ```typescript
    taxId: { type: DataTypes.STRING(11), allowNull: true, unique: true },
    issuerCondition: { type: DataTypes.STRING, allowNull: true },
    arcaEnvironment: { type: DataTypes.STRING, allowNull: false, defaultValue: 'testing' },
    arcaCertPem: { type: DataTypes.TEXT, allowNull: true },
    arcaPrivateKeyPem: { type: DataTypes.TEXT, allowNull: true },
    ```
  - Note: In SQLite, ENUM maps to STRING. Use `DataTypes.STRING` for portability and add a `validate` in the model if strict validation is needed.

- `branch.model.ts`:
  - Add declare property: `declare salesPoint: CreationOptional<number | null>;`
  - Add to `Branch.init` columns: `salesPoint: { type: DataTypes.INTEGER, allowNull: true },`

**Verification**:
- `Business.create({ id, name })` succeeds with default values for new columns
- `Branch.create({ id, businessId, name })` succeeds with `salesPoint: null`
- `sequelize.sync({ force: true })` creates columns correctly
- TypeScript compiles without errors

---

### T7: Add ARCA columns to `Customer.model` and `Sale.model`

**Files**: `apps/api/src/modules/customers/customer.model.ts`, `apps/api/src/modules/_example/sales/sale.model.ts`
**Depends on**: T5
**Spec ref**: arca-configuration.md#R3, arca-vouchers.md#R2
**Test**: none

**Implementation notes**:
- `customer.model.ts`:
  - Add declare properties:
    ```typescript
    declare cuit: CreationOptional<string | null>;
    declare dni: CreationOptional<string | null>;
    declare vatCondition: CreationOptional<string | null>;
    ```
  - Add to `Customer.init` columns:
    ```typescript
    cuit: { type: DataTypes.STRING(11), allowNull: true },
    dni: { type: DataTypes.STRING, allowNull: true },
    vatCondition: { type: DataTypes.STRING, allowNull: true, defaultValue: 'consumidor_final' },
    ```

- `sale.model.ts`:
  - Add declare property: `declare arcaStatus: CreationOptional<string | null>;`
  - Add to `Sale.init` columns:
    ```typescript
    arcaStatus: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    ```

**Verification**:
- `Customer.create({ id, businessId, name })` succeeds with defaults
- `Sale.create({...existingFields})` succeeds with `arcaStatus: null`
- TypeScript compiles without errors

**Status**: ✅ Done

---

### T8: Create migration `00007-arca-vouchers.ts`

**Files**: `apps/api/src/db/migrations/00007-arca-vouchers.ts` (NEW)
**Depends on**: T6, T7
**Spec ref**: arca-vouchers.md#R5, R6
**Test**: `apps/api/src/db/migrations/00007-arca-vouchers.test.ts`

**Implementation notes**:
- Follow the exact pattern from existing migrations (e.g. `00004-internal-sales.ts`):
  ```typescript
  import { DataTypes, type QueryInterface } from 'sequelize';
  import type { Migration } from '../migrate.js';

  export const up: Migration = async ({ context: queryInterface }) => { ... };
  export const down: Migration = async ({ context: queryInterface }) => { ... };
  ```

- **Up migration** (6 operations in order):
  1. **Business columns** (5 columns):
     - `taxId` → `STRING(11)`, nullable true, unique true
     - `issuerCondition` → wrap ENUM in try/catch for SQLite (fallback to STRING)
     - `arcaEnvironment` → same ENUM-wrapping pattern, default 'testing'
     - `arcaCertPem` → `TEXT`, nullable true
     - `arcaPrivateKeyPem` → `TEXT`, nullable true
  2. **Branch column**: `salesPoint` → `INTEGER`, nullable true
  3. **Customer columns** (3 columns):
     - `cuit` → `STRING(11)`, nullable true
     - `dni` → `STRING`, nullable true
     - `vatCondition` → ENUM-wrapped/STRING, nullable true, default 'consumidor_final'
  4. **Sale column**: `arcaStatus` → STRING, nullable true
  5. **Create `arca_vouchers` table**:
     - All columns as specified in the design doc
     - `rawResponse` → `DataTypes.TEXT` (JSONB not supported in SQLite)
     - ENUMs wrapped in try/catch
  6. **Create `arca_store` table**:
     - `id` → `TEXT PK`, `value` → `TEXT NOT NULL`, `created_at` → `DATE DEFAULT NOW()`
     - Use `queryInterface.createTable` with `IF NOT EXISTS` behavior (wrap in try/catch or check first)

- ENUM wrapping pattern (as seen in design doc):
  ```typescript
  try {
    // PostgreSQL ENUM
    type: DataTypes.ENUM('monotributo','responsable_inscripto','exento','consumidor_final'),
  } catch {
    // SQLite fallback
    type: DataTypes.STRING,
  }
  ```

- **Down migration**: reverse all 6 operations:
  1. Drop `arca_store` table
  2. Drop `arca_vouchers` table
  3. Remove `arcaStatus` from `sales`
  4. Remove `cuit, dni, vatCondition` from `customers`
  5. Remove `salesPoint` from `branches`
  6. Remove `taxId, issuerCondition, arcaEnvironment, arcaCertPem, arcaPrivateKeyPem` from `businesses`

**Verification**:
- Migration runs successfully in SQLite (test/dev mode)
- Down migration runs cleanly (no errors)
- Running `umzug up` then `umzug down` leaves the DB in original state

**Status**: ✅ Done

---

### T9: Crypto layer — `deriveTenantKey`, `encryptPem`, `decryptPem`

**Files**: `apps/api/src/lib/arca/crypto.ts` (NEW)
**Depends on**: T2
**Spec ref**: arca-configuration.md#R4
**Test**: `apps/api/src/lib/arca/crypto.test.ts`

**Implementation notes**:
- Create `apps/api/src/lib/arca/crypto.ts`:
  ```typescript
  import { pbkdf2Sync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
  import { env } from '../../config/env.js';

  const ALGORITHM = 'aes-256-gcm';
  const KEY_LENGTH = 32; // 256 bits
  const IV_LENGTH = 12;  // 96 bits
  const TAG_LENGTH = 16; // 128 bits
  const ITERATIONS = 600_000;
  const DIGEST = 'sha256';
  const SALT_PREFIX = 'arca-tenant-key-v1:';

  export class EncryptionError extends Error {
    constructor(message: string, cause?: unknown) {
      super(message);
      this.name = 'EncryptionError';
      this.cause = cause;
    }
  }

  export function deriveTenantKey(businessId: string): Buffer {
    const masterKey = Buffer.from(env.ARCA_MASTER_KEY, 'hex');
    const salt = `${SALT_PREFIX}${businessId}`;
    return pbkdf2Sync(masterKey, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  }

  export function encryptPem(tenantKey: Buffer, pem: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, tenantKey, iv);
    let ciphertext = cipher.update(pem, 'utf-8', 'hex');
    ciphertext += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return JSON.stringify({ iv: iv.toString('hex'), tag, ciphertext });
  }

  export function decryptPem(tenantKey: Buffer, encrypted: string): string {
    try {
      const { iv, tag, ciphertext } = JSON.parse(encrypted);
      const decipher = createDecipheriv(
        ALGORITHM,
        tenantKey,
        Buffer.from(iv, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      let pem = decipher.update(ciphertext, 'hex', 'utf-8');
      pem += decipher.final('utf-8');
      return pem;
    } catch (err) {
      throw new EncryptionError('Failed to decrypt PEM — possible tampering or wrong key', err);
    }
  }
  ```

- The `decryptPem` function MUST NOT log PEM content on error — only the generic message
- Functions are pure: no side effects, no I/O, no global state

**Verification**:
- `deriveTenantKey('same-id')` returns identical Buffer on two calls (deterministic)
- `encryptPem(k, pem)`: output is a JSON string with `iv`, `tag`, `ciphertext` hex fields
- `decryptPem(k, encryptPem(k, pem))` returns the original PEM
- `decryptPem(k, tamperedCiphertext)` throws `EncryptionError`
- `deriveTenantKey('id1')` output differs from `deriveTenantKey('id2')` (different salt)

**Status**: ✅ Done

---

### T10: ARCA factory — adapter pattern for `@arcasdk/core`

**Files**: `apps/api/src/lib/arca/factory.ts` (NEW), `apps/api/src/lib/arca/factory.test.ts`
**Depends on**: T9
**Spec ref**: arca-invoicing.md#R7
**Test**: `apps/api/src/lib/arca/factory.test.ts`

**Implementation notes**:
- Create `apps/api/src/lib/arca/factory.ts` with:

  **1. Define abstract interface** (our app's contract, independent of SDK):
  ```typescript
  export type ArcaEnvironment = 'testing' | 'production';

  export interface IssueInvoiceInput {
    cuit: string;
    salesPoint: number;
    issuerCondition: string;
    customer: {
      cuit?: string | null;
      dni?: string | null;
      vatCondition: string;
    };
    invoice: {
      items: Array<{ name: string; quantity: number; unitPrice: number }>;
    };
    idempotencyKey: string;
  }

  export type VoucherResultStatus = 'authorized' | 'rejected' | 'indeterminate' | 'conflict';

  export interface VoucherResult {
    result: VoucherResultStatus;
    arcaVoucherId: string | null;
    arcaVoucherNumber: number | null;
    emissionCode: string | null;
    emissionMessage: string | null;
    rawResponse?: string;
  }

  export interface ArcaService {
    issueInvoice(input: IssueInvoiceInput): Promise<VoucherResult>;
  }
  ```

  **2. Custom `ITicketStoragePort`** backed by `arca_store` table (for WSAA token caching):
  ```typescript
  const ticketStorage: ITicketStoragePort = {
    async get(id: string): Promise<string | null> {
      const [rows] = await sequelize.query('SELECT value FROM arca_store WHERE id = ?', { replacements: [id] });
      return (rows as any[])[0]?.value ?? null;
    },
    async set(id: string, value: string): Promise<void> {
      await sequelize.query('INSERT OR REPLACE INTO arca_store (id, value, created_at) VALUES (?, ?, datetime(\'now\'))', { replacements: [id, value] });
    },
    async delete(id: string): Promise<void> {
      await sequelize.query('DELETE FROM arca_store WHERE id = ?', { replacements: [id] });
    },
  };
  ```
  Note: Use `datetime('now')` for SQLite compatibility; Postgres uses `NOW()`.

  **3. `createClient()` factory function**:
  ```typescript
  import Arca from '@arcasdk/core';

  // CJS → ESM interop: handle default export
  const ArcaConstructor = (Arca as any).default ?? Arca;

  export function createClient(cuit: string, certPem: string, privateKeyPem: string, production: boolean): ArcaService {
    const arcaInstance = new ArcaConstructor({
      cuits: {
        [cuit]: { cert: certPem, key: privateKeyPem },
      },
      production,
      storage: ticketStorage,
    });

    return {
      async issueInvoice(input: IssueInvoiceInput): Promise<VoucherResult> {
        const dto = {
          CbteTipo: 1,               // Factura A / B según issuerCondition
          PtoVta: input.salesPoint,
          Concepto: 1,                // Productos
          DocTipo: input.customer.dni ? 96 : 80, // DNI=96, CUIT=80
          DocNro: input.customer.cuit?.replace(/-/g, '') || input.customer.dni,
          // ... more SOAP fields
        };
        // SDK's createNextVoucher handles the SOAP call + voucher number
        const result = await arcaInstance.createNextVoucher(cuit, dto);
        return mapResult(result);
      },
    };
  }
  ```

  - ⚠️ The `ITicketStoragePort` type must be imported from `@arcasdk/core/types` if exported, or defined locally matching the expected interface (get/set/delete methods).
  - The SOAP DTO mapping (ARCA field names) should be extracted to a helper `mapInputToArcaDTO(input, business, customer)` for clarity.
  - Result mapping (`mapResult`) converts the SDK's SOAP response to our `VoucherResult` interface.

**Verification**:
- `createClient(cuit, cert, key, false)` returns an `ArcaService` instance
- `issueInvoice({...})` on the adapter works with the SDK
- `arca_store` table is used for token storage (check after first call)
- TypeScript compiles with the CJS/ESM interop

**Status**: ✅ Done

---

---

### T11: Invoicing service — `issueInvoice()`

**Files**: `apps/api/src/lib/arca/invoicing.service.ts` (NEW)
**Depends on**: T10, T8, T5
**Spec ref**: arca-invoicing.md#R1–R8, arca-vouchers.md#R3
**Test**: `apps/api/src/lib/arca/invoicing.service.test.ts`

**Implementation notes**:
- Create `apps/api/src/lib/arca/invoicing.service.ts`:

  **Imports**:
  - `deriveTenantKey`, `decryptPem`, `EncryptionError` from `./crypto.js`
  - `createClient`, type `IssueInvoiceInput`, type `VoucherResult` from `./factory.js`
  - `Business` from `../../modules/business/business.model.js`
  - `Branch` from `../../modules/branches/branch.model.js`
  - `Sale` from `../../modules/_example/sales/sale.model.js`
  - `Customer` from `../../modules/customers/customer.model.js`
  - `sequelize` from `../../config/database.js`
  - `ValidationError`, `ConflictError`, `NotFoundError` from `../../lib/errors.js`

  **Function signature**:
  ```typescript
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

  export async function issueInvoice(
    businessId: string,
    branchId: string,
    saleId: string,
  ): Promise<VoucherRecord>
  ```

  **Step-by-step orchestration**:

  1. **Fetch entities** (parallel with `Promise.all`):
     - `Business.findByPk(businessId)` — throw `NotFoundError('BUSINESS_NOT_FOUND')`
     - `Branch.findOne({ where: { id: branchId, businessId } })` — throw `NotFoundError('BRANCH_NOT_FOUND')`
     - `Sale.findByPk(saleId)` with eager or manual join:
       - Include `Customer` and `Item` via `sequelize.query` or `Sale.findByPk` with `include`
       - If using raw query: `SELECT s.*, c.*, i.* FROM sales s JOIN customers c ON ... JOIN items i ON ... WHERE s.id = ? AND s.businessId = ?`

  2. **Precondition checks** (R2) — each throws `ValidationError(errorCode)`:
     - `ARCA_NOT_CONFIGURED`: `business.arcaCertPem == null || business.arcaPrivateKeyPem == null`
     - `BUSINESS_MISSING_TAX_ID`: `business.taxId == null`
     - `BUSINESS_MISSING_ISSUER_CONDITION`: `business.issuerCondition == null`
     - `BRANCH_MISSING_SALES_POINT`: `branch.salesPoint == null`
     - `SALE_MISSING_CUSTOMER`: `sale.customerId == null`
     - `CUSTOMER_MISSING_FISCAL_ID`: `customer.cuit == null && customer.dni == null`
     - `SALE_ALREADY_EMITTED`: `sale.arcaStatus === 'authorized' || sale.arcaStatus === 'indeterminate'` — throws `ConflictError`

  3. **Decrypt PEMs**:
     ```typescript
     const tenantKey = deriveTenantKey(businessId);
     const certPem = decryptPem(tenantKey, business.arcaCertPem);
     const privateKeyPem = decryptPem(tenantKey, business.arcaPrivateKeyPem);
     ```
     Wrap in try/catch → catch `EncryptionError` → re-throw as `ValidationError('ENCRYPTION_ERROR')`

  4. **Build service input & create client** (using our adapter):
     ```typescript
     const production = business.arcaEnvironment === 'production';
     const client = createClient(
       business.taxId.replace(/-/g, ''),
       certPem,
       privateKeyPem,
       production,
     );
     ```

  5. **Call adapter with timeout** (R5):
     ```typescript
     const controller = new AbortController();
     const timeout = setTimeout(() => controller.abort(), 20_000);
     try {
       const outcome = await client.issueInvoice({
         cuit: business.taxId.replace(/-/g, ''),
         salesPoint: branch.salesPoint,
         issuerCondition: business.issuerCondition,
         customer: {
           cuit: customer.cuit?.replace(/-/g, ''),
           dni: customer.dni,
           vatCondition: customer.vatCondition,
         },
         invoice: {
           items: [{
             name: item.name,
             quantity: sale.quantity,
             unitPrice: sale.unitPrice,
           }],
         },
         idempotencyKey: sale.id,
       });
       // handle outcome...
     } catch (err) {
       if ((err as any)?.name === 'AbortError') {
         throw new ValidationError('ARCA_TIMEOUT');
       }
       throw err;
     } finally {
       clearTimeout(timeout);
     }
     ```

  6. **Handle outcome** (R6) — inside a Sequelize transaction:
     - Build voucher record from `outcome` mapping
     - For `authorized`: `result='authorized'`, extract `arcaVoucherId`, `arcaVoucherNumber`, `emissionCode`
     - For `rejected`: `result='rejected'`, extract rejection code and message
     - For `indeterminate`: `result='indeterminate'`, trace ID, message
     - For `conflict`: `result='conflict'`, look up existing voucher by `saleId`, return it
     - INSERT into `arca_vouchers` (raw query via `sequelize.query`)
     - UPDATE `sales` SET `arcaStatus = ?` WHERE `id = ?`
     - On conflict/duplicate key for INSERT (unique constraint on saleId), query existing voucher

  7. **Return** `VoucherRecord`

**Verification**:
- All 7 precondition checks throw the correct error
- `authorized` outcome → voucher stored, Sale.arcaStatus = 'authorized'
- `rejected` outcome → voucher stored, Sale.arcaStatus = 'rejected'
- `conflict` outcome → returns existing voucher, Sale unchanged
- Timeout throws `ARCA_TIMEOUT`, no side effects
- Encryption failure → `ENCRYPTION_ERROR`, no SDK call

**Status**: ✅ Done

---

### T12: Business ARCA configuration endpoints

**Files**: `apps/api/src/modules/arca/arca.controller.ts` (NEW), `apps/api/src/modules/business/business.service.ts`
**Depends on**: T3, T6, T9
**Spec ref**: arca-configuration.md#R7, R8
**Test**: `apps/api/src/modules/arca/arca.service.test.ts`

**Implementation notes**:

- **`business.service.ts`** — add two new methods:
  ```typescript
  import { deriveTenantKey, encryptPem } from '../../lib/arca/crypto.js';

  async getArcaConfig(businessId: string): Promise<{
    taxId: string | null;
    issuerCondition: string | null;
    arcaEnvironment: string;
    arcaConfigured: boolean;
  }> {
    const business = await this.getById(businessId);
    if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');
    return {
      taxId: business.taxId ?? null,
      issuerCondition: business.issuerCondition ?? null,
      arcaEnvironment: business.arcaEnvironment ?? 'testing',
      arcaConfigured: !!(business.arcaCertPem && business.arcaPrivateKeyPem),
    };
  }

  async updateArcaConfig(
    businessId: string,
    input: {
      taxId: string;
      issuerCondition: string;
      arcaEnvironment?: string;
      arcaCertPem?: string;
      arcaPrivateKeyPem?: string;
    }
  ): Promise<{
    taxId: string | null;
    issuerCondition: string | null;
    arcaEnvironment: string;
    arcaConfigured: boolean;
  }> {
    const business = await this.getById(businessId);
    if (!business) throw new NotFoundError('BUSINESS_NOT_FOUND');

    const updateData: any = {
      taxId: input.taxId.replace(/-/g, ''),  // normalize CUIT (remove hyphens)
      issuerCondition: input.issuerCondition,
    };

    if (input.arcaEnvironment !== undefined) {
      updateData.arcaEnvironment = input.arcaEnvironment;
    }

    // Encrypt PEMs if provided (both or neither — validated by Zod)
    if (input.arcaCertPem && input.arcaPrivateKeyPem) {
      const tenantKey = deriveTenantKey(businessId);
      updateData.arcaCertPem = encryptPem(tenantKey, input.arcaCertPem);
      updateData.arcaPrivateKeyPem = encryptPem(tenantKey, input.arcaPrivateKeyPem);
    }

    await business.update(updateData);
    return {
      taxId: updateData.taxId,
      issuerCondition: updateData.issuerCondition,
      arcaEnvironment: updateData.arcaEnvironment ?? business.arcaEnvironment,
      arcaConfigured: !!(
        (updateData.arcaCertPem ?? business.arcaCertPem) &&
        (updateData.arcaPrivateKeyPem ?? business.arcaPrivateKeyPem)
      ),
    };
  }
  ```

- **`arca.controller.ts`** — new file with 4 endpoints:
  ```typescript
  import type { Request, Response, NextFunction } from 'express';
  import { arcaConfigSchema } from '@template/shared';
  import { businessService } from '../business/business.service.js';

  export const arcaController = {
    async getConfig(req: Request, res: Response, next: NextFunction) {
      try {
        const config = await businessService.getArcaConfig(req.auth!.businessId!);
        res.json(config);
      } catch (err) {
        next(err);
      }
    },

    async updateConfig(req: Request, res: Response, next: NextFunction) {
      try {
        const input = arcaConfigSchema.parse(req.body);
        const config = await businessService.updateArcaConfig(req.auth!.businessId!, input);
        res.json(config);
      } catch (err) {
        next(err);
      }
    },

    // T13 will add the issue and query-voucher handlers
  };
  ```

- Note: Use `arcaConfigSchema` from `@template/shared` for Zod validation. It requires both PEMs if one is present, and validates CUIT format.
- The controller exports will be expanded in T13 with the emission and query endpoints.

**Verification**:
- `getArcaConfig` returns config without PEMs, with `arcaConfigured` boolean
- `updateArcaConfig` encrypts PEMs before save, returns config without PEMs
- `updateArcaConfig` with only `arcaEnvironment` → partial update, PEMs unchanged
- `updateArcaConfig` encrypts PEMs using `deriveTenantKey(businessId)`

**Status**: ✅ Done

---

### T13: Emission and query endpoints + routes wiring

**Files**: `apps/api/src/modules/arca/arca.controller.ts`, `apps/api/src/modules/arca/arca.routes.ts` (NEW), `apps/api/src/routes/index.ts`
**Depends on**: T12, T11
**Spec ref**: arca-invoicing.md#R1, arca-vouchers.md#R4
**Test**: via T12 test file

**Implementation notes**:

- **`arca.controller.ts`** — add two more handlers:
  ```typescript
  import { issueInvoice } from '../../lib/arca/invoicing.service.js';

  async function issue(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const voucher = await issueInvoice(
        req.auth!.businessId!,
        req.auth!.branchId!,
        id,
      );
      res.json(voucher);
    } catch (err) {
      next(err);
    }
  }

  async function getVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const includeRaw = req.query.includeRaw === 'true';

      // Query arca_vouchers by saleId + businessId
      const [rows] = await sequelize.query(
        `SELECT * FROM arca_vouchers WHERE "saleId" = ? AND "businessId" = ?`,
        { replacements: [id, req.auth!.businessId!] },
      );
      const voucher = (rows as any[])[0];
      if (!voucher) {
        throw new NotFoundError('ARCA_VOUCHER_NOT_FOUND');
      }

      const response: any = {
        id: voucher.id,
        saleId: voucher.saleId,
        result: voucher.result,
        arcaVoucherId: voucher.arcaVoucherId,
        arcaVoucherNumber: voucher.arcaVoucherNumber,
        emissionCode: voucher.emissionCode,
        emissionMessage: voucher.emissionMessage,
        emittedAt: voucher.emittedAt,
      };
      if (includeRaw) {
        response.rawResponse = voucher.rawResponse;
      }
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
  ```
  - Import `sequelize` from `../../config/database.js` and `NotFoundError` from `../../lib/errors.js`

- **`arca.routes.ts`** — new file:
  ```typescript
  import { Router } from 'express';
  import { requireAuth } from '../../middleware/requireAuth.js';
  import { requireBusiness } from '../../middleware/requireBusiness.js';
  import { requireBranch } from '../../middleware/requireBranch.js';
  import { requirePermission } from '../../middleware/requirePermission.js';
  import { arcaController } from './arca.controller.js';

  export const arcaRoutes = Router();

  arcaRoutes.use(requireAuth, requireBusiness);

  arcaRoutes.get('/business/arca', requirePermission('business:read'), arcaController.getConfig);
  arcaRoutes.put('/business/arca', requirePermission('business:update'), arcaController.updateConfig);
  arcaRoutes.post('/sales/:id/issue', requireBranch, requirePermission('sales:update'), arcaController.issue);
  arcaRoutes.get('/sales/:id/arca-voucher', requirePermission('sales:read'), arcaController.getVoucher);
  ```
  - The `POST /sales/:id/issue` route needs `requireBranch` to resolve `req.auth.branchId`
  - The `GET /sales/:id/arca-voucher` does NOT need `requireBranch` — only business-scoped

- **`routes/index.ts`** — add import and wire:
  ```typescript
  import { arcaRoutes } from '../modules/arca/arca.routes.js';
  // ...
  routes.use('/', arcaRoutes);
  ```
  - Insert after `financialsRoutes` line, before the end
  - Uses `'/'` because ARCA routes already include full path prefixes like `/business/arca` and `/sales/:id/issue`

**Verification**:
- `GET /api/business/arca` returns config (no PEMs)
- `PUT /api/business/arca` with valid body → 200
- `POST /api/sales/:id/issue` with valid sale → 200 with voucher
- `GET /api/sales/:id/arca-voucher` → 200 with voucher (404 if none)
- All routes return 401/403 without proper auth
- All routes respect business-scoping

**Status**: ✅ Done

---

### T14: ArcaVoucher model and models/index.ts associations

**Files**: `apps/api/src/modules/arca/arca-voucher.model.ts` (NEW), `apps/api/src/models/index.ts`
**Depends on**: T8
**Spec ref**: arca-vouchers.md#R1
**Test**: none (indirect via invoicing service test)

**Implementation notes**:

- **`arca-voucher.model.ts`** — lightweight model for type-safe queries if needed:
  ```typescript
  import {
    DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes,
  } from 'sequelize';
  import { sequelize } from '../../config/database.js';

  export class ArcaVoucher extends Model<
    InferAttributes<ArcaVoucher>,
    InferCreationAttributes<ArcaVoucher>
  > {
    declare id: CreationOptional<string>;
    declare businessId: string;
    declare saleId: string;
    declare result: string;
    declare arcaVoucherId: CreationOptional<string | null>;
    declare arcaVoucherNumber: CreationOptional<number | null>;
    declare emissionCode: CreationOptional<string | null>;
    declare emissionMessage: CreationOptional<string | null>;
    declare rawResponse: string;
    declare idempotencyKey: string;
    declare emittedAt: CreationOptional<Date>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
  }

  ArcaVoucher.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      businessId: { type: DataTypes.UUID, allowNull: false },
      saleId: { type: DataTypes.UUID, allowNull: false, unique: true },
      result: { type: DataTypes.STRING, allowNull: false },
      arcaVoucherId: { type: DataTypes.STRING, allowNull: true },
      arcaVoucherNumber: { type: DataTypes.INTEGER, allowNull: true },
      emissionCode: { type: DataTypes.STRING, allowNull: true },
      emissionMessage: { type: DataTypes.TEXT, allowNull: true },
      rawResponse: { type: DataTypes.TEXT, allowNull: false },
      idempotencyKey: { type: DataTypes.STRING, allowNull: false },
      emittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    },
    { sequelize, modelName: 'arca_voucher', tableName: 'arca_vouchers' },
  );
  ```

- **`models/index.ts`** — add:
  ```typescript
  import { ArcaVoucher } from '../modules/arca/arca-voucher.model.js';

  // Add associations:
  Business.hasMany(ArcaVoucher, { foreignKey: 'businessId' });
  ArcaVoucher.belongsTo(Business, { foreignKey: 'businessId' });
  Sale.hasOne(ArcaVoucher, { foreignKey: 'saleId' });
  ArcaVoucher.belongsTo(Sale, { foreignKey: 'saleId' });

  // Add to exports list:
  export { ..., ArcaVoucher };
  ```

- Note: This model is optional for the invoicing service (which uses raw queries). Create it for type safety and association integrity. If the invoicing service uses this model instead of raw queries, refactor T11 accordingly.

**Verification**:
- `ArcaVoucher.init` runs without column errors
- `sequelize.sync({ force: true })` succeeds
- `ArcaVoucher.belongsTo(Business)` association works
- TypeScript compiles

---

### T15: Tests

**Files**:
- `apps/api/src/lib/arca/crypto.test.ts` (NEW)
- `apps/api/src/lib/arca/invoicing.service.test.ts` (NEW)
- `apps/api/src/modules/arca/arca.service.test.ts` (NEW)
- `apps/api/src/db/migrations/00007-arca-vouchers.test.ts` (NEW)
**Depends on**: T9, T11, T12, T8
**Spec ref**: design.md Testing Strategy
**Test**: self-referential (these ARE the tests)

**Implementation notes**:

#### `crypto.test.ts` — unit tests for crypto layer

Setup: no DB needed, pure function tests.

```typescript
import { describe, expect, it } from 'vitest';
import { deriveTenantKey, encryptPem, decryptPem, EncryptionError } from './crypto.js';

describe('deriveTenantKey', () => {
  it('returns deterministic key for same businessId', () => {
    const k1 = deriveTenantKey('biz-1');
    const k2 = deriveTenantKey('biz-1');
    expect(k1.equals(k2)).toBe(true);
  });

  it('returns different keys for different businessIds', () => {
    const k1 = deriveTenantKey('biz-1');
    const k2 = deriveTenantKey('biz-2');
    expect(k1.equals(k2)).toBe(false);
  });
});

describe('encryptPem → decryptPem roundtrip', () => {
  it('returns original PEM after encrypt+decrypt', () => {
    const key = deriveTenantKey('biz-1');
    const pem = '-----BEGIN CERTIFICATE-----\nTESTCERT\n-----END CERTIFICATE-----';
    const encrypted = encryptPem(key, pem);
    expect(() => JSON.parse(encrypted)).not.toThrow();
    const parsed = JSON.parse(encrypted);
    expect(parsed).toHaveProperty('iv');
    expect(parsed).toHaveProperty('tag');
    expect(parsed).toHaveProperty('ciphertext');
    const decrypted = decryptPem(key, encrypted);
    expect(decrypted).toBe(pem);
  });

  it('throws EncryptionError on tampered ciphertext', () => {
    const key = deriveTenantKey('biz-1');
    const encrypted = encryptPem(key, 'my-pem');
    const tampered = JSON.stringify({ ...JSON.parse(encrypted), ciphertext: 'deadbeef' });
    expect(() => decryptPem(key, tampered)).toThrow(EncryptionError);
  });

  it('throws EncryptionError with wrong key', () => {
    const key1 = deriveTenantKey('biz-1');
    const key2 = deriveTenantKey('biz-2');
    const encrypted = encryptPem(key1, 'my-pem');
    expect(() => decryptPem(key2, encrypted)).toThrow(EncryptionError);
  });
});
```

#### `invoicing.service.test.ts` — service orchestration tests

Setup: mock SDK `issue()` function, mock DB queries.

- Use `vi.mock('facturas')` to mock the SDK
- Use `vi.mock('../../config/database.js')` to mock `sequelize.query`
- Use `Sequelize` model mock or actual in-memory SQLite for Business/Branch/Sale tables

Test structure:
```typescript
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { sequelize } from '../../config/database';
// ... setup test DB with sync({ force: true }), seed business/branch/sale/customer/item
// ... create mock factory.createClient that returns { issue: vi.fn() }

describe('issueInvoice', () => {
  it('emits authorized invoice and stores voucher');
  it('rejects with ARCA_NOT_CONFIGURED when PEMs are null');
  it('rejects with BUSINESS_MISSING_TAX_ID when taxId is null');
  it('rejects with BRANCH_MISSING_SALES_POINT when salesPoint is null');
  it('rejects with SALE_ALREADY_EMITTED when arcaStatus is authorized');
  it('allows re-emission when arcaStatus is rejected');
  it('handles conflict outcome by returning existing voucher');
  it('throws ARCA_TIMEOUT when SDK times out');
});

// Each test: seed DB, mock SDK, call service, assert side effects
```

Test all precondition branches from R2 specifically:
- Each precondition check must be tested with a scenario where ONLY that precondition fails
- Use `vi.fn()` to verify SDK is NOT called when preconditions fail

#### `arca.service.test.ts` — controller/route integration tests

Setup: use `createTestApp()` + `resetTestDb()` + seed pattern from existing route tests.

```typescript
import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../../test/testApp';
// ... seed utilities

describe('GET /api/business/arca', () => {
  it('returns 401 without auth');
  it('returns arcaConfigured: false when not configured');
  it('returns arcaConfigured: true when configured');
  it('never returns PEM fields in response');
});

describe('PUT /api/business/arca', () => {
  it('encrypts and stores PEMs');
  it('rejects both PEMs missing when one is provided');
  it('allows partial update (environment only)');
  it('rejects invalid CUIT format via Zod');
});

describe('POST /api/sales/:id/issue', () => {
  it('returns 401 without auth');
  it('returns voucher on successful emission');
});
```

#### Migration test

```typescript
import { describe, expect, it } from 'vitest';
import { Sequelize } from 'sequelize';

describe('00007-arca-vouchers migration', () => {
  it('up runs without error on SQLite');
  it('down removes all added columns and tables');
  it('up+down restores original schema');
});
```

**Verification**:
- All tests pass: `npm run test --workspace=apps/api`
- Crypto tests: roundtrip, tamper detection, wrong key
- Invoicing tests: all precondition branches, each outcome type
- Route tests: auth, validation, response shapes, PEMs never exposed
- Migration test: up/down idempotency

---

## Dependency Graph

```
T1 (node + deps)
  │
T2 (errors + env)     T3 (arca schema)
  │                      │
  │                ┌─────┼─────┐
  │                │     │     │
  │               T4    T5    │
  │                │     │     │
  │               T6    T7    │
  │                │     │     │
  │                └──┬──┘     │
  │                   │        │
  │                  T8 (migration)
  │                   │
T9 (crypto) ──────────┤
  │                   │
T10 (factory)         │
  │                   │
T11 (invoicing) ◄─────┘
  │
  ├── T12 (config endpoints) ◄── T3, T6, T9
  │       │
  │       └── T13 (routes wiring)
  │               │
  │               └── T14 (voucher model)
  │
  └── T15 (tests) ◄── T9, T11, T12, T8
```

## Execution Order (recommended)

| Step | Tasks | Description |
|------|-------|-------------|
| 1 | T1, T2, T3 | Foundation: deps, env, errors, core schema |
| 2 | T4, T5 | Schema extensions for existing entities |
| 3 | T6, T7 | Sequelize model columns |
| 4 | T8 | Database migration |
| 5 | T9 | Crypto layer |
| 6 | T10 | ARCA factory |
| 7 | T11 | Invoicing service (the heart) |
| 8 | T12, T13, T14 | API endpoints + routes + voucher model |
| 9 | T15 | Tests — can start in parallel once deps are met |