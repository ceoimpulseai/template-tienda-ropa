# Design: API Error Standardization

## 1. Arquitectura del sistema de errores

### 1.1 Jerarquía de clases (en `apps/api/src/lib/errors.ts`)

```
Error (built-in)
 │
 ├── AppError (base abstracta del sistema)
 │    ├── code: string        — código máquina del error (ej. 'ARCA_NOT_CONFIGURED')
 │    ├── statusCode: number  — HTTP status code
 │    ├── message: string     — human-readable (default = code si no se provee)
 │    ├── details?: any       — payload adicional opcional
 │    │
 │    ├── ValidationError     → statusCode = 400
 │    ├── NotFoundError       → statusCode = 404
 │    └── ConflictError       → statusCode = 409
 │
 ├── ZodError                 → capturado por errorHandler, code = 'VALIDATION_ERROR'
 ├── EncryptionError          → wrappeado a ValidationError('ENCRYPTION_ERROR')
 └── Otros no-AppError        → INTERNAL_ERROR (500) con console.error
```

**Firma del constructor de AppError:**
```typescript
constructor(code: string, options?: { message?: string; details?: any })
// Si no se pasa message explícito, message = code (backward compat)
```

Esto asegura que `new NotFoundError('BUSINESS_NOT_FOUND')` (sin message) funcione exactamente como hoy — `err.message === 'BUSINESS_NOT_FOUND'` — y todos los tests existentes pasen sin cambios.

### 1.2 Envelope de respuesta estándar

**Antes (actual):**
```typescript
// Error
{ error: 'SALE_NOT_FOUND' }

// Success (sin envelope)
{ id: '...', name: '...', ... }
```

**Después (solo errores — success queda igual):**
```typescript
// Error
{ success: false, error: { code: string, message: string, details?: any } }

// Success (sin cambios — sin envelope)
{ id: '...', name: '...', ... }
```

> ⚠️ **Decisión**: NO se introduce `{ success: true, data: T }` en respuestas exitosas. Esto sería un breaking change masivo que requeriría actualizar todos los consumers frontend y tests. Se deja como mejora futura opcional.

### 1.3 Flujo de error completo

```
Service/Middleware → throw AppError (o throw genérico)
       │
       ▼
Controller → try/catch → next(err)
  (opcional: sendError(res, err) si el controller no usa next)
       │
       ▼
errorHandler (middleware global)
  ├── AppError         → { success: false, error: { code, message, details? } }
  ├── ZodError         → { success: false, error: { code: 'VALIDATION_ERROR', message, details } }
  ├── EncryptionError  → { success: false, error: { code: 'ENCRYPTION_ERROR', message } }
  └── Otro             → { success: false, error: { code: 'INTERNAL_ERROR', message } } + console.error
```

### 1.4 Diferencia entre sendError y errorHandler

| Aspecto | `sendError(res, err)` | `errorHandler(err, req, res, next)` |
|---------|----------------------|--------------------------------------|
| Ubicación | `lib/response.ts` | `middleware/errorHandler.ts` |
| Uso | Controllers que NO pasan por next() | Middleware global (Express error handler) |
| Lógica | Idéntica transformación a envelope | Misma lógica + logging adicional |
| Implementación | sendError llama internamente a `formatError(err)` | errorHandler también llama a `formatError(err)` |

Ambos comparten la misma función interna `formatError(err)` para evitar duplicación.

---

## 2. Cambios específicos por archivo

### 2.1 Convención de orden

| Orden | Archivo | Depende de |
|-------|---------|------------|
| 1 | `apps/api/src/lib/errors.ts` | — |
| 2 | `apps/api/src/lib/response.ts` | errors.ts |
| 3 | `apps/api/src/middleware/errorHandler.ts` | errors.ts, response.ts |
| 4 | `apps/api/src/lib/arca/factory.ts` | — |
| 5 | `apps/api/src/modules/arca/arca.controller.ts` | errors.ts |
| 6 | `apps/api/src/modules/branches/branch.controller.ts` | errors.ts |
| 7 | `apps/api/src/modules/_example/sales/sale.service.ts` | errors.ts |
| 8 | `apps/web/src/lib/apiFetch.ts` | — |
| 9 | `apps/web/src/lib/useApi.ts` | apiFetch.ts |
| 10 | `apps/web/src/modules/_example/sales/SalesPage.tsx` | useApi.ts |

---

### Paso 1 — `apps/api/src/lib/errors.ts` (AppError base)

**Cambio**: Reemplazar las 3 clases planas con jerarquía AppError.

```typescript
// === NUEVA implementación ===

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(code: string, options?: { message?: string; details?: any }) {
    super(options?.message ?? code);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = 500;
    this.details = options?.details;
  }
}

export class ValidationError extends AppError {
  constructor(code: string, options?: { message?: string; details?: any }) {
    super(code, { message: options?.message, details: options?.details });
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

export class NotFoundError extends AppError {
  constructor(code: string, options?: { message?: string; details?: any }) {
    super(code, { message: options?.message, details: options?.details });
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class ConflictError extends AppError {
  constructor(code: string, options?: { message?: string; details?: any }) {
    super(code, { message: options?.message, details: options?.details });
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}

// Helper type guard (reusable en errorHandler y response.ts)
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
```

**Impacto**: 
- ✅ `new ValidationError('CODE')` sigue funcionando idéntico (message = code)
- ✅ `err instanceof ValidationError` sigue funcionando
- ✅ `err.message` devuelve el code cuando no se pasó options.message

---

### Paso 2 — `apps/api/src/lib/response.ts` (NUEVO archivo)

**Cambio**: Crear helpers `sendError` + función compartida `formatError`.

```typescript
import type { Response } from 'express';
import { ZodError } from 'zod';
import { AppError, isAppError } from './errors.js';

// ---- Shared error formatter ----

interface FormattedError {
  code: string;
  message: string;
  details?: any;
}

function isZodError(err: unknown): err is ZodError {
  return err instanceof ZodError || (err && typeof err === 'object' && 'issues' in err && Array.isArray((err as any).issues));
}

function formatZodError(err: ZodError): { fields: Record<string, string> } {
  const flat = err.flatten();
  const fields: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages && messages.length > 0) {
      fields[key] = messages.join(', ');
    }
  }
  return { fields };
}

export function formatError(err: unknown): { statusCode: number; error: FormattedError } {
  if (isAppError(err)) {
    const body: FormattedError = { code: err.code, message: err.message };
    if (err.details !== undefined) body.details = err.details;
    return { statusCode: err.statusCode, error: body };
  }
  if (isZodError(err)) {
    return {
      statusCode: 400,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formatZodError(err),
      },
    };
  }
  // No controlado — log y devolver INTERNAL_ERROR
  console.error('[UnhandledError]', err);
  return {
    statusCode: 500,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  };
}

// ---- Response helpers ----

export function sendError(res: Response, err: unknown) {
  const { statusCode, error } = formatError(err);
  return res.status(statusCode).json({ success: false, error });
}
```

**Impacto**: 
- ⚠️ Nuevo archivo — no rompe nada existente

---

### Paso 3 — `apps/api/src/middleware/errorHandler.ts` (envelope estandarizado)

**Cambio**: Delegar en `formatError` desde response.ts para envelope unificado.

```diff
 import type { NextFunction, Request, Response } from 'express';
-import { ZodError } from 'zod';
-import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js';
-
-function isZodError(err: unknown): err is ZodError {
-  return err instanceof ZodError || (err && typeof err === 'object' && 'issues' in err && Array.isArray((err as any).issues));
-}
+import { formatError } from '../lib/response.js';
 
 export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
-  if (isZodError(err)) {
-    return res.status(400).json({ error: 'VALIDATION_ERROR', details: err.flatten() });
-  }
-  if (err instanceof ValidationError) {
-    return res.status(400).json({ error: err.message });
-  }
-  if (err instanceof ConflictError) {
-    return res.status(409).json({ error: err.message });
-  }
-  if (err instanceof NotFoundError) {
-    return res.status(404).json({ error: err.message });
-  }
-  console.error(err);
-  return res.status(500).json({ error: 'INTERNAL_ERROR' });
+  const { statusCode, error } = formatError(err);
+  res.status(statusCode).json({ success: false, error });
 }
```

**Impacto**: 
- ⚠️ **ROMPE API existente**: cambio de `{ error: 'CODE' }` a `{ success: false, error: { code: 'CODE', message: 'CODE' } }`
- Los consumers que esperan `res.body.error` como string se rompen (frontend `apiFetch.ts` es el único consumer, y se actualiza en Fase 3)
- Tests de integración que verifican formato legacy necesitan actualización

---

### Paso 4 — `apps/api/src/lib/arca/factory.ts` (circular JSON + IVA)

#### 4a. Fix circular JSON (línea 272)

**Problema**: `JSON.stringify({ error: err })` crashea si `err` contiene referencias circulares (ej. AxiosError).

**Cambio**: Extraer solo props serializables antes de stringify.

```diff
       } catch (err: any) {
         return {
           result: 'rejected',
           arcaVoucherId: null,
           arcaVoucherNumber: null,
           emissionCode: err.code || 'SDK_ERROR',
           emissionMessage: err.message || 'Unknown SDK error',
-          rawResponse: JSON.stringify({ error: err }),
+          rawResponse: JSON.stringify({
+            error: {
+              name: err?.name,
+              message: err?.message,
+              code: err?.code,
+              cause: err?.cause instanceof Error ? err.cause.message : undefined,
+            },
+          }),
         };
       }
```

**Impacto**: ✅ Bug fix — no rompe API

#### 4b. Completar IVA_ALIQUOTAS (14 condiciones)

**Problema**: Actualmente solo 5 entradas. Debe cubrir las 14 condiciones fiscales posibles del receptor.

**Cambio**: Reemplazar el objeto con todas las condiciones de VOUCHER_TYPE + Exento. Las condiciones exentas mapean a `id: 3, percentage: 0`; las gravadas a `id: 5, percentage: 21`.

```typescript
const IVA_ALIQUOTAS: Record<string, { id: number; percentage: number }> = {
  'IVA Responsable Inscripto': { id: 5, percentage: 21 },
  'IVA Responsable No Inscripto': { id: 5, percentage: 21 },
  'IVA Sujeto Exento': { id: 3, percentage: 0 },
  'Consumidor Final': { id: 5, percentage: 21 },
  'Responsable Monotributo': { id: 5, percentage: 21 },
  'Sujeto No Categorizado': { id: 5, percentage: 21 },
  'Proveedor del Exterior': { id: 5, percentage: 21 },
  'Cliente del Exterior': { id: 5, percentage: 21 },
  'Liberado - Ley 19.640': { id: 3, percentage: 0 },
  'IVA Responsable Inscripto - Agente de Percepción': { id: 5, percentage: 21 },
  'Pequeño Contribuyente Eventual': { id: 5, percentage: 21 },
  'Monotributista Social': { id: 5, percentage: 21 },
  'Pequeño Contribuyente Eventual Social': { id: 5, percentage: 21 },
  'Exento': { id: 3, percentage: 0 },
};
```

**Impacto**: ✅ Fix — no rompe API. El fallback `?? { id: 5, percentage: 21 }` ya no se ejecuta para condiciones conocidas.

#### 4c. Factura B: IVA incluido (líneas 218-235)

**Problema**: Factura B (CbteTipo 6, emisor responsable no inscripto) tiene precio IVA incluido. El neto debe calcularse como `precio_total / 1.21`.

**Cambio**: Detectar cbteTipo 6 y aplicar gross-up.

```diff
       // Factura C (tipo 11 - Monotributo) => IVA = 0
       const esFacturaC = cbteTipo === 11;
+      // Factura B (tipo 6 - Responsable No Inscripto) => precio IVA incluido
+      const esFacturaB = cbteTipo === 6 && !esFacturaC;
       let impIVA = 0;
       let ivaAliquota = { id: 3, percentage: 0 }; // Exento
       let ivaArray: Array<{ Id: number; BaseImp: number; Importe: number }> = [];

-      if (!esFacturaC) {
+      if (esFacturaB) {
+        // Factura B: precio incluye IVA => extraer neto
+        const ivaFactor = 0.21;
+        const ivaId = 5;
+        const impNetoConIva = impNeto; // precio original incluye IVA
+        impNeto = Math.round((impNetoConIva / (1 + ivaFactor)) * 100) / 100;
+        impIVA = Math.round((impNetoConIva - impNeto) * 100) / 100;
+        ivaAliquota = { id: ivaId, percentage: 21 };
+        ivaArray = [
+          {
+            Id: ivaAliquota.id,
+            BaseImp: impNeto,
+            Importe: impIVA,
+          },
+        ];
+      } else if (!esFacturaC) {
         // Factura A: IVA según condición del receptor
         ivaAliquota = getIvaAliquota(inv.customer.vatCondition);
         impIVA = Math.round(impNeto * ivaAliquota.percentage * 100) / 10000;
```

> ⚠️ **Atención**: `impNeto` debe ser un `let` para permitir reasignación (actualmente es `const`).

**Impacto**: ✅ Fix — cambia cálculo de neto/IVA para facturas B. Tests de cálculo necesitan actualización.

---

### Paso 5 — `apps/api/src/modules/arca/arca.controller.ts` (HTTP 422 en rejected)

**Problema**: Línea 43 `res.json(voucher)` siempre devuelve 200, incluso cuando ARCA rechaza.

**Cambio**: Evaluar `voucher.result` para determinar status code.

```diff
       const voucher = await issueInvoice(
         req.auth!.businessId!,
         req.auth!.branchId!,
         id,
       );
-      res.json(voucher);
+      if (voucher.result === 'rejected') {
+        res.status(422).json(voucher);
+      } else {
+        res.json(voucher);
+      }
```

**Impacto**: ⚠️ Los tests que esperan 200 en reject necesitan actualización a 422.

---

### Paso 6 — `apps/api/src/modules/branches/branch.controller.ts` (throw NotFoundError)

**Problema**: Línea 28 usa `res.status(404).json({ error: 'BRANCH_NOT_FOUND' })` inline en vez de throw.

**Cambio**: Reemplazar con throw NotFoundError (aprovecha errorHandler).

```diff
+import { NotFoundError } from '../../lib/errors.js';
 import type { Request, Response, NextFunction } from 'express';
 import { branchService } from './branch.service.js';
 import { createBranchSchema, updateBranchSchema } from '@template/shared';

   async update(req: Request, res: Response, next: NextFunction) {
     try {
       const input = updateBranchSchema.parse(req.body);
       const branch = await branchService.update(req.auth!.businessId!, req.params.id!, input);
-      if (!branch) return res.status(404).json({ error: 'BRANCH_NOT_FOUND' });
+      if (!branch) throw new NotFoundError('BRANCH_NOT_FOUND');
       res.json(branch);
     } catch (err) {
       next(err);
```

**Impacto**: ✅ El error se formatea con el envelope estándar después de Fase 2. Tests existentes se rompen (pasan de esperar `{ error: 'BRANCH_NOT_FOUND' }` a `{ success: false, error: { code: 'BRANCH_NOT_FOUND', message: 'BRANCH_NOT_FOUND' } }`).

---

### Paso 7 — `apps/api/src/modules/_example/sales/sale.service.ts` (NotFoundError)

**Problema**: Línea 16 usa `ConflictError('ITEM_NOT_FOUND')` cuando corresponde NotFoundError.

**Cambio**:

```diff
 import { sequelize } from '../../../config/database.js';
-import { ConflictError } from '../../../lib/errors.js';
+import { ConflictError, NotFoundError } from '../../../lib/errors.js';
 import { itemRepository } from '../../items/item.repository.js';

   async create(businessId: string, branchId: string, input: CreateSaleInput) {
     return sequelize.transaction(async (transaction) => {
       const item = await itemRepository.findOne(businessId, input.itemId, { transaction });
-      if (!item) throw new ConflictError('ITEM_NOT_FOUND');
+      if (!item) throw new NotFoundError('ITEM_NOT_FOUND');
       if (item.stock < input.quantity) throw new ConflictError('INSUFFICIENT_STOCK');
```

**Impacto**: 
- ⚠️ El error HTTP cambia de 409 a 404 para ITEM_NOT_FOUND
- Tests que esperan ConflictError se rompen (pasan a esperar NotFoundError)
- ✅ Es semánticamente correcto (item no encontrado es 404, no conflicto)

---

### Paso 8 — `apps/web/src/lib/apiFetch.ts` (ApiError class)

**Problema**: `throw new Error(body.error)` pierde el código de error estructurado.

**Cambio**: Crear clase ApiError + parsear envelope estándar.

```typescript
export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const branchId = activeBranchStore.getSnapshot();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (branchId) headers.set('X-Branch-Id', branchId);

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Parsear envelope de error estándar
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    // Envelope nuevo: { success: false, error: { code, message, details? } }
    if (body?.success === false && body?.error) {
      throw new ApiError(body.error.code, body.error.message, body.error.details);
    }
    // Legacy fallback: { error: 'CODE' } (antes de Fase 2)
    if (body?.error && typeof body.error === 'string') {
      throw new ApiError(body.error, body.error);
    }
    throw new ApiError('UNKNOWN_ERROR', `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
```

**Impacto**: 
- ✅ `err.message` legacy funciona (ApiError extiende Error)
- ✅ `err.code` ahora disponible para lookup programático
- ⚠️ Cualquier código que captura `err instanceof Error` sigue funcionando

---

### Paso 9 — `apps/web/src/lib/useApi.ts` (tipar error como ApiError)

**Cambio**: Reemplazar `error: string | null` por `error: ApiError | null`.

```diff
+import type { ApiError } from './apiFetch';
 import { apiFetch } from './apiFetch';

 interface UseApiResult<T> {
   data: T | null;
   loading: boolean;
-  error: string | null;
+  error: ApiError | null;
   refetch: () => void;
 }

   useEffect(() => {
     // ...
     fetchFn(path)
       .then((result) => {
         if (!cancelled) setData(result);
       })
       .catch((err: Error) => {
-        if (!cancelled) setError(err.message);
+        if (!cancelled) setError(err instanceof ApiError ? err : new ApiError('UNKNOWN_ERROR', err.message));
       })
       .finally(() => {
         if (!cancelled) setLoading(false);
       });
```

**Impacto**: 
- ✅ `error` sigue siendo nullable — `error?.code` tipa correctamente
- ⚠️ Cualquier componente que lee `error` como string se rompe (SalesPage se actualiza en paso 10)

---

### Paso 10 — `apps/web/src/modules/_example/sales/SalesPage.tsx` (error.code lookup)

**Problema**: Usa `err instanceof Error ? err.message : ...` y `ARCA_ERROR_MESSAGES[message]` — lookup por string frágil.

**Cambio**: Usar `error.code` para lookup.

```diff
+import { apiFetch, ApiError } from '../../../lib/apiFetch';

   async function handleIssue(saleId: string) {
     setIssuingId(saleId);
     try {
       const voucher = await apiFetch(`/sales/${saleId}/issue`, { method: 'POST' });
       // ... success handling ...
     } catch (err: unknown) {
-      const message = err instanceof Error ? err.message : 'Error al facturar';
-      const friendlyMessage = ARCA_ERROR_MESSAGES[message] ?? message;
-      setIssueModal({ open: true, error: friendlyMessage });
+      if (err instanceof ApiError) {
+        const friendlyMessage = ARCA_ERROR_MESSAGES[err.code] ?? err.message;
+        setIssueModal({ open: true, error: friendlyMessage });
+      } else {
+        const message = err instanceof Error ? err.message : 'Error al facturar';
+        setIssueModal({ open: true, error: message });
+      }
     } finally {
       setIssuingId(null);
     }
   }
```

Este patrón se repite en 3 lugares del archivo (líneas 112-115, 150-153, y las mismas dentro de handleSubmit). Refactorizar a función helper:

```typescript
function handleApiError(err: unknown): string {
  if (err instanceof ApiError) {
    return ARCA_ERROR_MESSAGES[err.code] ?? err.message;
  }
  return err instanceof Error ? err.message : 'Error inesperado';
}
```

**Impacto**: ✅ Cambio interno — no rompe API. La UI se beneficia de mensajes más precisos vía `error.code`.

---

## 3. Códigos de error estandarizados (catálogo completo)

| Código | HTTP | Dónde se origina |
|--------|------|-------------------|
| `ARCA_NOT_CONFIGURED` | 400 | `invoicing.service.ts` — `checkPreconditions()` |
| `BUSINESS_MISSING_TAX_ID` | 400 | `invoicing.service.ts` — `checkPreconditions()` |
| `BUSINESS_MISSING_ISSUER_CONDITION` | 400 | `invoicing.service.ts` — `checkPreconditions()` |
| `BRANCH_MISSING_SALES_POINT` | 400 | `invoicing.service.ts` — `checkPreconditions()` |
| `SALE_MISSING_CUSTOMER` | 400 | `invoicing.service.ts` — `checkPreconditions()` |
| `CUSTOMER_MISSING_FISCAL_ID` | 400 | `invoicing.service.ts` — `checkPreconditions()` |
| `SALE_ALREADY_EMITTED` | 409 | `invoicing.service.ts` — `checkPreconditions()` |
| `ENCRYPTION_ERROR` | 400 | `invoicing.service.ts` — catch EncryptionError |
| `ARCA_TIMEOUT` | 400 | `invoicing.service.ts` — catch AbortError |
| `BUSINESS_NOT_FOUND` | 404 | `invoicing.service.ts`, `business.service.ts` |
| `BRANCH_NOT_FOUND` | 404 | `invoicing.service.ts`, `branch.controller.ts` (update) |
| `SALE_NOT_FOUND` | 404 | `invoicing.service.ts` |
| `ITEM_NOT_FOUND` | **404** (antes 409) | `sale.service.ts` (fix), `purchase.service.ts` |
| `CUSTOMER_NOT_FOUND` | 404 | repositorio base |
| `ARCA_VOUCHER_NOT_FOUND` | 404 | `arca.controller.ts` |
| `CANNOT_DELETE_DEFAULT_BRANCH` | 409 | `branch.service.ts` |
| `INSUFFICIENT_STOCK` | 409 | `sale.service.ts` |
| `VALIDATION_ERROR` | 400 | `errorHandler.ts` (ZodError) |
| `INTERNAL_ERROR` | 500 | `errorHandler.ts` (no controlado) |

> ⚠️ **ITEM_NOT_FOUND cambia HTTP de 409 a 404.** Si hay clientes que dependen del HTTP 409, se rompen. El frontend propio se actualiza en Fase 3.

---

## 4. ZodError details amigables

**Entrada (Zod raw `err.flatten()`):**
```typescript
{ fieldErrors: { email: ['Invalid email', 'Required'], age: ['Must be 18+'] } }
```

**Salida transformada `formatZodError()`:**
```typescript
{ fields: { email: 'Invalid email, Required', age: 'Must be 18+' } }
```

**Implementación** (ya incluida en `response.ts` — paso 2):
```typescript
function formatZodError(err: ZodError): { fields: Record<string, string> } {
  const flat = err.flatten();
  const fields: Record<string, string> = {};
  for (const [key, messages] of Object.entries(flat.fieldErrors)) {
    if (messages && messages.length > 0) {
      fields[key] = messages.join(', ');
    }
  }
  return { fields };
}
```

---

## 5. API pública que NO cambia (backward compatibility)

### En backend:

- ✅ `new ValidationError('CODE')` — constructor legacy sigue funcionando (message = code)
- ✅ `throw err` desde services — cualquier throw sigue propagándose a errorHandler
- ✅ `next(err)` en controllers — errorHandler recibe y formatea todos los tipos
- ✅ `err instanceof ValidationError` — type guard sigue funcionando (AppError extiende Error)
- ✅ Controllers que devuelven `res.json(data)` — respuestas exitosas sin cambios
- ✅ Middleware `requireAuth`, `requireBusiness` etc. — siguen haciendo `next(new AppError(...))`
- ✅ `EncryptionError` en `crypto.ts` — no toca, sigue siendo wrappeado a `ValidationError('ENCRYPTION_ERROR')`

### En frontend:

- ✅ `err instanceof Error` — ApiError extiende Error
- ✅ `err.message` — sigue siendo un string legible
- ✅ `error` en `useApi` era `string | null`, ahora `ApiError | null` — `error` sigue nullable, cualquier código que hace `if (error)` sigue funcionando
- ⚠️ Código que lee `error` como string (`error.includes(...)`, `error.length`) se rompe — solo ocurre en SalesPage que se actualiza

---

## 6. Tests afectados

### Tests que necesitan actualización OBLIGATORIA:

| Test | Razón | Cambio esperado |
|------|-------|----------------|
| `arca.service.test.ts` | Líneas 328, 352, 408, 424, 444 esperan `{ error: '...' }` (string) → nuevo envelope `{ success: false, error: { code, message } }` | Actualizar `toMatchObject` a nuevo formato. Test línea 373 (éxito 200) no cambia. Test línea 407 (ARCA reject) — esperar 422 en vez de 200. |
| `branch.controller.test.ts` (si existe — no se encontró test de ruta branches) | El inline 404 cambia de `res.status(404).json(...)` a throw. Si hay test de ruta que espera formato legacy, debe actualizarse. | Actualizar test si existe |
| `sale.service.test.ts` | Línea 43 espera `toThrow('INSUFFICIENT_STOCK')` — sigue funcionando (ConflictError). Pero si algún test espera ITEM_NOT_FOUND como ConflictError, se rompe (ahora es NotFoundError). | Verificar que no haya tests que esperen ConflictError('ITEM_NOT_FOUND') |
| `invoicing.service.test.ts` | `rejects.toThrow(ValidationError)` y `toMatchObject({ message: 'ARCA_NOT_CONFIGURED' })` — **siguen funcionando** porque AppError.message = code cuando no hay options.message. Los tests de precondition NO cambian su assert. | ✅ No requiere cambios (validado contra implementación) |
| `factory.test.ts` | El test de SDK exception (línea 121-151) — verifica `rawResponse`. Con el fix de circular JSON, el formato de `rawResponse` cambia de `{ error: err }` a `{ error: { name, message, code, cause } }`. | Actualizar assertion de `rawResponse` |
| `business.routes.test.ts` | Líneas 40-41 esperan `res.body.id` — respuesta exitosa sin envelope. ✅ No cambia. | ✅ No requiere cambios |

### Tests que NO requieren cambios:

| Test | Razón |
|------|-------|
| `invoicing.service.test.ts` | Todos los `rejects.toThrow(ValidationError/ConflictError/NotFoundError)` siguen pasando porque `err instanceof ValidationError` funciona. |
| `crypto.test.ts` | No toca errores de aplicación |
| `item.service.test.ts`, `customer.service.test.ts` | No usan el sistema de errores estándar |
| `business.routes.test.ts` | Respuestas exitosas sin cambios |
| `team.routes.test.ts` | Respuestas exitosas sin cambios |
| `email.test.ts` | No toca errores de aplicación |

---

## 7. Diagrama de flujo completo

```
POST /api/sales/:id/issue
  │
  ├─ [Middleware] requireAuth
  │   └─ si no autenticado → throw AppError(...) o res.sendStatus(401)
  │
  ├─ [Middleware] requireBusiness(req)
  │   └─ si no hay negocio → next(AppError)
  │
  ├─ [Middleware] requireBranch(req)
  │   └─ si no hay sucursal → next(AppError)
  │
  ├─ [Middleware] requirePermission('sales:update')
  │   └─ si no tiene permiso → next(AppError)
  │
  ├─ arcaController.issue()                              ← controller
  │   │
  │   ├─ issueInvoice(businessId, branchId, saleId)      ← invoicing.service
  │   │   │
  │   │   ├─ 1. Fetch Business
  │   │   │   └─ no existe → throw NotFoundError('BUSINESS_NOT_FOUND')
  │   │   │
  │   │   ├─ 2. Fetch Branch
  │   │   │   └─ no existe → throw NotFoundError('BRANCH_NOT_FOUND')
  │   │   │
  │   │   ├─ 3. Fetch Sale + Customer + Item (JOIN)
  │   │   │   └─ no existe → throw NotFoundError('SALE_NOT_FOUND')
  │   │   │
  │   │   ├─ 4. checkPreconditions()
  │   │   │   ├─ sin PEMs           → throw ValidationError('ARCA_NOT_CONFIGURED')
  │   │   │   ├─ sin taxId          → throw ValidationError('BUSINESS_MISSING_TAX_ID')
  │   │   │   ├─ sin issuerCondition→ throw ValidationError('BUSINESS_MISSING_ISSUER_CONDITION')
  │   │   │   ├─ sin salesPoint     → throw ValidationError('BRANCH_MISSING_SALES_POINT')
  │   │   │   ├─ sin customerId     → throw ValidationError('SALE_MISSING_CUSTOMER')
  │   │   │   ├─ sin CUIT/DNI       → throw ValidationError('CUSTOMER_MISSING_FISCAL_ID')
  │   │   │   └─ ya emitida         → throw ConflictError('SALE_ALREADY_EMITTED')
  │   │   │
  │   │   ├─ 5. Decrypt PEMs
  │   │   │   └─ EncryptionError    → throw ValidationError('ENCRYPTION_ERROR')
  │   │   │
  │   │   ├─ 6. createClient()
  │   │   │
  │   │   ├─ 7. SDK call
  │   │   │   ├─ AbortError (timeout) → throw ValidationError('ARCA_TIMEOUT')
  │   │   │   └─ SDK success → VoucherResult
  │   │   │
  │   │   └─ 8. Transacción: INSERT/UPDATE arca_vouchers + UPDATE sale.arcaStatus
  │   │
  │   └─ voucher.result
  │       ├─ 'rejected'       → res.status(422).json(voucher)
  │       ├─ 'authorized'     → res.status(200).json(voucher)
  │       ├─ 'indeterminate'  → res.status(200).json(voucher)
  │       └─ 'conflict'       → res.status(200).json(voucher) [con voucher existente]
  │
  └─ catch(err) → next(err) → errorHandler
      │
      ├─ AppError → formatError()
      │   └─ { success: false, error: { code, message, details? } }
      │
      ├─ ZodError → formatError()
      │   └─ { success: false, error: { code: 'VALIDATION_ERROR', message, details: { fields } } }
      │
      └─ Otro error → formatError() + console.error
          └─ { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }
```

---

## 8. Estrategia de migración (evitar double-work)

### Secuencia recomendada de implementación:

```
 1. errors.ts          → AppError hierarchy (no cambia API)
 2. response.ts        → nuevo archivo (no cambia API, no se usa hasta paso 3)
 3. errorHandler.ts    → delegar a formatError (CAMBIOS VISIBLES — envelope nuevo)
                         └── Este es el punto de no retorno en API
 4. factory.ts         → circular JSON + IVA alíquotas + Factura B
 5. arca.controller.ts → status 422 on rejected
 6. branch.controller.ts → throw NotFoundError
 7. sale.service.ts    → ConflictError → NotFoundError
 8. apiFetch.ts        → ApiError class
 9. useApi.ts          → tipar error como ApiError
10. SalesPage.tsx      → usar error.code
```

**Razón del orden**: Pasos 1-3 son infraestructura. Paso 3 cambia el API. Pasos 4-7 usan la nueva infraestructura para fixes. Pasos 8-10 alinean el frontend con el nuevo formato de error.

### Rollback:

- Antes del paso 3: revertir hasta paso 1 no tiene efecto visible en API
- Después del paso 3: revertir pasos 4-7 individualmente, luego revertir paso 3 para restaurar formato legacy
- Pasos 8-10 reversibles independientemente del backend

---

## 9. Edge cases y gotchas

### 9.1 `rawResponse` cambia de forma

El fix de circular JSON cambia `rawResponse` de `JSON.stringify({ error: err })` a una estructura plana con props serializables. Si algún cliente parsea `rawResponse` como un objeto con la forma `{ error: <Error> }`, se rompe. El frontend propio no usa `rawResponse`.

### 9.2 `ITEM_NOT_FOUND` cambia HTTP status de 409 a 404

Es semánticamente correcto, pero si el frontend o algún cliente externo depende del HTTP 409 para detectar item faltante, debe actualizarse. El frontend propio usa `error.code` (no HTTP status) y se actualiza en paso 10.

### 9.3 ZodError details: flatten() vs formatZodError()

La transformación `err.flatten()` produce `{ fieldErrors: { campo: ['msg1', 'msg2'] } }`. `formatZodError` produce `{ fields: { campo: 'msg1, msg2' } }`. Cualquier cliente que lea `error.details.fieldErrors` se rompe. El frontend propio no usa ZodError details actualmente.

### 9.4 Instancias de Error legacy después del cambio

Si algún service importa `ValidationError` de otro módulo (no de `errors.ts`), el `instanceof` falla y el error cae a `INTERNAL_ERROR`. Es improbable porque todas las clases se exportan desde `errors.ts`.

### 9.5 sendError para controllers sin catch

Solo se usa donde un controller necesita responder sin pasar por `next(err)`. El `arca.controller.ts` actualmente usa `next(err)`, no necesita `sendError`. `branch.controller.ts` después del fix también usa `throw` + `next(err)`. `sendError` es para casos donde el controller no tiene try/catch.

---

## 10. Comprobación de cobertura contra proposal

| Criterio de éxito de proposal | Cómo se cubre en design |
|------------------------------|------------------------|
| ✅ factory.ts no crashea con circular references | Paso 4a — extracción de props serializables |
| ✅ ARCA devuelve 422 en rejected | Paso 5 — status conditional en controller |
| ✅ branch.controller lanza NotFoundError | Paso 6 — throw en vez de inline |
| ✅ IVA_ALIQUOTAS: 14 entradas | Paso 4b — mapeo completo |
| ✅ Factura B: neto = precio / 1.21 | Paso 4c — gross-up en Factura B |
| ✅ sale.service: NotFoundError para ITEM_NOT_FOUND | Paso 7 — ConflictError→NotFoundError |
| ✅ AppError jerarquía sin romper imports | Paso 1 — misma API de exportación, extends AppError |
| ✅ errorHandler devuelve `{ success: false, error: { code, message } }` | Paso 3 — delegar a formatError |
| ✅ apiFetch lanza ApiError con `.code` | Paso 8 — ApiError class + envelope parse |
| ✅ SalesPage mapea error por `error.code` | Paso 10 — error.code lookup en ARCA_ERROR_MESSAGES |