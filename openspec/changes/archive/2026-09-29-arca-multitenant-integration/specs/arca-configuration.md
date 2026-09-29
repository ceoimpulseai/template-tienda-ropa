# ARCA Configuration — Spec

## Requirements

### R1. Business ARCA fields

The `Business` model (table `businesses`) MUST have these new columns:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `taxId` | `STRING` (CUIT format, 11 digits) | `false` | — | CUIT del contribuyente, e.g. `30-12345678-9` or raw digits |
| `issuerCondition` | `ENUM('monotributo', 'responsable_inscripto', 'exento', 'consumidor_final')` | `false` | — | IVA condition of the business |
| `arcaEnvironment` | `ENUM('testing', 'production')` | `false` | `'testing'` | Which ARCA environment to emit against |
| `arcaCertPem` | `TEXT` | `true` (NULL = not configured) | `null` | AES-256-GCM encrypted DER/PEM certificate |
| `arcaPrivateKeyPem` | `TEXT` | `true` (NULL = not configured) | `null` | AES-256-GCM encrypted DER/PEM private key |

- Both PEM columns MUST be `TEXT` (not `STRING`) to accommodate arbitrarily long PEM bodies.
- Both PEM columns are stored encrypted at rest using the per-tenant key derivation (see R3).
- `taxId` MUST be unique across businesses (application-level or DB unique constraint).

### R2. Branch sales point

The `Branch` model (table `branches`) MUST have a new column:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `salesPoint` | `INTEGER` | `true` (NULL = not configured) | `null` | ARCA point of sale number assigned by ARCA |

- If a Branch has no `salesPoint`, emission MUST be rejected with a clear error (see invoicing spec).
- A single Branch can only have one `salesPoint` at a time.

### R3. Customer fiscal fields

The `Customer` model (table `customers`) MUST have three new nullable fields:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `cuit` | `STRING` | `true` | CUIT del cliente (11 digits, can be `null` for consumidor final) |
| `dni` | `STRING` | `true` | DNI (documento nacional de identidad) |
| `vatCondition` | `ENUM('monotributo', 'responsable_inscripto', 'exento', 'consumidor_final')` | `true` | IVA condition of the customer |

- `vatCondition` defaults to `'consumidor_final'` when NULL (most common for walk-in customers).
- A Customer MUST have at least one of `cuit` or `dni` before emission is attempted.

### R4. Encryption layer (`lib/arca/crypto.ts`)

Three pure functions, no side effects:

```typescript
// lib/arca/crypto.ts

/**
 * Derives a 256-bit AES key from ARCA_MASTER_KEY + businessId.
 * Uses PBKDF2 with 600_000 iterations (OWASP 2024 recommendation),
 * HMAC-SHA-256, output 32 bytes.
 *
 * ARCA_MASTER_KEY is a 64-hex-char (256-bit) string from env. Parsed as Buffer.
 * salt = `arca-tenant-key-v1:${businessId}` (utf-8).
 */
function deriveTenantKey(businessId: string): Buffer

/**
 * Encrypts a raw PEM string with AES-256-GCM.
 * Returns a JSON string: `{ iv: <hex>, tag: <hex>, ciphertext: <hex> }`.
 * iv = 96-bit random (crypto.randomBytes(12)).
 * authTag = 128-bit.
 */
function encryptPem(tenantKey: Buffer, pem: string): string

/**
 * Decrypts a PEM previously encrypted with encryptPem.
 * Parses the JSON envelope, extracts iv + tag + ciphertext, decrypts.
 * Returns the original PEM string.
 */
function decryptPem(tenantKey: Buffer, encrypted: string): string
```

- The `iv` MUST be generated fresh via `crypto.randomBytes(12)` every call — never reused.
- The output envelope format MUST be stable (JSON with `iv`, `tag`, `ciphertext` hex strings) for future migrations.
- Functions MUST throw typed errors (`EncryptionError` extending `Error`) on tampered ciphertext or wrong key.

### R5. Env var `ARCA_MASTER_KEY`

- MUST be validated in `config/env.ts` via Zod:
  - Must be present (non-optional) in production.
  - Default: a dev-only string in non-production for local testing.
  - Length: exactly 64 hex characters (128 hex nibbles → 256 bits).
  - The schema MUST use a regex: `.regex(/^[0-9a-fA-F]{64}$/)`.
- If validation fails, the process MUST refuse to boot (Zod parse throws).

### R6. Node engine bump

- Root `package.json` and `apps/api/package.json`: `"node": ">=22"`.
- Reason: `facturas` SDK requires Node 22+ (ESM-only, uses built-in features not available in 20).

### R7. Business ARCA configuration endpoint

#### `GET /business/arca`

Returns the ARCA configuration for the current business **without** the PEM fields.

- Authentication: `requireAuth`, `requireBusiness`, permission `business:read`
- Response `200`:
```json
{
  "taxId": "30-12345678-9",
  "issuerCondition": "responsable_inscripto",
  "arcaEnvironment": "testing",
  "arcaConfigured": true
}
```
- `arcaConfigured` is `true` when BOTH `arcaCertPem` AND `arcaPrivateKeyPem` are non-null.
- If no config has been saved yet, returns defaults: `taxId: null`, `issuerCondition: null`, `arcaEnvironment: "testing"`, `arcaConfigured: false`.
- PEMs are NEVER returned by this endpoint.

#### `PUT /business/arca`

Upserts the ARCA configuration for the current business.

- Authentication: `requireAuth`, `requireBusiness`, permission `business:update`
- Request body (Zod-validated):
```typescript
{
  taxId: string,                          // CUIT, 11 digits
  issuerCondition: 'monotributo' | 'responsable_inscripto' | 'exento' | 'consumidor_final',
  arcaEnvironment?: 'testing' | 'production',    // defaults to 'testing'
  arcaCertPem?: string,                            // raw PEM text, will be encrypted
  arcaPrivateKeyPem?: string                        // raw PEM text, will be encrypted
}
```
- If `arcaCertPem` or `arcaPrivateKeyPem` is omitted, the corresponding stored value is NOT overwritten (partial update semantics).
- Both PEMs MUST be provided together or neither (validation: if one is present and the other is missing → Zod error).
- The service layer MUST encrypt both PEMs before persisting.
- Returns `200` with the same shape as `GET /business/arca` (no PEMs in response).

### R8. Validation rules for ARCA configuration

1. **CUIT format**: Must be exactly 11 digits. Accept both raw `"30123456789"` and formatted `"30-12345678-9"` (normalize to raw digits on save).
2. **issuerCondition + vatCondition mapping**: Must match SDK enums exactly. See invoicing spec for mapping table.
3. **Environment values**: Only `"testing"` and `"production"` — enforced by Zod enum.
4. **Partial PEM update**: Cannot update only `arcaCertPem` without `arcaPrivateKeyPem` (and vice versa). If one is provided, both must be provided.
5. **Missing PEMs**: If a Business has NULL PEMs, the emission endpoint MUST reject with a clear error (see invoicing spec R2).
6. **Encrypted at rest**: PEMs are NEVER stored in plaintext. The encryption MUST happen in the service layer before `business.update()`.

---

## Scenarios

### S1. Business configures ARCA for the first time

```
GIVEN a Business with no ARCA configuration
  AND the user has permission 'business:update'
WHEN they send PUT /business/arca with:
  - taxId: "30-12345678-9"
  - issuerCondition: "responsable_inscripto"
  - arcaEnvironment: "testing"
  - arcaCertPem: "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
  - arcaPrivateKeyPem: "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
THEN the response is 200
  AND arcaConfigured is true
  AND the stored PEMs are encrypted (cannot be read as plaintext from DB)
  AND GET /business/arca returns arcaConfigured: true with no PEMs
```

### S2. Partial update — only environment toggle

```
GIVEN a Business with existing ARCA config (testing)
WHEN they send PUT /business/arca with:
  - arcaEnvironment: "production"
  - (no PEM fields)
THEN the response is 200
  AND arcaEnvironment is now "production"
  AND stored PEMs are unchanged (not re-encrypted)
```

### S3. PEMs must come as a pair

```
GIVEN a Business with no ARCA PEMs
WHEN they send PUT /business/arca with:
  - arcaCertPem: "-----BEGIN CERTIFICATE-----\n..."
  - (no arcaPrivateKeyPem)
THEN Zod validation FAILS
  AND the response is 422 with an error describing that both PEMs are required
  AND no data is persisted
```

### S4. Query ARCA config when not configured

```
GIVEN a Business with no ARCA fields set
WHEN GET /business/arca
THEN response is 200
  AND body has arcaConfigured: false
  AND taxId is null
  AND issuerCondition is null
  AND arcaEnvironment is "testing"
```

### S5. Customer fiscal info stored

```
GIVEN a Customer with no fiscal fields
WHEN the user updates the Customer via PUT /customers/:id with:
  - cuit: "30-98765432-1"
  - vatCondition: "responsable_inscripto"
THEN the customer record now has cuit and vatCondition
  AND GET /customers/:id returns these fields
```

### S6. Wrong environment string rejected

```
GIVEN the user sends PUT /business/arca with arcaEnvironment: "staging"
THEN Zod validation FAILS with a 422 error
  AND the error message lists "testing" and "production" as valid options
```

### S7. ARCA_MASTER_KEY not present in production

```
GIVEN NODE_ENV is "production"
  AND ARCA_MASTER_KEY is not set or is the dev default
WHEN the server boots (env.ts is evaluated)
THEN Zod .parse() throws a validation error
  AND the process exits with code 1
  AND the error message explains that ARCA_MASTER_KEY must be set to a 64-char hex string
```

### S8. Branch salesPoint configured

```
GIVEN a Branch with salesPoint: null
WHEN the user updates the Branch via PATCH /branches/:id with:
  - salesPoint: 1
THEN Branch.salesPoint is now 1
  AND GET /branches/:id returns salesPoint: 1
```

---

## Validation Rules Summary

| Rule | Error code | When triggered |
|------|-----------|---------------|
| CUIT must be 11 digits | `INVALID_CUIT` | Update Business ARCA config with bad CUIT |
| Both PEMs or neither | `PEM_MUST_BE_PAIR` | Only one PEM provided in update |
| Environment must be testing/production | Zod enum error | Wrong env value |
| ARCA_MASTER_KEY format | .env validation | Production boot without valid key |
| issuerCondition must match SDK enum | `INVALID_ISSUER_CONDITION` | Unrecognized condition value |
| PEM encryption failure | `ENCRYPTION_ERROR` | Crypto function fails (tampered data, wrong key) |