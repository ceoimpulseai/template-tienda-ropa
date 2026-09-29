# Proposal: ARCA Multi-Tenant Electronic Invoicing

## Intent

Enable each tenant (Business) to emit ARCA-compliant electronic invoices through the `facturas` SDK. Without this, the template has no fiscal integration — sales are internal records only. Each Business has its own CUIT, certificate, and ARCA credentials; encryption and deduplication must be per-tenant.

## Scope

### In Scope
- Per-tenant encrypted storage of ARCA PEMs (cert + private key)
- ARCA credential configuration endpoint
- Invoice emission from existing sales (`POST /sales/:id/issue`)
- Fiscal voucher storage (`arca_vouchers` table)
- SDK deduplication via PostgresStore singleton
- Branch-level salesPoint configuration

### Out of Scope
- Credit/debit notes (Phase 2)
- Webhook callbacks from ARCA
- ARCA certificate renewal flow
- Batch emission (multiple sales at once)
- Frontend UI for emission (API-only for Phase 1)

## Capabilities

### New Capabilities
- `arca-configuration`: Business ARCA setup — CUIT, issuerCondition, encrypted PEMs, environment toggle, branch salesPoint
- `arca-invoicing`: Emit an ARCA invoice from a sale, handle 4 result types (authorized/rejected/indeterminate/conflict), update Sale.arcaStatus
- `arca-vouchers`: Store full fiscal emission response; query by sale ID or voucher ID

### Modified Capabilities
- None (new domain, no existing specs change behavior)

## Approach

1. **Encryption layer** in `lib/arca/crypto.ts` — derive tenant key via pbkdf2 from `ARCA_MASTER_KEY + businessId`, AES-256-GCM encrypt/decrypt PEMs
2. **Factory** in `lib/arca/factory.ts` — create ephemeral ARCA clients per-request from cached+decrypted config
3. **Invoicing service** in `lib/arca/invoicing.service.ts` — orchestrates: decrypt config → build SDK input from Sale+Customer+Item → call `arca.issue()` → persist result → update Sale
4. **Module** at `modules/arca/` — routes + controller for `PUT /business/arca` and `POST /sales/:id/issue`
5. **Migrations** for: Business/Branch columns, `arca_vouchers`, `arca_store` tables

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/lib/arca/` | New | crypto, factory, invoicing service |
| `apps/api/src/modules/arca/` | New | routes, controller |
| `apps/api/src/modules/business/` | Modified | Business model: +taxId, +issuerCondition, +arcaCertPem, +arcaPrivateKeyPem, +arcaEnvironment |
| `apps/api/src/modules/branches/` | Modified | Branch model: +salesPoint |
| `apps/api/src/modules/customers/` | Modified | Customer model: +cuit, +dni, +vatCondition |
| `apps/api/src/modules/_example/sales/` | Modified | Sale model: +arcaStatus |
| `apps/api/src/db/migrations/` | New | Migration for new columns + new tables |
| `apps/api/src/config/env.ts` | Modified | Add ARCA_MASTER_KEY validation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| ARCA master key leak → all tenants compromised | Low | Key in env var only; encrypt PMK at rest; never log PEMs |
| SDK idempotency failure (duplicate emission) | Low | PostgresStore + idempotencyKey from sale ID |
| ARCA rejects valid invoice (config mismatch) | Medium | Map issuerCondition and vatCondition to SDK enums; validate before emit |
| Encrypted PEM is lost (key rotation) | Low | Master key is stable; rotate via re-encrypt migration |

## Rollback Plan

1. Revert migration (remove new columns, drop `arca_vouchers` and `arca_store` tables)
2. Delete `lib/arca/` and `modules/arca/`
3. Remove `ARCA_MASTER_KEY` from env
4. No data loss — existing sales untouched

## Dependencies

- `facturas` SDK (npm, ESM, Node ≥22)
- `node:crypto` (built-in, for pbkdf2 + aes-256-gcm)
- `ARCA_MASTER_KEY` env var (64 hex chars, configured before deployment)

## Success Criteria

- [ ] Business can configure ARCA credentials via API (PEMs stored encrypted)
- [ ] Issuing an invoice against a sale returns `authorized` in test environment
- [ ] `arca_vouchers` table stores the full emission response
- [ ] Duplicate emission for same sale returns existing voucher (idempotent)
- [ ] Wrong CUIT or expired cert returns `rejected` gracefully (no crash)