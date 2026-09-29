# Guía de Pruebas: Facturación Electrónica ARCA Multi-Tenant

## Resumen de la Feature

Implementación completa de facturación electrónica ARCA para el template multi-tenant. Cada negocio (tenant) tiene su propio CUIT, certificado y clave privada, cifrados con AES-256-GCM + PBKDF2.

---

## Endpoints Disponibles

### Configuración ARCA por Negocio

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| `GET` | `/api/business/arca` | `business:read` | Obtener configuración ARCA actual |
| `PUT` | `/api/business/arca` | `business:update` | Actualizar configuración ARCA |

### Emisión y Consulta de Comprobantes

| Método | Endpoint | Permiso | Descripción |
|--------|----------|---------|-------------|
| `POST` | `/api/sales/:id/issue` | `sales:update` | Emitir factura para una venta |
| `GET` | `/api/sales/:id/arca-voucher` | `sales:read` | Consultar comprobante emitido |

---

## Setup Inicial

### 1. Variables de Entorno

```bash
# .env en apps/api/
ARCA_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000  # 64 chars hex (dev only)
```

> **Producción**: Genera una clave real de 64 caracteres hex:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 2. Ejecutar Migraciones

```bash
cd apps/api
npm run migrate
```

Esto crea:
- Columnas ARCA en `businesses`, `branches`, `customers`, `sales`
- Tablas `arca_vouchers` y `arca_store`

### 3. Levantar Servidor

```bash
cd apps/api
npm run dev
```

---

## Flujo de Pruebas Paso a Paso

### Paso 1: Configurar Negocio para ARCA

```bash
# Obtener token de auth (login previo requerido)
curl -X GET http://localhost:3000/api/business/arca \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta esperada (no configurado):**
```json
{
  "taxId": null,
  "issuerCondition": null,
  "arcaEnvironment": "homologation",
  "arcaConfigured": false
}
```

### Paso 2: Configurar Datos Fiscales

```bash
curl -X PUT http://localhost:3000/api/business/arca \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "taxId": "30123456789",
    "issuerCondition": "IVA Responsable Inscripto",
    "arcaEnvironment": "homologation",
    "arcaCertPem": "-----BEGIN CERTIFICATE-----\nMIIF...certificado...\n-----END CERTIFICATE-----",
    "arcaPrivateKeyPem": "-----BEGIN PRIVATE KEY-----\nMIIE...clave privada...\n-----END PRIVATE KEY-----"
  }'
```

**Notas importantes:**
- `taxId`: CUIT sin guiones (11 dígitos)
- `issuerCondition`: Valor exacto de la lista AFIP (ver `packages/shared/src/schemas/arca.ts`)
- `arcaCertPem` y `arcaPrivateKeyPem`: **Ambos requeridos juntos** o ninguno
- En homologación usa certificados de prueba de ARCA
- Los PEMs se cifran automáticamente antes de guardar

### Paso 3: Verificar Configuración Guardada

```bash
curl -X GET http://localhost:3000/api/business/arca \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta esperada (configurado):**
```json
{
  "taxId": "30123456789",
  "issuerCondition": "IVA Responsable Inscripto",
  "arcaEnvironment": "homologation",
  "arcaConfigured": true
}
```

> **Nunca** se devuelven los PEMs en las respuestas (seguridad).

---

### Paso 4: Preparar Venta para Facturar

Requisitos previos para una venta:
- ✅ Negocio con ARCA configurado (Paso 2)
- ✅ Sucursal con `salesPoint` (punto de venta) configurado
- ✅ Venta con `customerId` asignado
- ✅ Cliente con `cuit` o `dni` + `vatCondition`
- ✅ Venta en estado `arcaStatus: null` (no facturada)

```bash
# Verificar sucursal tiene salesPoint
curl -X GET http://localhost:3000/api/branches/<BRANCH_ID> \
  -H "Authorization: Bearer <TOKEN>"

# Si falta, actualizar:
curl -X PUT http://localhost:3000/api/branches/<BRANCH_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"salesPoint": 1}'
```

```bash
# Verificar cliente tiene datos fiscales
curl -X GET http://localhost:3000/api/customers/<CUSTOMER_ID> \
  -H "Authorization: Bearer <TOKEN>"

# Si faltan, actualizar:
curl -X PUT http://localhost:3000/api/customers/<CUSTOMER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cuit": "30987654321", "vatCondition": "Consumidor Final"}'
```

---

### Paso 5: Emitir Factura

```bash
curl -X POST http://localhost:3000/api/sales/<SALE_ID>/issue \
  -H "Authorization: Bearer <TOKEN>"
```

**Respuesta exitosa (autorizada):**
```json
{
  "id": "uuid-del-comprobante",
  "saleId": "uuid-de-la-venta",
  "result": "authorized",
  "arcaVoucherId": "12345678901234",        // CAE
  "arcaVoucherNumber": 1,                    // Número de comprobante
  "emissionCode": "A",
  "emissionMessage": null,
  "rawResponse": "{...respuesta SOAP completa...}",
  "emittedAt": "2026-09-29T15:30:00.000Z"
}
```

**Posibles resultados:**
| `result` | Significado | Acción |
|----------|-------------|--------|
| `authorized` | Factura autorizada por ARCA | ✅ Listo |
| `rejected` | ARCA rechazó (ej. CUIT inválido) | Corregir datos y reintentar |
| `indeterminate` | Timeout/Error de comunicación | Reintentar (verificar `arca-voucher`) |
| `conflict` | Ya existe comprobante para esta venta | Consultar con GET |

---

### Paso 6: Consultar Comprobante Emitido

```bash
# Básico
curl -X GET http://localhost:3000/api/sales/<SALE_ID>/arca-voucher \
  -H "Authorization: Bearer <TOKEN>"

# Con respuesta SOAP cruda (debug)
curl -X GET "http://localhost:3000/api/sales/<SALE_ID>/arca-voucher?includeRaw=true" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Casos de Error Comunes

| Error Code | Causa | Solución |
|------------|-------|----------|
| `ARCA_NOT_CONFIGURED` | Negocio sin PEMs | Configurar con PUT /business/arca |
| `BUSINESS_MISSING_TAX_ID` | Falta CUIT en negocio | Agregar `taxId` |
| `BUSINESS_MISSING_ISSUER_CONDITION` | Falta condición IVA | Agregar `issuerCondition` |
| `BRANCH_MISSING_SALES_POINT` | Sucursal sin punto de venta | Setear `salesPoint` en branch |
| `SALE_MISSING_CUSTOMER` | Venta sin cliente | Asignar `customerId` a la venta |
| `CUSTOMER_MISSING_FISCAL_ID` | Cliente sin CUIT/DNI | Agregar `cuit` o `dni` + `vatCondition` |
| `SALE_ALREADY_EMITTED` | Venta ya facturada (authorized/indeterminate) | No reemitir; si `rejected`, sí permite reintento |
| `ENCRYPTION_ERROR` | Error descifrando PEMs | Verificar `ARCA_MASTER_KEY` coincide |
| `ARCA_TIMEOUT` | ARCA no respondió en 20s | Reintentar (idempotente por `saleId`) |
| `INVALID_ISSUER_CONDITION` | Condición IVA no reconocida | Usar valor exacto del enum AFIP |

---

## Pruebas Automatizadas

```bash
cd apps/api

# Todas las pruebas
npm run test

# Solo pruebas ARCA
npm run test -- --filter=arca

# Tests unitarios crypto
npm run test -- apps/api/src/lib/arca/crypto.test.ts

# Tests de integración (requiere DB)
npm run test -- apps/api/src/modules/arca/arca.service.test.ts
```

**Tests existentes:** 84 tests en 19 suites cubren:
- ✅ Crypto: roundtrip, tamper detection, wrong key
- ✅ Factory: adapter creation, SDK response mapping
- ✅ Invoicing service: 7 precondiciones, re-emisión, conflict, timeout
- ✅ Rutas: auth, permisos, validaciones, flow completo

---

## Certificados de Prueba (Homologación)

Para testing en homologación ARCA:

1. Descargar certificados de prueba desde: https://www.afip.gob.ar/fe/homo/
2. Usar CUIT de prueba: `20222222227` (o similar)
3. Clave privada de prueba incluida en el paquete AFIP

> **Importante**: Los certificados de homologación **no sirven para producción**. Para producción usar certificados reales de AFIP.

---

## Variables de Entorno Completas

```bash
# apps/api/.env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/db
BETTER_AUTH_SECRET=...
ARCA_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000
```

---

## Troubleshooting

### "Invalid CUIT format"
- El CUIT debe ser 11 dígitos numéricos sin guiones
- Validación en `arcaConfigSchema` (Zod)

### "Both arcaCertPem and arcaPrivateKeyPem must be provided together"
- Enviar ambos campos o ninguno en PUT /business/arca

### "SALE_ALREADY_EMITTED" pero quiero reemitir
- Solo permitido si `arcaStatus === 'rejected'`
- Verificar estado: `GET /api/sales/<ID>` → revisar `arcaStatus`

### Timeout frecuente (ARCA_TIMEOUT)
- Verificar conectividad a `wswhomo.afip.gov.ar` (homologación)
- En producción: `wsfe.afip.gov.ar`
- Aumentar timeout en `invoicing.service.ts` si necesario

---

## Estructura de Datos Clave

### Tabla `arca_vouchers`
```sql
id UUID PK
business_id UUID FK
sale_id UUID FK UNIQUE
result VARCHAR -- authorized/rejected/indeterminate/conflict
arca_voucher_id VARCHAR -- CAE
arca_voucher_number INTEGER
emission_code VARCHAR
emission_message TEXT
raw_response TEXT -- SOAP response JSON
idempotency_key VARCHAR -- sale_id
emitted_at TIMESTAMP
```

### Tabla `arca_store` (WSAA tokens cache)
```sql
id TEXT PK -- service name
value TEXT -- serialized AccessTicket
created_at TIMESTAMP
```

---

## Referencias

- **SDK usado**: `@arcasdk/core` v2.x (https://github.com/ralcorta/arcasdk)
- **Documentación ARCA**: https://www.afip.gob.ar/fe/
- **Specs SDD**: `openspec/changes/archive/2026-09-29-arca-multitenant-integration/`
- **Código**: `apps/api/src/lib/arca/`, `apps/api/src/modules/arca/`