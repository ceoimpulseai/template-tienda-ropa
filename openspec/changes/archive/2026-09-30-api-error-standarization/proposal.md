# Proposal: API Error Standardization

## Intent

Estandarizar errores del template: corrige 3 bugs críticos (circular JSON crash, HTTP 200 en rechazos ARCA, inline 404) y 3 estructurales (jerarquía mínima, pérdida de códigos en apiFetch, IVA fiscal incompleto).

## Scope

**In**: Fast-fix circular JSON, ARCA 422, branch 404, IVA 14 condiciones, IVA B, NotFound unify, jerarquía AppError + envelope, apiFetch ApiError, useApi/SalesPage error.code.

**Out**: Migrar todos controllers al envelope, límites monotributo, validación CUIT vs condición fiscal.

## Capabilities

**New**: None — refactor interno. **Modified**: None — no specs existentes.

## Approach

### Fase 1 — Bugs (API backward)
- `src/error/factory.ts`: extraer solo props serializables antes de stringify
- `src/controllers/arca.controller.ts`: `rejected → res.status(422)`
- `src/controllers/branch.controller.ts`: `throw new NotFoundError()`
- `src/constants/iva-aliquots.ts`: +9 condiciones, corregir fallback
- `src/services/arca/sale.service.ts`: CbteTipo 6 → neto = precio/1.21; `ConflictError`→`NotFoundError('ITEM_NOT_FOUND')`

### Fase 2 — Sistema errores
1. `AppError` base con `code`, `statusCode`, `details`
2. `NotFoundError`, `ConflictError`, `ValidationError` extienden `AppError`
3. `errorHandler` → envelope `{ success: false, error: { code, message, details } }`
4. `sendError(res, err)` en `src/lib/response.ts`

### Fase 3 — Frontend
1. `ApiError` class con `code`, `message`, `details`
2. `apiFetch` lanza `ApiError` (no `new Error(body.error)`)
3. `useApi` tipa `error: ApiError | null`
4. `SalesPage` usa `error.code` en `ARCA_ERROR_MESSAGES`

## Affected Areas

`src/error/factory.ts`, `src/error/AppError.ts` (new), `src/error/NotFoundError.ts`, `src/error/ConflictError.ts`, `src/error/ValidationError.ts`, `src/error/errorHandler.ts`, `src/lib/response.ts`, `src/constants/iva-aliquots.ts`, `src/controllers/arca.controller.ts`, `src/controllers/branch.controller.ts`, `src/services/arca/sale.service.ts`, `frontend/src/lib/apiFetch.ts`, `frontend/src/hooks/useApi.ts`, `frontend/src/pages/SalesPage.tsx`.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend consume `error.message` string | High | ApiError mantiene `.message` string; legacy intacto |
| Handler cambia formato response | Medium | Solo Fase 2 cambia API visible |
| IVA B mal calculado | Low | Validar con casos reales |

## Rollback Plan

Fase 1: revertir commits individuales. Fase 2: restaurar errorHandler. Fase 3: revertir apiFetch/useApi/SalesPage. Cada fase reversible independientemente.

## Dependencies

Ninguna externa.

## Success Criteria

- [ ] factory.ts no crashea con circular references
- [ ] ARCA devuelve 422 en rejected
- [ ] branch.controller lanza NotFoundError
- [ ] IVA_ALIQUOTAS: 14 entradas, test pasa
- [ ] Factura B: neto = precio / 1.21
- [ ] sale.service: NotFoundError para ITEM_NOT_FOUND
- [ ] AppError jerarquía sin romper imports
- [ ] errorHandler devuelve `{ success: false, error: { code, message } }`
- [ ] apiFetch lanza ApiError con `.code`
- [ ] SalesPage mapea error por `error.code`