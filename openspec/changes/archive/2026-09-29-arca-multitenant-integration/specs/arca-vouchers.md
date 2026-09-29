# ARCA Vouchers — Spec

## Requirements

### R1. `arca_vouchers` table

A new table MUST be created via migration to store every ARCA emission result.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Primary key |
| `businessId` | `UUID` | FK → businesses, NOT NULL | Tenant owner |
| `saleId` | `UUID` | FK → sales, NOT NULL, UNIQUE | The sale that was emitted |
| `result` | `ENUM('authorized', 'rejected', 'indeterminate', 'conflict')` | NOT NULL | Outcome of emission |
| `arcaVoucherId` | `STRING` | NULLABLE | ARCA's voucher number (only present when authorized) |
| `arcaVoucherNumber` | `INTEGER` | NULLABLE | ARCA's voucher sequential number (only when authorized) |
| `emissionCode` | `STRING` | NULLABLE | Código de comprobante (CAE/CACE) when authorized; rejection code when rejected |
| `emissionMessage` | `TEXT` | NULLABLE | Human-readable message from ARCA or SDK |
| `rawResponse` | `JSONB` (or `TEXT` in SQLite) | NOT NULL | Full SDK `IssueOutcome` serialized as JSON for audit |
| `idempotencyKey` | `STRING` | NOT NULL | The sale.id used as idempotency key |
| `emittedAt` | `DATE` | NOT NULL, default `NOW()` | When the emission completed |
| `createdAt` | `DATE` | NOT NULL | Standard timestamp |
| `updatedAt` | `DATE` | NOT NULL | Standard timestamp |

- `saleId` UNIQUE constraint ensures no more than one voucher per sale (conflict outcome returns existing).
- `rawResponse` MUST be the complete SDK output for forensic audit.
- `emissionCode` and `emissionMessage` are extracted from the SDK `IssueOutcome` for query convenience.

### R2. `Sale.arcaStatus` field

The `Sale` model (table `sales`) MUST have a new column:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `arcaStatus` | `ENUM('authorized', 'rejected', 'indeterminate')` | `true` | `null` | Current emission state of this sale |

- `null` means "not yet emitted" or "no ARCA interaction attempted."
- `'authorized'` and `'indeterminate'` are terminal for re-emission (blocks `POST /sales/:id/issue`).
- `'rejected'` is non-terminal — the sale can be re-emitted after fixing configuration.
- The ENUM does NOT include `'conflict'` because conflict is a SDK-level deduplication, not a sale state.

### R3. Mapping SDK `IssueOutcome` to voucher

Each branch of the SDK outcome maps to a voucher record:

| SDK outcome | `result` | `arcaVoucherId` | `arcaVoucherNumber` | `emissionCode` | `emissionMessage` |
|-------------|----------|-----------------|---------------------|----------------|-------------------|
| `authorized` | `'authorized'` | SDK value | SDK value | `CAE` from SDK | `"Comprobante emitido exitosamente"` |
| `rejected` | `'rejected'` | `null` | `null` | Rejection code | SDK error message |
| `indeterminate` | `'indeterminate'` | `null` | `null` | SDK trace ID | `"Resultado indeterminado, requiere reconciliación"` |
| `conflict` | `'conflict'` | From existing voucher | From existing voucher | From existing voucher | `"Comprobante ya emitido (idempotencia)"` |

- For `conflict`, the SDK returns the previous outcome. The service MUST look up the existing voucher by `saleId` and return it, NOT create a duplicate row.
- For `conflict` where no prior voucher exists (edge case), the raw SDK response is stored as a new row.

### R4. Endpoint: `GET /sales/:id/arca-voucher`

Returns the ARCA voucher for a given sale, if one exists.

- Authentication: `requireAuth`, `requireBusiness`, permission `sales:read`
- Route: `GET /sales/:id/arca-voucher`
- The sale `:id` MUST belong to the authenticated business.
- Response `200` with the voucher record:
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
- Response `404` if the sale has no voucher (`arcaStatus` is null and no `arca_vouchers` row).
- The `rawResponse` field is NOT returned by default (too large). A query parameter `?includeRaw=true` can request it.
- The endpoint MAY also return the voucher for a `rejected` or `conflict` result — the client can inspect the reason.

### R5. Migration for `arca_store` table (SDK requirement)

The `facturas` SDK's `PostgresStore` requires a specific table for idempotency tracking. The migration MUST create it:

```sql
CREATE TABLE IF NOT EXISTS arca_store (
  id         TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- This table is managed by the SDK — the application MUST NOT write to it directly.
- The table name `arca_store` is chosen to avoid collision with application tables. The exact table name MUST match what the SDK's `PostgresStore` option expects.
- The migration MUST check for existing table (idempotent via `IF NOT EXISTS`).

### R6. Migrations summary

A single new migration file (e.g. `00007-arca-vouchers`) MUST perform:

1. **Add columns to `businesses`**: `taxId`, `issuerCondition`, `arcaEnvironment`, `arcaCertPem`, `arcaPrivateKeyPem`
2. **Add column to `branches`**: `salesPoint`
3. **Add columns to `customers`**: `cuit`, `dni`, `vatCondition`
4. **Add column to `sales`**: `arcaStatus` (ENUM or nullable string)
5. **Create `arca_vouchers` table**
6. **Create `arca_store` table** (SDK-managed)

- Down migration MUST reverse all of the above.
- For SQLite compatibility, `ENUM` types should use `DataTypes.STRING` as fallback (wrap in try/catch for PostgreSQL ENUM creation).

### R7. Data retention and GDPR

- `arca_vouchers` records are permanent fiscal records — they MUST NOT be deleted on Business deletion.
- On GDPR deletion request, only anonymize personally identifiable information in `emissionMessage` and `rawResponse` (not the structural data).
- If a Business is deleted, `arca_vouchers` rows remain orphaned (fiscal obligation).
- The `arca_store` table can be truncated periodically (idempotency keys are only useful for 24h).
- `rawResponse` can be large — consider archival to cold storage for records older than 1 year (Phase 2 concern, document for awareness).

---

## Scenarios

### S1. Query voucher after authorized emission

```
GIVEN a Sale that was successfully emitted (arcaStatus = 'authorized')
  AND an arca_vouchers record exists for that sale
WHEN GET /sales/:saleId/arca-voucher
THEN response is 200
  AND body.result is "authorized"
  AND body.arcaVoucherId is present
  AND body.arcaVoucherNumber is a positive integer
  AND body.emissionCode is a valid CAE string
  AND body.rawResponse is NOT present
```

### S2. Query voucher for non-emitted sale

```
GIVEN a Sale with arcaStatus = null
  AND no arca_vouchers record exists
WHEN GET /sales/:saleId/arca-voucher
THEN response is 404
  AND body.error is "ARCA_VOUCHER_NOT_FOUND"
```

### S3. Query voucher after rejection

```
GIVEN a Sale with arcaStatus = 'rejected'
WHEN GET /sales/:saleId/arca-voucher
THEN response is 200
  AND body.result is "rejected"
  AND body.emissionCode is the rejection code
  AND body.emissionMessage describes the reason
```

### S4. Raw response included on demand

```
GIVEN a Sale with an authorized voucher
WHEN GET /sales/:saleId/arca-voucher?includeRaw=true
THEN response is 200
  AND body.rawResponse is the full SDK IssueOutcome JSON
  AND rawResponse is omitted when the query param is absent
```

### S5. Sale.arcaStatus prevents re-emission

```
GIVEN a Sale with arcaStatus = 'authorized'
WHEN POST /sales/:id/issue is attempted
THEN the precondition check fails with SALE_ALREADY_EMITTED
  AND the response is 409
```

### S6. Sale.rejected allows re-emission

```
GIVEN a Sale with arcaStatus = 'rejected'
WHEN POST /sales/:id/issue is attempted (with fixed config)
THEN the precondition check passes
  AND the SDK is called again
  AND if the new emission succeeds, a NEW voucher is stored (old one remains as historical record)
  AND Sale.arcaStatus is updated to 'authorized' (overwrites 'rejected')
```

### S7. Voucher saleId unique constraint enforced

```
GIVEN an arca_vouchers row exists for saleId = 'abc-123'
WHEN the service attempts to insert a second row for the same saleId
THEN the database UNIQUE constraint raises an error
  AND the service catches it and returns the existing voucher (soft deduplication)
  AND this follows the conflict outcome path described in R3
```

### S8. arca_store table is managed by SDK

```
GIVEN the database has the arca_store table
WHEN the SDK's PostgresStore is initialized
  AND the SDK inserts/reads idempotency rows
THEN the application MUST NOT read/write to arca_store directly
  AND the migration created the table with the exact expected schema
  AND no application-level model exists for arca_store
```

---

## Validation Rules Summary

| Rule | Error code | When triggered | HTTP status |
|------|-----------|---------------|-------------|
| Sale not emitted | `ARCA_VOUCHER_NOT_FOUND` | GET /sales/:id/arca-voucher with no voucher | 404 |
| Sale already authorized/indeterminate | `SALE_ALREADY_EMITTED` | POST /sales/:id/issue on emitted sale | 409 |
| Unique saleId in arca_vouchers | (DB constraint) | Duplicate insert attempt | 500 → handled as conflict |
| SDK-owned table not modified | N/A | Application writes to arca_store | Prevented by architecture