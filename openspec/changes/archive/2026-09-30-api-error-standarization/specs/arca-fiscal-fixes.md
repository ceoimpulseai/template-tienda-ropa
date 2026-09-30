# ARCA Fiscal Fixes Specification

## Purpose

Fix six bugs in the ARCA fiscal integration module: circular JSON crash on SDK errors, wrong HTTP status on rejected vouchers, inline 404 in branch controller, incomplete IVA_ALIQUOTAS mapping, missing IVA-included calculation for Factura B, and incorrect error type for ITEM_NOT_FOUND.

## Requirements

### Requirement: Circular JSON serialization safety

When the SDK throws an error in `factory.ts` catch block, the system MUST NOT call `JSON.stringify(err)` directly. Instead, it SHALL extract only serializable properties: `{ message: err.message, code: err.code, stack: err.stack }`. The `rawResponse` field SHALL be set to `JSON.stringify({ error: { message: err.message, code: err.code, name: err.name } })`. If `JSON.stringify` throws again, the system MUST fall back to `rawResponse: '{"error": "non-serializable"}'`.

#### Scenario: SDK lanza error de red

- GIVEN factory.ts calls the ARCA SDK
- WHEN the SDK throws an AxiosError with circular references
- THEN factory.ts does NOT crash
- AND the result is a `VoucherResult` with `result='rejected'` and `rawResponse` containing a serializable JSON string

### Requirement: HTTP 422 on ARCA rejection

When `voucher.result === 'rejected'`, the controller MUST respond with HTTP status 422. When `result === 'authorized'`, status SHALL be 200. For `indeterminate` or `conflict` results, status SHALL remain 200 (ARCA did not give a conclusive response).

#### Scenario: ARCA rechaza factura

- GIVEN controller.issue invoice
- WHEN ARCA returns `result='rejected'`
- THEN response HTTP status is 422 (not 200)

#### Scenario: ARCA autoriza factura

- GIVEN controller.issue invoice
- WHEN ARCA returns `result='authorized'`
- THEN response HTTP status is 200

### Requirement: branch.controller inline 404

The inline `return res.status(404).json({ error: 'BRANCH_NOT_FOUND' })` in branch.controller.ts:28 MUST be replaced with `throw new NotFoundError('BRANCH_NOT_FOUND')`.

#### Scenario: Branch no encontrada

- GIVEN a request for a non-existent branch
- WHEN the controller executes
- THEN a `NotFoundError('BRANCH_NOT_FOUND')` is thrown

### Requirement: IVA_ALIQUOTAS complete mapping

The `IVA_ALIQUOTAS` constant MUST contain exactly 14 entries covering all AFIP fiscal conditions. The current 5 entries SHALL be extended with these 9 additions:

| Condition | id | percentage |
|-----------|-----|------------|
| IVA Responsable No Inscripto | 5 | 21 |
| IVA No Responsable | 3 | 0 |
| Sujeto No Categorizado | 5 | 21 |
| Proveedor del Exterior | 5 | 21 |
| Cliente del Exterior | 3 | 0 |
| Liberado - Ley 19.640 | 3 | 0 |
| IVA Responsable Inscripto - Agente de Percepción | 5 | 21 |
| Pequeño Contribuyente Eventual | 5 | 21 |
| Monotributista Social | 5 | 21 |
| Pequeño Contribuyente Eventual Social | 5 | 21 |

#### Scenario: Completeness check

- GIVEN the IVA_ALIQUOTAS constant
- WHEN counting entries
- THEN there are exactly 14 entries

### Requirement: Factura B IVA incluido

For Factura B (CbteTipo 6), IVA is included in the price — `ImpNeto` MUST be calculated as `Math.round((precio / (1 + ivaDecimal)) * 100) / 100` and `ImpIVA` as `Math.round((ImpNeto * ivaDecimal) * 100) / 100`. Factura A (CbteTipo 1) SHALL add IVA to neto (current logic, unchanged). Factura C (CbteTipo 11) SHALL have IVA = 0 (current logic, correct).

#### Scenario: Factura B con precio $121

- GIVEN a Factura B (CbteTipo 6) with price $121
- WHEN calculating ImpNeto and ImpIVA
- THEN ImpNeto = 100, ImpIVA = 21, ImpTotal = 121

#### Scenario: Factura A con precio $121

- GIVEN a Factura A (CbteTipo 1) with neto $100
- WHEN calculating totals
- THEN IVA is added to neto (existing logic unchanged)

### Requirement: ITEM_NOT_FOUND unificado

The `sale.service.ts` MUST throw `NotFoundError('ITEM_NOT_FOUND')` instead of `ConflictError('ITEM_NOT_FOUND')`. The `purchase.service.ts` SHALL NOT be changed (already uses `NotFoundError`).

#### Scenario: ITEM_NOT_FOUND en sale.service

- GIVEN sale.service cannot find an item
- WHEN it throws
- THEN the error is `NotFoundError` with code `'ITEM_NOT_FOUND'`