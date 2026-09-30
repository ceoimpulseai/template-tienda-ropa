# ARCA Facturación Electrónica - Registro de Fixes y Estado

> **Última actualización**: 2026-09-30
> **Estado general**: ⚠️ En proceso - Pendiente configuración certificados AFIP homologación

---

## ✅ FIXES APLICADOS (Cronológico)

### 1. `alreadyAuthenticated` - Bug crítico WSAA
**Error**: `ns1:coe.alreadyAuthenticated: El CEE ya posee un TA valido`
**Causa**: `ticketStorage.get()` devolvía `isExpired: () => true` siempre → SDK creía que token expirado → re-autenticaba → AFIP rechazaba.
**Fix**: `apps/api/src/lib/arca/ticket-storage.ts`
- `isExpired()` ahora verifica expiración real comparando `expirationTime` vs `now`
- Agregados métodos SDK requeridos: `getToken()`, `getSign()`, `getExpirationTime()`, `getGenerationTime()`
- Mutex por servicio (`withMutex`) para evitar race conditions en llamadas concurrentes
- Validación robusta: rechaza tickets corruptos, sin token/sign, fechas inválidas
- `save()` valida antes de guardar (evita corromper BD con `undefined`)

**Commit**: `875bddb` → `71d80b9` → `d2843cb`

---

### 2. `ENCRYPTION_ERROR` - Backward compatibility crypto
**Error**: `ENCRYPTION_ERROR` al descifrar PEMs existentes en BD
**Causa**: Nuevo `decryptPem` solo esperaba formato v1 (con `version` + `salt` aleatorio), pero BD tenía formato legacy (salt determinístico por businessId).
**Fix**: `apps/api/src/lib/arca/crypto.ts`
- `decryptPem` detecta formato automáticamente:
  - **Legacy**: sin `version`, usa `deriveKeyLegacy(businessId)` (salt = `arca-tenant-key-v1:{businessId}`)
  - **v1**: con `version: 1` + `salt` aleatorio, usa `deriveKey(masterKey, businessId, salt)`
- Payload versionado: `{ version, salt, iv, tag, ciphertext }` para futura rotación de master key
- Eliminada `deriveTenantKey()` pública (era determinística, misma vulnerabilidad que hash sin salt)
- Interface simplificada: `encryptPem(businessId, pem)` / `decryptPem(businessId, encrypted)`

**Commit**: `5079a80` → `d2843cb`

---

### 3. Arquitectura modular - Separación de responsabilidades
**Problema**: `factory.ts` mezclaba adapter de facturación + cache WSAA + 3 mapas fiscales paralelos.
**Fix**:
- **`ticket-storage.ts`** (nuevo): Solo cache WSAA, interfaz completa SDK
- **`fiscal-config.ts`** (nuevo): Única fuente de verdad para 14 condiciones fiscales AFIP
  - `voucherType` (1=A, 6=B, 11=C)
  - `ivaReceiverId` (1=RI, 4=otros)
  - `ivaAliquot` (id + %)
  - `priceIncludesVat` (Factura B)
- **`factory.ts`**: Usa ambos módulos, elimina 3 mapas duplicados
- **`invoicing.service.ts`**: Migra SQL raw → modelos Sequelize (`Business`, `Branch`, `Sale`, `Customer`, `Item`, `ArcaVoucher`)
- **`models/index.ts`**: Aliases en asociaciones (`as: 'customer'`, `as: 'item'`, etc.)

**Commit**: `21a6d46` → `71d80b9`

---

### 4. Configuración y migraciones
- **`env.ts`**: `ARCA_TIMEOUT_MS` configurable (default 20s)
- **`00007-arca-vouchers.ts`**: Elimina try-catch silenciosos en ENUMs, constantes tipadas
- **Timeout**: Usa `env.ARCA_TIMEOUT_MS` en vez de hardcoded 20s

---

## ⚠️ PROBLEMAS ACTUALES (Pendientes)

### 1. Certificados AFIP Homologación - `cms.sign.invalid`
**Error actual**: `ns1:cms.sign.invalid: Firma inválida o algoritmo no soportado`
**Estado**: ❌ Bloqueante - No se puede facturar
**Causa probable**: 
- Certificado/Key no matchean (modulus distinto)
- Clave en formato PKCS#1 vs PKCS#8 requerido por AFIP
- Certificado subido a frontend es CSR no certificado firmado

**Verificaciones pendientes**:
```bash
# 1. Cert es certificado firmado (no CSR)
openssl x509 -in certificate.pem -noout -subject

# 2. Key matchea cert (MD5 idénticos)
openssl x509 -noout -modulus -in certificate.pem | openssl md5
openssl rsa -noout -modulus -in MiClavePrivada.key | openssl md5

# 3. Si matchean, convertir a PKCS#8
openssl pkcs8 -topk8 -inform PEM -in MiClavePrivada.key -out MiClavePrivada_pkcs8.pem -nocrypt
```

---

### 2. Autorización servicio `wsfe` en WSASS
**Error previo**: `notAuthorized: Computador no autorizado`
**Estado**: ⚠️ Verificar
**Acción**: En WSASS homologación → "Gestión de accesos a servicios" → autorizar `wsfe` - Factura Electrónica (Homologación) para el CUIT del certificado.

---

### 3. CUIT Homologación válido
**Estado**: ⚠️ Verificar
**CUIT usado**: `20416986925` (debe ser CUIT de homologación habilitado en AFIP)
**Test rápido**: Probar con CUIT genérico `20222222227` para aislar si es problema del CUIT.

---

## 📋 CHECKLIST PARA PRODUCCIÓN

| Item | Estado | Nota |
|------|--------|------|
| Ticket storage robusto | ✅ | Completo con mutex, validación, interfaz SDK completa |
| Crypto backward compatible | ✅ | Legacy + v1, versionado para rotación |
| Fiscal config centralizado | ✅ | 14 condiciones AFIP en `fiscal-config.ts` |
| Sequelize models en invoicing | ✅ | Sin SQL raw, usa asociaciones |
| Timeout configurable | ✅ | `ARCA_TIMEOUT_MS` en env |
| Migraciones limpias | ✅ | Sin try-catch silenciosos |
| **Certificados homologación** | ❌ | **BLOQUEANTE** - `cms.sign.invalid` |
| **Servicio wsfe autorizado** | ⚠️ | Verificar en WSASS |
| **CUIT homologación habilitado** | ⚠️ | Verificar con AFIP |

---

## COMANDOS ÚTILES PARA DEBUG

```bash
# Limpiar cache tickets (forzar re-login)
cd apps/api
npx tsx -e "(async () => { const { sequelize } = await import('./src/config/database.js'); await sequelize.query('DELETE FROM arca_store'); await sequelize.close(); console.log('OK'); })()"

# Verificar cert/key
openssl x509 -in certificate.pem -noout -subject
openssl x509 -noout -modulus -in certificate.pem | openssl md5
openssl rsa -noout -modulus -in MiClavePrivada.key | openssl md5

# Convertir key a PKCS#8
openssl pkcs8 -topk8 -inform PEM -in MiClavePrivada.key -out MiClavePrivada_pkcs8.pem -nocrypt

# Server con debug ticket storage
cd apps/api
$env:DEBUG_TICKET_STORAGE="1"; $env:TEST_AUTH_HEADER_ENABLED="true"; npx tsx src/server.ts
```

---

## ARCHIVOS CLAVE MODIFICADOS

| Archivo | Descripción |
|---------|-------------|
| `apps/api/src/lib/arca/ticket-storage.ts` | **NUEVO** - Cache WSAA robusto con mutex |
| `apps/api/src/lib/arca/fiscal-config.ts` | **NUEVO** - Config fiscal centralizada (14 condiciones) |
| `apps/api/src/lib/arca/crypto.ts` | Crypto v1 + backward compat legacy |
| `apps/api/src/lib/arca/factory.ts` | Adapter facturación, usa fiscal-config + ticket-storage |
| `apps/api/src/lib/arca/invoicing.service.ts` | Orquestación con modelos Sequelize |
| `apps/api/src/models/index.ts` | Aliases en asociaciones Sale |
| `apps/api/src/config/env.ts` | `ARCA_TIMEOUT_MS` |
| `apps/api/src/db/migrations/00007-arca-vouchers.ts` | Migración limpia sin try-catch silenciosos |

---

## PRÓXIMOS PASOS RECOMENDADOS

1. **Resolver `cms.sign.invalid`** (prioridad 1)
   - Verificar cert/key match + PKCS#8
   - Usar certificado firmado por AFIP (no CSR)

2. **Verificar autorización `wsfe` en WSASS** para el CUIT

3. **Test end-to-end** factura autorizada en homologación

4. **Documentar proceso certificados** para onboarding equipo

5. **Tests de integración** contra AFIP homologación (CI opcional)

---

*Documento vivo - Actualizar tras cada fix*