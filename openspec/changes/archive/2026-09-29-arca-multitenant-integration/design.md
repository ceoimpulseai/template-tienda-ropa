# Design: ARCA Multi-Tenant Electronic Invoicing

## Technical Approach

Per-tenant encrypted PEM storage → ephemeral ARCA client per-request → `facturas` SDK emission → atomic voucher+Sale update. Encryption layer in `lib/arca/crypto.ts` derives tenant key from `ARCA_MASTER_KEY + businessId` via PBKDF2. A shared `PostgresStore` singleton handles idempotency across all tenants (SDK scopes internally by CUIT). Phase 1 covers invoice emission only (`POST /sales/:id/issue` + configuration endpoints).

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| PEM encryption | AES-256-GCM vs AES-256-CBC | GCM provides auth tag (tamper detection) without separate HMAC | AES-256-GCM — simpler, authenticated |
| Key derivation | PBKDF2 vs HKDF vs env-per-tenant | PBKDF2 OWASP-recommended; HKDF needs IKM management; env-per-tenant is N× env vars | PBKDF2 with 600K iterations |
| ARCA client lifecycle | Singleton vs per-request | Singleton couples config to boot; per-request isolates tenants and allows config changes without restart | Per-request (ephemeral) |
| Voucher table | Separate vs embedded in sales | Separate keeps sales decoupled; embedded adds columns for SDK union types | Separate `arca_vouchers` |
| `conflict` in Sale.arcaStatus | Include vs exclude | Conflict is SDK-level dedup, not a sale state | Exclude — Sale only gets `authorized/rejected/indeterminate` |

## Architecture Overview

```
┌──────────────┐
│   Client     │
└──┬───────────┘
   │ POST /sales/:id/issue
   ▼
┌──────────────────────────────────────────┐
│  Middleware chain                         │
│  requireAuth → requireBusiness → requireBranch
└──┬───────────────────────────────────────┘
   │ req.auth = { businessId, branchId, role }
   ▼
┌──────────────────────────────────────────┐
│  arca.controller.ts                      │
│  ↳ parse params, call service            │
└──┬───────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────┐
│  invoicing.service.ts                     │
│                                          │
│  1. Fetch Business (PEMs, taxId, env)    │
│  2. Fetch Branch (salesPoint)            │
│  3. Fetch Sale + Customer + Item         │
│  4. Run preconditions → throw on fail    │
│  5. deriveTenantKey(businessId)          │
│  6. decryptPem() → cert + key            │
│  7. factory.createClient(…) → ArcaClient │
│  8. Build IssueInput from entities       │
│  9. arcaClient.issue(input, {signal})    │
│ 10. Handle outcome → store voucher       │
│ 11. Update Sale.arcaStatus               │
└──┬───────────────────────────────────────┘
   │
   ├──▶ lib/arca/crypto.ts
   │    deriveTenantKey / encryptPem / decryptPem
   │
   ├──▶ lib/arca/factory.ts
   │    arcaPgStore (singleton) / createClient(…)
   │
   ├──▶ arca_vouchers table (Sequelize)
   │
   └──▶ arca_store table (SDK-managed)
```

## Data Model Changes

### Business (table `businesses`)

| Column | Type | Notes |
|--------|------|-------|
| `taxId` | `STRING(11)` | NOT NULL, CUIT |
| `issuerCondition` | `ENUM(…)` | NOT NULL |
| `arcaEnvironment` | `ENUM('testing','production')` | DEFAULT `'testing'` |
| `arcaCertPem` | `TEXT` | NULLABLE, encrypted |
| `arcaPrivateKeyPem` | `TEXT` | NULLABLE, encrypted |

### Branch (table `branches`)

| Column | Type | Notes |
|--------|------|-------|
| `salesPoint` | `INTEGER` | NULLABLE |

### Customer (table `customers`)

| Column | Type | Notes |
|--------|------|-------|
| `cuit` | `STRING(11)` | NULLABLE |
| `dni` | `STRING` | NULLABLE |
| `vatCondition` | `ENUM(…)` | NULLABLE, DEFAULT `'consumidor_final'` |

### Sale (table `sales`)

| Column | Type | Notes |
|--------|------|-------|
| `arcaStatus` | `ENUM('authorized','rejected','indeterminate')` | NULLABLE (null = not emitted) |

### arca_vouchers (new table)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| businessId | UUID | FK → businesses, NOT NULL |
| saleId | UUID | FK → sales, NOT NULL, UNIQUE |
| result | ENUM(4 values) | NOT NULL |
| arcaVoucherId | STRING | NULLABLE |
| arcaVoucherNumber | INTEGER | NULLABLE |
| emissionCode | STRING | NULLABLE |
| emissionMessage | TEXT | NULLABLE |
| rawResponse | JSONB/TEXT | NOT NULL |
| idempotencyKey | STRING | NOT NULL |
| emittedAt | DATE | NOT NULL |
| createdAt/updatedAt | DATE | Standard |

### arca_store (SDK-managed, new table)

| Column | Type | Constraints |
|--------|------|-------------|
| id | TEXT | PK |
| value | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

## Sequence Diagram: Invoice Emission

```
Client          Controller         InvoicingService       lib/arca            DB / SDK
  │                  │                    │                   │                  │
  │ POST /sales/X/issue                  │                   │                  │
  │────────────▶│                    │                   │                  │
  │              │ requireAuth/Business/Branch              │                  │
  │              │◀───────────────────│                   │                  │
  │              │ issueInvoice(businessId, branchId, saleId)│                  │
  │              │───────────────────▶│                   │                  │
  │              │                    │── Fetch Business ──▶│                  │
  │              │                    │◀─ Business (w/ PEMs)                 │
  │              │                    │── Fetch Branch ───▶│                  │
  │              │                    │◀─ Branch (salesPoint)               │
  │              │                    │── Fetch Sale+Customer+Item ──────▶   │
  │              │                    │◀─ Joined data   │                  │
  │              │                    │                   │                  │
  │              │                    │── Precondition checks               │
  │              │                    │   (R2 spec)      │                  │
  │              │                    │                   │                  │
  │              │                    │── decryptPem(deriveKey(bizId), enc) ▶ crypto.ts
  │              │                    │◀─ raw PEMs       │                  │
  │              │                    │                   │                  │
  │              │                    │── factory.createClient(PEMs, env)  ▶ factory.ts
  │              │                    │◀─ ArcaClient     │                  │
  │              │                    │                   │                  │
  │              │                    │── arca.issue(buildInput, {signal}) ▶ SDK
  │              │                    │◀─ IssueOutcome   │                  │
  │              │                    │                   │                  │
  │              │                    │── DB transaction:                   │
  │              │                    │   INSERT arca_vouchers               │
  │              │                    │   UPDATE Sale.arcaStatus             │
  │              │                    │                   │                  │
  │              │◀─── VoucherRecord ─│                   │                  │
  │◀─── 200 JSON ──│                    │                   │                  │
```

## Encryption Flow

```
ARCA_MASTER_KEY (64 hex chars)
       │
       ▼  Buffer.from(key, 'hex')
Raw master key (32 bytes)
       │
       ▼ PBKDF2(600K iterations, HMAC-SHA-256, salt)
salt = `arca-tenant-key-v1:${businessId}`
       │
       ▼
Tenant key (32 bytes) ──▶ AES-256-GCM encrypt/decrypt PEMs
                              │
                              ├─ encrypt: randomBytes(12) iv → ciphertext + authTag
                              │   output: `{"iv":"<hex>","tag":"<hex>","ciphertext":"<hex>"}`
                              │
                              └─ decrypt: parse envelope → AES-256-GCM decrypt(iv, tag, ciphertext)
                                  output: raw PEM string
```

## API Contracts

### `GET /business/arca`

Response `200`:
```json
{
  "taxId": "30-12345678-9",
  "issuerCondition": "responsable_inscripto",
  "arcaEnvironment": "testing",
  "arcaConfigured": true
}
```

### `PUT /business/arca`

Request body:
```json
{
  "taxId": "30-12345678-9",
  "issuerCondition": "responsable_inscripto",
  "arcaEnvironment": "testing",
  "arcaCertPem": "-----BEGIN CERTIFICATE-----\n...",
  "arcaPrivateKeyPem": "-----BEGIN RSA PRIVATE KEY-----\n..."
}
```
Both PEMs optional together. If omitted, stored values unchanged. Response same shape as GET (no PEMs).

### `POST /sales/:id/issue`

Response `200`:
```json
{
  "id": "uuid",
  "saleId": "uuid",
  "result": "authorized",
  "arcaVoucherId": "12345",
  "arcaVoucherNumber": 1,
  "emissionCode": "CAE-123456789",
  "emissionMessage": "Comprobante emitido exitosamente",
  "emittedAt": "2026-09-28T21:00:00Z"
}
```

### `GET /sales/:id/arca-voucher`

Response `200` — same shape as POST response. `?includeRaw=true` adds `rawResponse` field. Response `404` if no voucher.

## Error Handling

| Error code | HTTP | When | Recovery |
|-----------|------|------|----------|
| `ARCA_NOT_CONFIGURED` | 400 | Business PEMs are null | Configure ARCA via PUT /business/arca |
| `BUSINESS_MISSING_TAX_ID` | 400 | taxId is null | Update business config |
| `BUSINESS_MISSING_ISSUER_CONDITION` | 400 | issuerCondition is null | Update business config |
| `BRANCH_MISSING_SALES_POINT` | 400 | salesPoint is null | Update branch config |
| `CUSTOMER_MISSING_FISCAL_ID` | 400 | Customer has no CUIT/DNI | Update customer with fiscal ID |
| `SALE_MISSING_CUSTOMER` | 400 | sale.customerId is null | Assign customer to sale |
| `SALE_ALREADY_EMITTED` | 409 | arcaStatus is authorized/indeterminate | Cannot re-emit |
| `ARCA_TIMEOUT` | 504 | SDK >20s no response | Retry later |
| `ENCRYPTION_ERROR` | 500 | decryptPem fails | Check master key / data integrity |
| `INVALID_ISSUER_CONDITION` | 500 | Enum unknown at SDK mapping | Fix business config |

Error handler extends `errorHandler.ts` with a map of error message strings → status codes, using `ConflictError`/`NotFoundError` for known cases and a new `ValidationError` (400) for precondition failures.

## Cache Strategy

- **Cached**: Business ARCA config (PEMs, taxId, environment, issuerCondition) — via `TtlCache` in a new `arcaConfigCache`, TTL 60s. Reduces DB reads on hot emission path.
- **NOT cached**: ARCA client (ephemeral per-request, never reused). Tenant key (derived each request — PBKDF2 600K iterations may need optimization; revisit in Phase 2 with a short-lived LRU cache keyed by businessId).
- **Invalidation**: On `PUT /business/arca` success, delete the cache entry for that businessId.

## Security Considerations

1. **Master key**: `ARCA_MASTER_KEY` (64 hex chars) in env only, never logged. Production boot fails without it. Dev default allowed only in non-production.
2. **PEMs never logged**: All crypto functions must ensure PEM material is never written to logs. `console.log` of decrypted PEMs is a code review error.
3. **Encrypted at rest**: Both PEM columns are ciphertext. The raw PEM exists only in memory during the request that needs it.
4. **Auth boundary**: Every ARCA endpoint uses `requireAuth` + `requireBusiness` + `requirePermission`. Multi-tenant isolation via `businessId` on all queries.
5. **Idempotency key**: Uses `sale.id` (UUID). SDK's `PostgresStore` enforces at DB level. Never reuses keys across different sales.
6. **No PEM exposure**: The GET /business/arca endpoint explicitly excludes PEM fields. Only emission/decryption flows ever see plaintext PEMs.
7. **No GDPR deletion of vouchers**: `arca_vouchers` are fiscal records — structural data persists. Only PII in `emissionMessage`/`rawResponse` may be anonymized.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/lib/arca/crypto.ts` | Create | AES-256-GCM + PBKDF2 key derivation |
| `apps/api/src/lib/arca/factory.ts` | Create | arcaPgStore singleton + createClient() |
| `apps/api/src/lib/arca/invoicing.service.ts` | Create | issueInvoice() orchestration |
| `apps/api/src/modules/arca/arca.controller.ts` | Create | 4 new endpoints |
| `apps/api/src/modules/arca/arca.routes.ts` | Create | Routes + middleware wiring |
| `apps/api/src/modules/arca/arca.service.test.ts` | Create | Unit tests |
| `apps/api/src/db/migrations/00007-arca-vouchers.ts` | Create | 6 DDL operations |
| `packages/shared/src/schemas/arca.ts` | Create | ARCA config Zod schema |
| `apps/api/src/config/env.ts` | Modify | +ARCA_MASTER_KEY Zod validation |
| `apps/api/src/modules/business/business.model.ts` | Modify | +5 columns |
| `apps/api/src/modules/business/business.service.ts` | Modify | +ARCA config methods |
| `apps/api/src/modules/branches/branch.model.ts` | Modify | +salesPoint |
| `apps/api/src/modules/customers/customer.model.ts` | Modify | +3 fiscal columns |
| `apps/api/src/modules/_example/sales/sale.model.ts` | Modify | +arcaStatus |
| `packages/shared/src/index.ts` | Modify | +arca export |
| `packages/shared/src/schemas/business.ts` | Modify | +ARCA fields |
| `packages/shared/src/schemas/branch.ts` | Modify | +salesPoint |
| `packages/shared/src/schemas/customer.ts` | Modify | +fiscal fields |
| `packages/shared/src/schemas/example.ts` | Modify | +arcaStatus? on Sale |
| `apps/api/src/routes/index.ts` | Modify | +arcaRoutes |
| `apps/api/src/models/index.ts` | Modify | +ArcaVoucher model (if using Sequelize model for vouchers) |
| `package.json` | Modify | node >=22 |
| `apps/api/package.json` | Modify | node >=22, +facturas dep |

## Migration Details

Migration `00007-arca-vouchers.ts` (up):

```typescript
// 1. Business columns
await queryInterface.addColumn('businesses', 'taxId', {
  type: DataTypes.STRING(11), allowNull: false, unique: true
});
await queryInterface.addColumn('businesses', 'issuerCondition', {
  type: DataTypes.ENUM('monotributo','responsable_inscripto','exento','consumidor_final'),
  allowNull: false
});
await queryInterface.addColumn('businesses', 'arcaEnvironment', {
  type: DataTypes.ENUM('testing','production'), allowNull: false, defaultValue: 'testing'
});
await queryInterface.addColumn('businesses', 'arcaCertPem', {
  type: DataTypes.TEXT, allowNull: true
});
await queryInterface.addColumn('businesses', 'arcaPrivateKeyPem', {
  type: DataTypes.TEXT, allowNull: true
});

// 2. Branch column
await queryInterface.addColumn('branches', 'salesPoint', {
  type: DataTypes.INTEGER, allowNull: true
});

// 3. Customer columns
await queryInterface.addColumn('customers', 'cuit', {
  type: DataTypes.STRING(11), allowNull: true
});
await queryInterface.addColumn('customers', 'dni', {
  type: DataTypes.STRING, allowNull: true
});
await queryInterface.addColumn('customers', 'vatCondition', {
  type: DataTypes.ENUM('monotributo','responsable_inscripto','exento','consumidor_final'),
  allowNull: true, defaultValue: 'consumidor_final'
});

// 4. Sale column
await queryInterface.addColumn('sales', 'arcaStatus', {
  type: DataTypes.ENUM('authorized','rejected','indeterminate'),
  allowNull: true, defaultValue: null
});

// 5. arca_vouchers table
await queryInterface.createTable('arca_vouchers', {
  id: { type: DataTypes.UUID, primaryKey: true },
  businessId: { type: DataTypes.UUID, allowNull: false,
    references: { model: 'businesses', key: 'id' }},
  saleId: { type: DataTypes.UUID, allowNull: false,
    references: { model: 'sales', key: 'id' }, unique: true },
  result: { type: DataTypes.ENUM('authorized','rejected','indeterminate','conflict'),
    allowNull: false },
  arcaVoucherId: { type: DataTypes.STRING, allowNull: true },
  arcaVoucherNumber: { type: DataTypes.INTEGER, allowNull: true },
  emissionCode: { type: DataTypes.STRING, allowNull: true },
  emissionMessage: { type: DataTypes.TEXT, allowNull: true },
  rawResponse: { type: DataTypes.JSONB, allowNull: false },
  idempotencyKey: { type: DataTypes.STRING, allowNull: false },
  emittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false },
});

// 6. arca_store table (SDK-managed)
await queryInterface.createTable('arca_store', {
  id: { type: DataTypes.TEXT, primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});
```

- ENUMs wrapped in try/catch for SQLite (fallback to `DataTypes.STRING` with `validate` in model).
- `JSONB` → `DataTypes.TEXT` for SQLite compatibility.
- Down migration: reverse all `addColumn` → `removeColumn`, drop both tables.

## File Tree (complete)

```
apps/api/
├── package.json                       MODIFIED: node >=22, +facturas dep
├── src/
│   ├── config/
│   │   └── env.ts                     MODIFIED: +ARCA_MASTER_KEY Zod validation
│   ├── db/
│   │   └── migrations/
│   │       └── 00007-arca-vouchers.ts NEW
│   ├── lib/
│   │   └── arca/
│   │       ├── crypto.ts              NEW: deriveTenantKey, encryptPem, decryptPem
│   │       ├── factory.ts             NEW: arcaPgStore singleton, createClient
│   │       └── invoicing.service.ts   NEW: issueInvoice() with full orchestration
│   ├── modules/
│   │   ├── arca/
│   │   │   ├── arca.controller.ts     NEW: GET/PUT /business/arca,
│   │   │   │                               POST /sales/:id/issue,
│   │   │   │                               GET /sales/:id/arca-voucher
│   │   │   ├── arca.routes.ts         NEW: middleware + route wiring
│   │   │   └── arca.service.test.ts   NEW: unit tests
│   │   ├── business/
│   │   │   ├── business.model.ts      MODIFIED: +5 columns
│   │   │   └── business.service.ts    MODIFIED: +arcaConfig get/update methods
│   │   ├── branches/
│   │   │   └── branch.model.ts        MODIFIED: +salesPoint
│   │   ├── customers/
│   │   │   └── customer.model.ts      MODIFIED: +cuit, dni, vatCondition
│   │   └── _example/sales/
│   │       ├── sale.model.ts          MODIFIED: +arcaStatus
│   │       └── sale.repository.ts     (no change)
│   ├── models/
│   │   └── index.ts                   MODIFIED: +ArcaVoucher model import + assoc
│   └── routes/
│       └── index.ts                   MODIFIED: +arcaRoutes
package.json                           MODIFIED: node >=22
packages/shared/
└── src/
    ├── index.ts                       MODIFIED: +arca export
    └── schemas/
        ├── arca.ts                    NEW: arcaConfigSchema, ArcaConfig type
        ├── business.ts                MODIFIED: +ARCA Zod fields
        ├── branch.ts                  MODIFIED: +salesPoint
        ├── customer.ts                MODIFIED: +fiscal fields
        └── example.ts                 MODIFIED: +arcaStatus? on Sale
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | crypto.ts | Derive key deterministic; encrypt→decrypt roundtrip; tampered ciphertext throws; wrong key throws |
| Unit | invoicing.service.ts | Mock SDK; test each outcome branch + each precondition + timeout |
| Unit | factory.ts | Singleton arcaPgStore; ephemeral client creation |
| Unit | Controller | Mock service; test Zod validation, auth, response shape |
| Integration | Migration | Run up+down in SQLite in-memory; verify columns + tables |

## Open Questions

- [ ] PBKDF2 600K iterations may cause latency on emission path — consider process-level LRU cache for derived tenant keys in Phase 2
- [ ] SDK's `createPostgresStore({ query })` API — confirm it accepts `sequelize.query` directly or needs raw `pg` pool
- [ ] `ArcaVoucher` Sequelize model: needed for type-safe queries or use raw query interface only? (Prefer raw for simple CRUD)