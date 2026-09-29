# ARCA Invoicing — Spec

## Requirements

### R1. Endpoint: `POST /sales/:id/issue`

Emits an ARCA electronic invoice for a previously created sale.

- Authentication: `requireAuth`, `requireBusiness`, `requireBranch`, permission `sales:update`
- Route: `POST /sales/:id/issue`
- Business and Branch are resolved from `req.auth.businessId` and `req.auth.branchId`
- The sale `:id` MUST belong to the authenticated business (multi-tenant check via `saleRepository.findById(businessId, id)`)
- Response is always `200` with the voucher record (see vouchers spec), regardless of the emission result type.

### R2. Preconditions (checked before SDK call)

The invoicing service MUST validate ALL of the following before invoking the SDK. If any fails, throw a typed error and do NOT call the SDK:

| Check | Error code | Condition |
|-------|-----------|-----------|
| Business ARCA configured | `ARCA_NOT_CONFIGURED` | Business has NULL `arcaCertPem` or `arcaPrivateKeyPem` |
| Business taxId present | `BUSINESS_MISSING_TAX_ID` | Business `taxId` is null |
| Business issuerCondition present | `BUSINESS_MISSING_ISSUER_CONDITION` | Business `issuerCondition` is null |
| Branch salesPoint present | `BRANCH_MISSING_SALES_POINT` | Branch `salesPoint` is null |
| Customer has fiscal ID | `CUSTOMER_MISSING_FISCAL_ID` | Customer has neither `cuit` nor `dni` |
| Sale not already emitted | `SALE_ALREADY_EMITTED` | Sale has `arcaStatus` = `'authorized'` or `'indeterminate'` |
| Sale has a customer | `SALE_MISSING_CUSTOMER` | Sale `customerId` is null |

- The check for `SALE_ALREADY_EMITTED` uses the Sale's `arcaStatus` field. If the status is `'rejected'` or `'conflict'`, the endpoint MUST allow re-emission (the previous attempt failed).
- The check for customer fiscal ID is done after fetching the Customer from `customerId`.

### R3. Building the SDK `IssueInput`

The invoicing service MUST construct an `IssueInput` object for the `facturas` SDK by joining:

```
Sale → Sale.businessId → Business (taxId, issuerCondition, arcaEnvironment)
Sale → branchId → Branch (salesPoint)
Sale → customerId → Customer (name, cuit, dni, vatCondition)
Sale → itemId → Item (name, price)
```

The mapping to SDK's `IssueInput`:

| IssueInput field | Source | Notes |
|-----------------|--------|-------|
| `cuit` | Business.taxId | Normalized: 11 digits only, no hyphens |
| `issuerCondition` | Business.issuerCondition | Mapped via enum map (see R4) |
| `salesPoint` | Branch.salesPoint | Integer |
| `customer.cuit` | Customer.cuit | Optional, 11 digits |
| `customer.dni` | Customer.dni | Optional |
| `customer.vatCondition` | Customer.vatCondition | Mapped via enum map (see R4) |
| `invoice.items` | Sale → Item | Array with one item: name + quantity + unitPrice |
| `idempotencyKey` | Sale.id | String UUID; used for idempotency |

- `invoice.items` MUST be an array with a single element (Phase 1: one item per sale).
- Total amount is computed by SDK from `quantity * unitPrice` per item.

### R4. Issuer condition / VAT condition enum mapping

The `facturas` SDK uses its own enum values. The service MUST map:

| Our enum | SDK enum |
|----------|----------|
| `'monotributo'` | SDK.Monotributo |
| `'responsable_inscripto'` | SDK.ResponsableInscripto |
| `'exento'` | SDK.Exento |
| `'consumidor_final'` | SDK.ConsumidorFinal |

- If an unknown value is encountered, throw `INVALID_ISSUER_CONDITION` error before SDK call.

### R5. SDK invocation with timeout

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 20_000);
try {
  const outcome = await arca.issue(input, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

- The `AbortSignal` MUST have a 20-second timeout. If the SDK does not respond within 20s, the request is aborted and the sale is NOT marked as emitted.
- On abort, the service MUST throw `ARCA_TIMEOUT` error (HTTP 504).

### R6. Handling the 4 emission result types

The SDK returns an `IssueOutcome` discriminated union. The service MUST handle each branch:

#### `authorized`

The invoice was accepted by ARCA. The voucher is final.

- Sale.arcaStatus ← `'authorized'`
- Store full voucher in `arca_vouchers` (see vouchers spec R3)
- Return voucher record with HTTP 200

#### `rejected`

ARCA rejected the invoice (fiscal validation failed, e.g. CUIT mismatch, expired cert).

- Sale.arcaStatus ← `'rejected'`
- Store full voucher (including rejection message/code) in `arca_vouchers`
- Return voucher record with HTTP 200
- The client MUST inspect the voucher's `result` field to see the rejection details
- The sale CAN be re-emitted later (after fixing the configuration)

#### `indeterminate`

ARCA accepted the request but the final result is unknown (network glitch, timeout on ARCA's side).

- Sale.arcaStatus ← `'indeterminate'`
- Store full voucher in `arca_vouchers`
- Return voucher record with HTTP 200
- The sale MUST NOT be re-emitted (the status blocks emission — see R2)
- A future reconciliation process (Phase 2) will resolve these

#### `conflict`

The SDK detected a duplicate via its idempotency store (same `idempotencyKey` already processed).

- Sale.arcaStatus remains unchanged
- Store the conflict voucher (includes the previous voucher reference)
- Return the EXISTING voucher record with HTTP 200
- This is not an error — it is a successful deduplication

### R7. Idempotency via PostgresStore

The `facturas` SDK requires a `PostgresStore` instance to manage idempotency keys.

- A SINGLE `PostgresStore` singleton MUST be created at startup in `apps/api/src/lib/arca/factory.ts`
- It uses the application's existing `sequelize` pool (from `config/database.js`)
- The SDK handles all idempotency logic internally — the service only passes `idempotencyKey: sale.id`
- The required `arca_store` table MUST be created via migration (see vouchers spec)
- The PostgresStore SHOULD be initialized with a TTL of 24 hours for idempotency keys

### R8. Service orchestration (`lib/arca/invoicing.service.ts`)

The function signature:

```typescript
async function issueInvoice(
  businessId: string,
  branchId: string,
  saleId: string
): Promise<VoucherRecord>
```

Steps:

1. Fetch Business (includes encrypted PEMs, taxId, issuerCondition, arcaEnvironment)
2. Fetch Branch (salesPoint)
3. Fetch Sale + Customer + Item (eager-load or sequential queries)
4. Run preconditions (R2) — throw on failure
5. Decrypt PEMs using `decryptPem(deriveTenantKey(businessId), encryptedPem)`
6. Build ARCA client via factory (creates ephemeral client from decrypted PEMs + environment)
7. Build `IssueInput` from joined data (R3)
8. Call `arca.issue(input)` with abort signal (R5)
9. Handle outcome (R6) — persist voucher, update Sale
10. Return voucher record

- Steps 5 and 8 MUST be wrapped in a try/catch for encryption errors (`EncryptionError` → HTTP 500).
- The entire operation (steps 4–9) SHOULD be wrapped in a Sequelize transaction to ensure atomicity of voucher + sale update.

---

## Scenarios

### S1. Successful emission — authorized

```
GIVEN a Sale exists with:
  - status: completed (or any, no arcaStatus)
  - customerId: points to a Customer with cuit + vatCondition
  - itemId: points to an Item
  - branchId: points to a Branch with salesPoint: 1
  AND the Business has ARCA fully configured (testing environment)
WHEN POST /sales/:saleId/issue
THEN the preconditions pass
  AND the SDK is called with the correct IssueInput
  AND the SDK returns authorized
  AND Sale.arcaStatus is 'authorized'
  AND an arca_vouchers record is created with result: 'authorized'
  AND the response is 200 with the voucher data
```

### S2. Business not configured

```
GIVEN a Business with arcaCertPem = null
  AND a valid Sale
WHEN POST /sales/:id/issue
THEN the service throws ARCA_NOT_CONFIGURED
  AND the response is 400 or 422
  AND the SDK is NOT called
```

### S3. Branch has no salesPoint

```
GIVEN a Branch with salesPoint = null
  AND a valid Sale connected to that Branch
WHEN POST /sales/:id/issue
THEN the service throws BRANCH_MISSING_SALES_POINT
  AND the response is 400 or 422
  AND the SDK is NOT called
```

### S4. Customer has no fiscal ID

```
GIVEN the Sale's Customer has cuit = null AND dni = null
  AND a Business fully configured
WHEN POST /sales/:id/issue
THEN the service throws CUSTOMER_MISSING_FISCAL_ID
  AND the SDK is NOT called
```

### S5. Re-emission after rejection

```
GIVEN a Sale with arcaStatus = 'rejected'
  AND the Business has fixed its CUIT
WHEN POST /sales/:id/issue
THEN the preconditions pass (re-emission is allowed)
  AND the SDK is called again
  AND the new result is stored (assuming ARCA accepts this time)
```

### S6. Idempotent — same sale issued twice

```
GIVEN a Sale with arcaStatus = 'authorized'
WHEN POST /sales/:id/issue
THEN the service detects arcaStatus = 'authorized'
  AND returns SALE_ALREADY_EMITTED error
  AND the SDK is NOT called
```

### S7. Deduplication via SDK idempotency

```
GIVEN the first emission succeeded (authorized)
  AND arcaStatus was somehow reset (corner case)
WHEN POST /sales/:id/issue again
  AND the SDK detects the same idempotencyKey
THEN SDK returns conflict outcome
  AND the conflict voucher is stored
  AND the response is 200 with the existing voucher data
```

### S8. Timeout during emission

```
GIVEN ARCA takes longer than 20 seconds to respond
WHEN POST /sales/:id/issue
THEN AbortController aborts the request after 20s
  AND the service throws ARCA_TIMEOUT
  AND the response is 504
  AND Sale.arcaStatus is NOT modified
  AND no voucher is stored
```

### S9. ARCA rejects the invoice

```
GIVEN the Business has a wrong CUIT (mismatch with ARCA records)
WHEN POST /sales/:id/issue
THEN the SDK returns rejected
  AND Sale.arcaStatus is 'rejected'
  AND the voucher includes rejection code and message
  AND the response is 200 (not an error — business logic rejection)
```

---

## Validation Rules Summary

| Rule | Error code | When triggered | HTTP status |
|------|-----------|---------------|-------------|
| ARCA must be configured | `ARCA_NOT_CONFIGURED` | Business PEMs are null | 400 |
| Business must have taxId | `BUSINESS_MISSING_TAX_ID` | taxId is null | 400 |
| Business must have issuerCondition | `BUSINESS_MISSING_ISSUER_CONDITION` | issuerCondition is null | 400 |
| Branch must have salesPoint | `BRANCH_MISSING_SALES_POINT` | salesPoint is null | 400 |
| Customer must have CUIT or DNI | `CUSTOMER_MISSING_FISCAL_ID` | Both cuit and dni are null | 400 |
| Sale must have a customer | `SALE_MISSING_CUSTOMER` | customerId is null | 400 |
| Sale already emitted (authorized) | `SALE_ALREADY_EMITTED` | arcaStatus is authorized/indeterminate | 409 |
| SDK timeout | `ARCA_TIMEOUT` | 20s abort signal fires | 504 |
| Encryption failure | `ENCRYPTION_ERROR` | decryptPem throws | 500 |
| Unknown issuerCondition | `INVALID_ISSUER_CONDITION` | Enum value not in mapping | 500 |