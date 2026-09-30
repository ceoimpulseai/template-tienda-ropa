# Guía: Obtener Credenciales ARCA (AFIP) y Configurarlas en el Sistema

Este documento explica paso a paso cómo acceder al portal ARCA/AFIP, obtener los certificados digitales y configurarlos en el sistema.

---

## 1. Acceder al Portal ARCA / AFIP

### URL Principal
- **Portal ARCA Factura Electrónica**: https://www.afip.gob.ar/fe/

> **Importante**: Para desarrollo y testing, usa **homologación**. Los certificados de homologación no sirven para producción y viceversa.

### Enlaces útiles del portal
- **Entorno de prueba (información general)**: https://www.afip.gob.ar/fe/ayuda/entorno-prueba.asp
- **Homologación externa (manuales técnicos)**: https://www.afip.gob.ar/fe/ayuda/homologacion_externa.asp

---

## 2. Obtener Certificado Digital — Flujo Oficial (Producción)

Para **producción**, se usa el administrador de certificados de AFIP:

1. **Ingresar a "Administración de Certificados"**
   - En la web de AFIP → Servicios con Clave Fiscal → "Administración de Certificados Digitales"
   - O directo: https://admincertificados.afip.gob.ar/

2. **Solicitar Certificado para Factura Electrónica**
   - Seleccionar: "Solicitar Certificado"
   - Servicio: "Comprobantes en Línea" o "Factura Electrónica"
   - Tipo: "Producción"
   - Completar datos del solicitante (CUIT, razón social, email)

3. **Generar CSR (Certificate Signing Request)**
   - El sistema te pedirá generar un CSR
   - **Opción A**: Usar el generador web de AFIP (más fácil)
   - **Opción B**: Generar localmente con OpenSSL (ver §4)

4. **Descargar Certificado Firmado**
   - AFIP firmará tu CSR y te dará el certificado `.crt` o `.cer`
   - Descargar: `certificado.crt` y (si aplica) `certificado_intermedio.crt`

5. **Unir Certificados (para obtener el PEM completo)**
   ```bash
   # Si tenés certificado + intermedio + raíz
   cat certificado.crt certificado_intermedio.crt > certificado_completo.pem
   ```

---

## 3. Obtener Certificados de Homologación — Flujo WSASS (Testing)

Para **homologación/testing**, el flujo oficial es a través de **WSASS** (Autoservicio de Acceso a APIs de Homologación):

### 3.1 Ingresar a WSASS
- **URL**: https://wsass-homo.afip.gov.ar/wsass/portal/main.aspx
- Acceder con **Clave Fiscal**

### 3.2 Generar CSR con OpenSSL (en tu PC)

```bash
# Paso 1: generar clave privada (mínimo 2048 bits)
openssl genrsa -out MiClavePrivada.key 2048

# Paso 2: generar CSR (reemplazar valores entre < >)
# O=Nombre de tu empresa
# CN=Nombre de tu sistema/aplicación
# serialNumber=CUIT + 11 dígitos (sin guiones)
openssl req -new -key MiClavePrivada.key \
  -subj "/C=AR/O=<TuEmpresa>/CN=<TuSistema>/serialNumber=CUIT <30123456789>" \
  -out MiPedidoCSR.csr
```

**Ejemplo** para empresa "EmpresaPrueba", sistema "TestSystem", CUIT 20123456789:
```bash
openssl req -new -key MiClavePrivada.key \
  -subj "/C=AR/O=EmpresaPrueba/CN=TestSystem/serialNumber=CUIT 20123456789" \
  -out MiPedidoCSR.csr
```

### 3.3 Subir CSR a WSASS
En el portal WSASS:
- Seleccionar **"Formulario para obtener el certificado por primera vez"**
- Subir el archivo `MiPedidoCSR.csr`
- WSASS firmará el CSR y te devolverá el certificado `certificado.crt`

### 3.4 Solicitar acceso a servicios
Una vez obtenido el certificado:
- Ir a **"Gestión de accesos a servicios"** → **"Formulario de solicitud de autorización de acceso a servicio"**
- Seleccionar el servicio: **wsfev1** (Factura Electrónica)
- Completar y enviar solicitud

### 3.5 (Opcional) Delegación de representación
Si vas a facturar en nombre de otro CUIT:
- En **"Delegación de representación"** → **"Crear autorización a servicio"**
- En **"CUIT representado"** poner el CUIT a representar
- Seleccionar el servicio deseado

### 3.6 Configurar en el sistema
- Pegar el **certificado** (`certificado.crt`) y la **clave privada** (`MiClavePrivada.key`) en **Negocio > Facturación Electrónica ARCA**

> **Nota**: El CUIT de prueba típico para homologación es `20222222227` (ver WSASS para el tuyo).

---

## 4. Convertir a Formato PEM (si no lo están)

El sistema espera **PEM** (Base64 con headers `-----BEGIN ...-----`).

### Si tenés `.pfx` / `.p12` (formato Windows):
```bash
# Extraer certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out cert.pem

# Extraer clave privada
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out key.pem
```

### Si tenés `.cer` / `.crt` (DER o PEM):
```bash
# Verificar si ya es PEM
head -1 certificado.crt
# Si dice "-----BEGIN CERTIFICATE-----" → ya es PEM ✓
# Si son caracteres raros → es DER, convertir:
openssl x509 -inform der -in certificado.crt -out cert.pem
```

### Clave privada - debe ser PKCS#8 sin encriptar:
```bash
# Si la clave tiene contraseña, quitarla:
openssl rsa -in clave_con_pass.key -out clave_sin_pass.key

# Verificar formato correcto:
head -1 clave_sin_pass.key
# Debe decir: "-----BEGIN PRIVATE KEY-----" (PKCS#8)
# Si dice "-----BEGIN RSA PRIVATE KEY-----" → convertir:
openssl pkcs8 -topk8 -inform PEM -in clave_sin_pass.key -outform PEM -nocrypt -out key_pkcs8.pem
```

---

## 5. Configurar en el Sistema (UI Web)

### Acceder a la Configuración ARCA

1. **Login** en el sistema con usuario demo: `demo@template.local`
2. Ir a **Negocio** (sidebar) → pestaña **Facturación Electrónica ARCA**
3. Verás el formulario con campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **CUIT** | CUIT del emisor (11 dígitos, sin guiones) | `30123456789` |
| **Condición Fiscal** | Select con valores AFIP exactos | `IVA Responsable Inscripto` |
| **Ambiente** | Radio: Homologación / Producción | `Homologación` |
| **Certificado (.pem)** | Pegar contenido completo del `.pem` | `-----BEGIN CERTIFICATE-----...` |
| **Clave Privada (.pem)** | Pegar contenido completo de la key | `-----BEGIN PRIVATE KEY-----...` |

### Valores válidos para **Condición Fiscal** (deben ser exactos):

```
IVA Responsable Inscripto
IVA Responsable No Inscripto
IVA No Responsable
IVA Sujeto Exento
Consumidor Final
Responsable Monotributo
Sujeto No Categorizado
Proveedor del Exterior
Cliente del Exterior
Liberado - Ley 19.640
IVA Responsable Inscripto - Agente de Percepción
Pequeño Contribuyente Eventual
Monotributista Social
Pequeño Contribuyente Eventual Social
```

---

## 6. Guardar y Verificar

1. Click en **"Guardar configuración ARCA"**
2. El sistema:
   - Valida que ambos PEMs vengan juntos
   - Cifra los PEMs con AES-256-GCM (clave derivada del businessId)
   - Guarda en BD (nunca se devuelven en respuestas API)
3. Verás badge: **"Configurado"** + ambiente (Homologación/Producción)

---

## 7. Configurar Punto de Venta en Sucursal

Para poder facturar, la sucursal debe tener **Punto de Venta**:

1. Ir a **Sucursales** (sidebar)
2. Editar sucursal principal
3. Campo **"Punto de Venta"**: número asignado por AFIP (ej: `1`, `2`, `3`...)
4. Guardar

> En homologación, cualquier número funciona (ej: `1`). En producción debe coincidir con el habilitado en AFIP.

---

## 8. Configurar Datos Fiscales del Cliente

Para facturar, el cliente necesita:

1. Ir a **Clientes** → Editar cliente
2. Completar:
   - **CUIT** (11 dígitos) **O** **DNI**
   - **Condición IVA** (select con mismos valores que arriba)

---

## 9. Probar Facturación

1. Ir a **Ventas** (sidebar)
2. Crear venta nueva o usar existente
3. Click en botón **"Facturar"** (columna ARCA)
4. Modal muestra resultado:
   - ✅ **Autorizada**: CAE + Número comprobante
   - ❌ **Rechazada**: Código error + mensaje AFIP
   - ⏳ **Indeterminada**: Timeout → reintentar

---

## 10. Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `ARCA_NOT_CONFIGURED` | No guardaste cert+key | Completar ambos campos en Negocio > ARCA |
| `BUSINESS_MISSING_TAX_ID` | Falta CUIT | Poner CUIT de 11 dígitos |
| `BRANCH_MISSING_SALES_POINT` | Sucursal sin punto de venta | Editar sucursal, setear salesPoint |
| `CUSTOMER_MISSING_FISCAL_ID` | Cliente sin CUIT/DNI | Editar cliente, agregar CUIT o DNI |
| `INVALID_ISSUER_CONDITION` | Condición IVA mal escrita | Copiar valor exacto de la lista |
| `ARCA_TIMEOUT` | AFIP no responde | Reintentar (es idempotente por saleId) |
| `ENCRYPTION_ERROR` | ARCA_MASTER_KEY cambiada | Verificar .env coincide con BD |

---

## 11. Variables de Entorno Requeridas

Archivo `apps/api/.env`:

```bash
# Clave maestra para cifrar PEMs (64 chars hex)
# DEV ONLY - usar valor fijo. PROD: generar con crypto.randomBytes(32)
ARCA_MASTER_KEY=0000000000000000000000000000000000000000000000000000000000000000

# Base de datos PostgreSQL
DATABASE_URL=postgresql://user:pass@localhost:5432/template

# Auth
BETTER_AUTH_SECRET=tu-secret-largo-aqui
```

---

## 12. URLs de Servicios ARCA (para firewall / proxy)

| Ambiente | WSAA (Autenticación) | WSFEv1 (Facturación) | WSASS (Portal homologación) |
|----------|---------------------|---------------------|---------------------------|
| Homologación | `https://wsaahomo.afip.gov.ar/ws/services/LoginCms` | `https://wswhomo.afip.gov.ar/wsfev1/service.asmx` | `https://wsass-homo.afip.gov.ar` |
| Producción | `https://wsaa.afip.gov.ar/ws/services/LoginCms` | `https://servicios1.afip.gov.ar/wsfev1/service.asmx` | N/A |

---

## Referencias

- **Portal ARCA Factura Electrónica**: https://www.afip.gob.ar/fe/
- **Entorno de prueba (Ayuda)**: https://www.afip.gob.ar/fe/ayuda/entorno-prueba.asp
- **Homologación externa (manuales)**: https://www.afip.gob.ar/fe/ayuda/homologacion_externa.asp
- **WSASS (Autoservicio homologación)**: https://wsass-homo.afip.gov.ar/wsass/portal/main.aspx
- **SDK usado**: `@arcasdk/core` — https://github.com/ralcorta/arcasdk
- **Documento de testing completo**: `docs/TESTING_ARCA.md`