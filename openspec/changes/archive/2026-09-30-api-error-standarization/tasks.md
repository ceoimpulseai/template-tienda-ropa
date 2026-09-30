# Tasks — API Error Standardization

## Phase Overview

| Phase | Descripción | Tareas |
|-------|-------------|--------|
| 2 | Sistema de errores (infraestructura) | T1, T2, T3 |
| 1 | Bug fixes (usan infraestructura nueva) | T4, T5, T6, T7 |
| 3 | Frontend (alineado con nuevo envelope) | T8, T9, T10 |
| — | Tests | T11, T12 |

## Dependencias

```
T1 (errors.ts) ──→ T2 (response.ts) ──→ T3 (errorHandler.ts)
                                              │
                    T4 (factory.ts) ←─────────┘  (paralelo con T3)
                    T5 (arca.controller.ts) ←──┘
                    T6 (branch.controller.ts) ←─┘
                    T7 (sale.service.ts) ←──────┘
                                              │
T8 (apiFetch.ts) ──→ T9 (useApi.ts) ──→ T10 (SalesPage.tsx)
                                              │
                    T11 (fix tests API) ←─────┘
                    T12 (fix tests frontend) ←┘
```

**Notas**:
- T4–T7 dependen de T1 (para usar AppError/NotFoundError) pero NO de T3. Pueden implementarse en paralelo con T3.
- T4 (factory.ts) y T5 (arca.controller.ts) **técnicamente no necesitan T1** (son bug fixes puros), pero se listan aquí después de T1 por orden de implementación recomendado. Si se requiere máxima velocidad, pueden ejecutarse inmediatamente.
- T8–T10 son frontend puro, independientes del backend, pero idealmente después de T3 (para testear contra el nuevo envelope real).
- T11 y T12 deben ejecutarse después de que los cambios correspondientes estén completos.

---

## Tasks

### T1 — AppError jerarquía

| Campo | Valor |
|-------|-------|
| **Dependencies** | — |
| **Phase** | 2 (Sistema errores) |
| **Files** | `apps/api/src/lib/errors.ts` |
| **Description** | Reemplazar las 3 clases planas actuales (`ValidationError`, `NotFoundError`, `ConflictError`) con una jerarquía que extiende `AppError` base. `AppError` extiende `Error` con `constructor(code: string, options?: { message?: string; details?: any })`. Si no se pasa `message`, se usa `code` como fallback (backward compat). Cada subclase fija su `statusCode` por defecto. Exportar type guard `isAppError(err)`. Todas las clases se exportan desde el mismo módulo. |
| **Acceptance criteria** | • `new ValidationError('CODE')` funciona sin `options` (message = 'CODE')<br>• `new NotFoundError('BRANCH_NOT_FOUND').statusCode === 404`<br>• `new ConflictError('SALE_ALREADY_EMITTED').statusCode === 409`<br>• `err instanceof ValidationError` sigue funcionando (tests legacy pasan)<br>• `isAppError(err)` retorna true para cualquier AppError subclass<br>• `AppError` no es exportable directamente si no se usaba antes (o se exporta para compat)<br>• Todos los imports existentes `from '../../lib/errors.js'` siguen funcionando sin cambios |
| **Notes** | ⚠️ El constructor cambia de `constructor(code: string)` a `constructor(code: string, options?: { message?, details? })`. Cualquier código que hace `new ValidationError('CODE', extraArg)` se rompe. Verificar que no existan call-sites con segundo argumento posicional. La firma del design usa `options` object — NO segundo argumento string. El type guard `isAppError` es nuevo y se usa en T2/T3. |

---

### T2 — response.ts (formatError + sendError)

| Campo | Valor |
|-------|-------|
| **Dependencies** | T1 |
| **Phase** | 2 (Sistema errores) |
| **Files** | `apps/api/src/lib/response.ts` **(NUEVO)** |
| **Description** | Crear `apps/api/src/lib/response.ts` con dos exports: `formatError(err)` y `sendError(res, err)`. `formatError` acepta `unknown` y retorna `{ statusCode, error: { code, message, details? } }`. Maneja 3 casos: AppError (usa err.code/message/statusCode/details), ZodError (code='VALIDATION_ERROR', message='Datos inválidos', details con fields flatten), y unknown (code='INTERNAL_ERROR', message='Error interno del servidor' + console.error). `sendError` llama a `formatError` y hace `res.status(code).json({ success: false, error })`. Incluir helper `formatZodError(err)` que transforma `err.flatten().fieldErrors` a `{ fields: { campo: 'msg1, msg2' } }`. |
| **Acceptance criteria** | • `formatError(new NotFoundError('X'))` retorna `{ statusCode: 404, error: { code: 'X', message: 'X' } }`<br>• `formatError(zodError)` retorna `{ statusCode: 400, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: { fields: {...} } } }`<br>• `formatError(new Error('boom'))` retorna `{ statusCode: 500, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }`<br>• `sendError(res, err)` llama a `res.status().json()` con `{ success: false, error: {...} }`<br>• ZodError details flatten: `{ email: ['Invalid'] }` → `{ fields: { email: 'Invalid' } }`<br>• Todos los mensajes están en **español** según el spec (`'Datos inválidos'`, `'Error interno del servidor'`)<br>• `console.error` se llama para errores no controlados con timestamp |
| **Notes** | ⚠️ Archivo **nuevo** — no rompe nada existente hasta que T3 lo use. ⚠️ Los mensajes del spec son en español: `'Datos inválidos'` y `'Error interno del servidor'`. No usar inglés. El design code tiene "Validation failed" / "Internal server error" — **corregir** a español. ⚠️ `isZodError` debe ser una función robusta que detecte ZodError incluso si viene de otro contexto (instanceof no siempre funciona con múltiples copias de zod — usar check de `issues` array como fallback). |

---

### T3 — errorHandler.ts (envelope estandarizado)

| Campo | Valor |
|-------|-------|
| **Dependencies** | T1, T2 |
| **Phase** | 2 (Sistema errores) |
| **Files** | `apps/api/src/middleware/errorHandler.ts` |
| **Description** | Reemplazar la lógica actual de errorHandler (ifs manuales con `res.json({ error: message })`) con una delegación a `formatError` desde `response.ts`. El handler importa `formatError`, llama `const { statusCode, error } = formatError(err)`, y responde con `res.status(statusCode).json({ success: false, error })`. Eliminar imports de ZodError y de las subclases de error que ya no se necesitan. Mantener la firma `(err, _req, res, _next)` para que Express lo reconozca como error handler de 4 parámetros. |
| **Acceptance criteria** | • AppError responde con `{ success: false, error: { code, message, details? } }`<br>• ZodError responde con `{ success: false, error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', details: { fields } } }`<br>• Errores no controlados responden 500 con `{ success: false, error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } }` + console.error<br>• No hay más `res.json({ error: '...' })` (formato legacy) en el handler<br>• La firma de 4 parámetros se respeta para que Express lo trate como error handler<br>• **NO hay cambios en respuestas exitosas** — `res.json(data)` sigue igual sin `success: true` |
| **Notes** | ⚠️ **Punto de no retorno**: Este cambio rompe la API visible — los consumers que esperan `{ error: 'CODE' }` (string) ahora reciben `{ success: false, error: { code, message } }`. El único consumer propio es `apiFetch.ts` (se actualiza en T8). Tests de integración legacy se rompen (se actualizan en T11). ⚠️ Verificar que el middleware esté registrado con `app.use(errorHandler)` al final de la cadena. ⚠️ No usar `return` antes de `res.status().json()` (innecesario en Express 4, pero no daña). |

---

### T4 — factory.ts: circular JSON + IVA_ALIQUOTAS + Factura B

| Campo | Valor |
|-------|-------|
| **Dependencies** | — (técnicamente ninguna, aunque se lista tras T1) |
| **Phase** | 1 (Bug fixes) |
| **Files** | `apps/api/src/lib/arca/factory.ts` |
| **Description** | **Tres cambios en el mismo archivo:**<br><br>**4a. Circular JSON (catch block):** En lugar de `JSON.stringify({ error: err })` que crashea con referencias circulares (AxiosError), extraer solo props serializables: `{ error: { name, message, code, cause } }`. Si `JSON.stringify` vuelve a fallar, fallback a `rawResponse: '{"error": "non-serializable"}'`.<br><br>**4b. IVA_ALIQUOTAS completo:** Reemplazar el objeto actual (5 entradas) con 14 entradas que cubren todas las condiciones fiscales AFIP. Las condiciones exentas mapean a `{ id: 3, percentage: 0 }`; las gravadas a `{ id: 5, percentage: 21 }`. Incluir: 'IVA Responsable Inscripto', 'IVA Responsable No Inscripto', 'IVA Sujeto Exento', 'Consumidor Final', 'Responsable Monotributo', 'Sujeto No Categorizado', 'Proveedor del Exterior', 'Cliente del Exterior', 'Liberado - Ley 19.640', 'IVA Responsable Inscripto - Agente de Percepción', 'Pequeño Contribuyente Eventual', 'Monotributista Social', 'Pequeño Contribuyente Eventual Social', 'Exento'.<br><br>**4c. Factura B (CbteTipo 6) IVA incluido:** Detectar `cbteTipo === 6` y aplicar gross-up: `impNeto = Math.round((precio / (1 + 0.21)) * 100) / 100`. `impIVA` es la diferencia. `impNeto` debe ser `let` (actualmente `const`). Factura A (CbteTipo 1) mantiene lógica actual. Factura C (CbteTipo 11) mantiene IVA=0. |
| **Acceptance criteria** | • `rawResponse` en catch block nunca crashea con circular references — siempre es un string JSON válido<br>• `IVA_ALIQUOTAS` tiene exactamente 14 entradas (ninguna condición fiscal conocida cae al fallback)<br>• Fallback `?? { id: 5, percentage: 21 }` se mantiene para condiciones desconocidas<br>• Factura B con precio $121 → `ImpNeto = 100`, `ImpIVA = 21`, `ImpTotal = 121`<br>• Factura A con neto $100 → IVA se agrega al neto (lógica existente, sin cambios)<br>• Factura C → IVA = 0 (lógica existente, sin cambios)<br>• `impNeto` cambia de `const` a `let` para permitir reasignación en Factura B |
| **Notes** | ⚠️ **`impNeto` debe cambiar de `const` a `let`** — no olvidar, si no la reasignación falla en TypeScript. ⚠️ El fix de circular JSON cambia la forma de `rawResponse` de `{ error: <Error> }` a `{ error: { name, message, code, cause } }`. Si algún cliente parsea `rawResponse` como objeto Error, se rompe. Frontend propio no usa rawResponse. ⚠️ La detección `esFacturaB = cbteTipo === 6 && !esFacturaC` es redundante (cbteTipo 6 ≠ 11) pero correcta. ⚠️ IVA_ALIQUOTAS incluye 'Exento' como entrada separada (puede llegar como condición fiscal directa). |

---

### T5 — arca.controller.ts: HTTP 422 en rejected

| Campo | Valor |
|-------|-------|
| **Dependencies** | — (técnicamente ninguna, se lista tras T1) |
| **Phase** | 1 (Bug fixes) |
| **Files** | `apps/api/src/modules/arca/arca.controller.ts` |
| **Description** | Evaluar `voucher.result` antes de responder: si `result === 'rejected'`, responder con `res.status(422).json(voucher)`. Para `authorized`, `indeterminate` y `conflict`, responder con status 200 (actual, sin cambios). |
| **Acceptance criteria** | • `voucher.result === 'rejected'` → HTTP status 422<br>• `voucher.result === 'authorized'` → HTTP status 200 (sin cambios)<br>• `voucher.result === 'indeterminate'` → HTTP status 200 (sin cambios)<br>• `voucher.result === 'conflict'` → HTTP status 200 (sin cambios)<br>• El body de la respuesta es el mismo `voucher` en todos los casos (sin transformación)<br>• Tests que esperaban 200 en reject se rompen (se actualizan en T11) |
| **Notes** | ⚠️ No cambiar el body — solo el status code. ⚠️ No hay relación con T3 (el envelope de error no aplica aquí porque `voucher` no es un error, es un resultado con datos). ⚠️ `422 Unprocessable Entity` es semánticamente correcto: ARCA procesó la solicitud pero la rechazó por validaciones fiscales. |

---

### T6 — branch.controller.ts: throw NotFoundError

| Campo | Valor |
|-------|-------|
| **Dependencies** | T1 |
| **Phase** | 1 (Bug fixes) |
| **Files** | `apps/api/src/modules/branches/branch.controller.ts` |
| **Description** | Reemplazar el inline `return res.status(404).json({ error: 'BRANCH_NOT_FOUND' })` con `throw new NotFoundError('BRANCH_NOT_FOUND')`. El error se propaga via `next(err)` en el catch del controller y llega a errorHandler (T3) que lo formatea con el nuevo envelope. Importar `NotFoundError` desde `../../lib/errors.js`. |
| **Acceptance criteria** | • Branch no encontrada → se lanza `NotFoundError('BRANCH_NOT_FOUND')`<br>• El error es capturado por el bloque `catch` existente y pasa a `next(err)`<br>• Import de `NotFoundError` desde `../../lib/errors.js` agregado<br>• No hay más `res.status(404).json({ error: 'BRANCH_NOT_FOUND' })` inline<br>• La respuesta HTTP después de T3 será `{ success: false, error: { code: 'BRANCH_NOT_FOUND', message: 'BRANCH_NOT_FOUND' } }` con status 404 |
| **Notes** | ⚠️ Después de T3, la respuesta cambia de `{ error: 'BRANCH_NOT_FOUND' }` a `{ success: false, error: { code, message } }`. Tests que verifican formato legacy se rompen (T11). ⚠️ El controller ya tiene try/catch con `next(err)` — solo cambiar el throw. ⚠️ Verificar que import esté en el lugar correcto (imports de `express` y servicios van primero). |

---

### T7 — sale.service.ts: ConflictError → NotFoundError

| Campo | Valor |
|-------|-------|
| **Dependencies** | T1 |
| **Phase** | 1 (Bug fixes) |
| **Files** | `apps/api/src/modules/_example/sales/sale.service.ts` |
| **Description** | Cambiar `throw new ConflictError('ITEM_NOT_FOUND')` a `throw new NotFoundError('ITEM_NOT_FOUND')`. Agregar import de `NotFoundError` desde `../../../lib/errors.js`. Mantener import de `ConflictError` si aún se usa (para `INSUFFICIENT_STOCK`). |
| **Acceptance criteria** | • `ITEM_NOT_FOUND` lanza `NotFoundError` (HTTP 404) en vez de `ConflictError` (HTTP 409)<br>• `INSUFFICIENT_STOCK` sigue lanzando `ConflictError` (sin cambios)<br>• Import de `NotFoundError` agregado, import de `ConflictError` removido solo si ya no se usa<br>• Semánticamente correcto: item no encontrado es 404 (not found), no 409 (conflict)<br>• Tests que esperaban `ConflictError` para `ITEM_NOT_FOUND` se rompen (T11) |
| **Notes** | ⚠️ **ITEM_NOT_FOUND cambia HTTP status de 409 a 404.** Si hay clientes externos dependiendo del 409, se rompen. Frontend propio usa `error.code` (se actualiza en T10). ⚠️ Verificar que `purchase.service.ts` NO se cambia (ya usa NotFoundError correctamente). ⚠️ `ConflictError` se mantiene importado para `INSUFFICIENT_STOCK` en la línea siguiente — solo remover el import si ya no hay ningún otro uso de ConflictError en el archivo. |

---

### T8 — apiFetch.ts: ApiError class + envelope parse

| Campo | Valor |
|-------|-------|
| **Dependencies** | — (frontend, independiente del backend pero idealmente después de T3) |
| **Phase** | 3 (Frontend) |
| **Files** | `apps/web/src/lib/apiFetch.ts` |
| **Description** | Definir `class ApiError extends Error` con `constructor(code: string, message: string, details?: any)`, propiedades públicas `code` y `details`. Actualizar `apiFetch` para: (1) cuando `!response.ok` o `body.success === false`, parsear el nuevo envelope `{ success: false, error: { code, message, details? } }` y lanzar `new ApiError(code, message, details)`; (2) fallback legacy para `{ error: 'STRING' }` → `new ApiError(body.error, body.error)`; (3) fallback final `new ApiError('UNKNOWN_ERROR', \`Request failed: ${response.status}\`)`. |
| **Acceptance criteria** | • `apiFetch` devuelve 422 con `{ success: false, error: { code: 'ARCA_NOT_CONFIGURED', message: '...' } }` → lanza `ApiError` con code y message correctos<br>• `apiFetch` devuelve 400 con `{ error: 'BUSINESS_NOT_FOUND' }` (legacy) → lanza `ApiError('BUSINESS_NOT_FOUND', 'BUSINESS_NOT_FOUND')`<br>• `apiFetch` devuelve 500 con body no parseable → lanza `ApiError('UNKNOWN_ERROR', 'Request failed: 500')`<br>• `err instanceof Error` sigue funcionando (ApiError extiende Error)<br>• `err.message` sigue siendo string legible para código legacy<br>• `err.code` expone el código estructurado para lookup programático<br>• Response 204 → retorna `null` (sin cambios)<br>• Response exitosa sin `success` field → retorna `response.json()` (sin cambios) |
| **Notes** | ⚠️ El orden de detección importa: primero nuevo envelope (`body?.success === false && body?.error`), luego legacy (`body?.error && typeof body.error === 'string'`), luego fallback. ⚠️ No cambiar el `Content-Type` header ni el manejo de `X-Branch-Id`. ⚠️ `ApiError` se define en el mismo archivo que `apiFetch` para evitar imports circulares. ⚠️ El header `credentials: 'include'` se mantiene. |

---

### T9 — useApi.ts: tipar error como ApiError

| Campo | Valor |
|-------|-------|
| **Dependencies** | T8 |
| **Phase** | 3 (Frontend) |
| **Files** | `apps/web/src/lib/useApi.ts` |
| **Description** | Cambiar el tipo de `error` en `UseApiResult<T>` de `string | null` a `ApiError | null`. Actualizar el catch en `fetchFn`: cuando `err instanceof ApiError`, usar directamente; si no, wrappear con `new ApiError('UNKNOWN_ERROR', err.message)`. Importar `ApiError` desde `./apiFetch`. |
| **Acceptance criteria** | • `error` en `UseApiResult` es `ApiError | null` (no `string | null`)<br>• `error` sigue siendo nullable — `if (error)` funciona, `error?.code` tipa correctamente<br>• Si el error lanzado es un `ApiError`, se asigna directamente a `error`<br>• Si el error lanzado no es `ApiError` (ej. Error nativo), se wrappea a `ApiError('UNKNOWN_ERROR', err.message)`<br>• `import type { ApiError }` desde `./apiFetch` — usar `type` import para evitar bundling circular si apiFetch exporta la función también<br>• La API pública `{ data, loading, error, refetch }` no cambia en estructura |
| **Notes** | ⚠️ Cualquier componente que lee `error` como string (`error.includes(...)`, `error.length`) se rompe. El único componente afectado es SalesPage (se actualiza en T10). ⚠️ Usar `import type { ApiError }` (solo tipo) para evitar dependencia runtime circular entre useApi y apiFetch. ⚠️ No cambiar la firma de `fetchFn` ni el behavior de `loading`/`data`/`refetch`. |

---

### T10 — SalesPage.tsx: error.code lookup + helper

| Campo | Valor |
|-------|-------|
| **Dependencies** | T9 |
| **Phase** | 3 (Frontend) |
| **Files** | `apps/web/src/modules/_example/sales/SalesPage.tsx` |
| **Description** | Refactorizar el manejo de errores en `handleIssue` y otros lugares donde se captura error. Crear función helper `handleApiError(err: unknown): string` que si `err instanceof ApiError` hace lookup en `ARCA_ERROR_MESSAGES[err.code] ?? err.message`, y si no retorna `err instanceof Error ? err.message : 'Error inesperado'`. Reemplazar los 3 bloques catch que hacen `err instanceof Error ? err.message : 'Error al facturar'` con llamadas a `handleApiError(err)`. Importar `ApiError` desde `../../../lib/apiFetch`. |
| **Acceptance criteria** | • Los 3 catch blocks usan `handleApiError(err)` en vez de lógica inline<br>• `handleApiError` retorna `ARCA_ERROR_MESSAGES[err.code] ?? err.message` para ApiError<br>• `handleApiError` retorna `err.message` para Error nativo<br>• `handleApiError` retorna `'Error inesperado'` para errores no-Error<br>• Si `ARCA_ERROR_MESSAGES` no tiene entry para un code, usa `err.message` como fallback<br>• Import de `ApiError` desde `../../../lib/apiFetch` agregado |
| **Notes** | ⚠️ El patrón se repite en 3 lugares del archivo (líneas 112-115, 150-153, y dentro de `handleSubmit`). Refactorizar a helper evita duplicación. ⚠️ No cambiar la lógica de éxito ni el estado `issuingId`. ⚠️ `handleApiError` debe ser una función fuera del componente (o con `useCallback` si dentro) para evitar re-creaciones en cada render. ⚠️ `ARCA_ERROR_MESSAGES` debe mantenerse como un `Record<string, string>` — no cambiar su definición. |

---

### T11 — Fix tests API (backend)

| Campo | Valor |
|-------|-------|
| **Dependencies** | T3, T4, T5, T6, T7 |
| **Phase** | — (tests) |
| **Files** | • `apps/api/src/modules/arca/arca.service.test.ts`<br>• `apps/api/src/lib/arca/factory.test.ts`<br>• `apps/api/src/middleware/errorHandler.test.ts` (si existe)<br>• `apps/api/src/modules/_example/sales/sale.service.test.ts`<br>• `apps/api/src/modules/branches/branch.controller.test.ts` (si existe) |
| **Description** | Actualizar tests backend para alinearlos con los cambios de T3–T7:<br><br>**arca.service.test.ts**: Si hay tests que verifican respuesta HTTP (status + body), actualizar expectativas de 200→422 para `rejected` y de `{ error: '...' }` (legacy) a `{ success: false, error: { code, message } }` (nuevo envelope). Tests de éxito (200) sin cambios.<br><br>**factory.test.ts**: Si hay tests que verifican `rawResponse` con SDK exception (líneas 121-151 aprox), actualizar assertion de `{ error: err }` a `{ error: { name, message, code, cause } }`.<br><br>**errorHandler.test.ts** (si existe): Actualizar todas las assertions de body a nuevo envelope `{ success: false, error: { code, message } }`.<br><br>**sale.service.test.ts**: Verificar que ningún test espere `ConflictError('ITEM_NOT_FOUND')`. Si existe, cambiar a `NotFoundError('ITEM_NOT_FOUND')`. Tests de `INSUFFICIENT_STOCK` (sigue siendo ConflictError) no cambian.<br><br>**branch.controller.test.ts** (si existe): Actualizar cualquier test que verifique respuesta 404 con formato legacy al nuevo envelope. |
| **Acceptance criteria** | • Todos los tests backend pasan con `npx vitest` (o `npm test`)<br>• `arca.service.test.ts` tests de reject verifican 422 + nuevo envelope<br>• `factory.test.ts` tests de error verifican nueva forma de `rawResponse`<br>• `sale.service.test.ts` no espera `ConflictError('ITEM_NOT_FOUND')` en ningún test<br>• `errorHandler.test.ts` (si existe) verifica nuevo envelope para AppError, ZodError y errores no controlados<br>• `branch.controller.test.ts` (si existe) verifica nuevo envelope 404<br>• No se modifican tests de éxito ni tests no afectados por los cambios |
| **Notes** | ⚠️ NO cambiar tests de `invoicing.service.test.ts` — todos los `rejects.toThrow(ValidationError)` siguen funcionando porque `AppError` message = code cuando no hay options.message. ⚠️ NO cambiar tests de rutas exitosas (`business.routes.test.ts` etc.) — respuestas exitosas no tienen envelope. ⚠️ Verificar que cada archivo de test existe antes de modificarlo — algunos pueden no existir aún. |

---

### T12 — Fix tests frontend

| Campo | Valor |
|-------|-------|
| **Dependencies** | T8, T9, T10 |
| **Phase** | — (tests) |
| **Files** | • `apps/web/src/modules/_example/sales/sales.service.test.ts` (si existe y si testea ITEM_NOT_FOUND) |
| **Description** | Verificar si existe `apps/web/src/modules/_example/sales/sales.service.test.ts` (o similar que testee la respuesta del API para ITEM_NOT_FOUND). Si algún test espera `ConflictError` o formato legacy de respuesta para ITEM_NOT_FOUND, actualizarlo a `NotFoundError` y al nuevo envelope. |
| **Acceptance criteria** | • Todos los tests frontend pasan con `npx vitest` (o `npm test`)<br>• Si existe test para ITEM_NOT_FOUND en frontend, usa formato correcto (ApiError vs Error)<br>• Si no existe el archivo de test, no se crea — solo se verifica que no haya tests rotos |
| **Notes** | ⚠️ Es posible que `apps/web/src/modules/_example/sales/sales.service.test.ts` no exista. Si no existe, no crearlo — la tarea es solo actualizar tests existentes. ⚠️ Los tests frontend normalmente mockean `fetch` o `apiFetch` — verificar que los mocks estén actualizados para el nuevo envelope si existen tests de integración. |

---

## Resumen de fases vs. tareas

| Fase | Tareas | ¿Rompe API? |
|------|--------|-------------|
| 1 — Bug fixes | T4, T5, T6, T7 | No (T6/T7 cambian envelope solo después de T3) |
| 2 — Sistema errores | T1, T2, T3 | Sí (T3 cambia formato de respuesta de errores) |
| 3 — Frontend | T8, T9, T10 | No (cambio interno del frontend) |
| Tests | T11, T12 | N/A |

## Estrategia de rollback

| Paso | Revertir |
|------|----------|
| Antes de T3 | Cualquier tarea individual es reversible sin impacto visible en API |
| Después de T3 | Revertir T3 restaura formato legacy; T4–T7 pueden revertirse individualmente |
| T8–T10 | Reversibles independientemente del backend |