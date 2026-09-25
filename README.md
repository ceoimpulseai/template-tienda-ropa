# Business Admin Template

Template reutilizable para apps de administración de negocio (personal, información
del negocio, sucursales, compras, ventas, gastos fijos/variables, métricas, tema
claro/oscuro). Pensado para arrancar un proyecto nuevo por rubro sin reescribir lo
genérico cada vez.

## Stack

- **apps/api**: Express 4 + TypeScript + Sequelize (Postgres en prod, SQLite como
  fallback de desarrollo) + better-auth + Zod + migraciones con Umzug.
- **apps/web**: React 19 + Vite 6 + React Router 7 + Tailwind v4 + Context API.
- **packages/shared**: tipos y schemas Zod compartidos entre api y web.

Monorepo con npm workspaces.

## Levantar el proyecto

```bash
npm install
docker compose up -d          # Postgres local (requerido por better-auth)
npm run migrate               # aplica las migraciones del dominio (Umzug) en apps/api
npm run migrate:auth          # tablas propias de better-auth
npm run dev:api                # terminal 1
npm run dev:web                # terminal 2
```

### Envío de emails (restablecer contraseña)

`apps/api/src/lib/email.ts` es el único punto de envío de mails (nodemailer). Sin
`SMTP_HOST` configurado, en dev usa una cuenta descartable de Ethereal (gratis, sin
signup) y loguea un link de preview en la consola de `apps/api` — no llega a una
bandeja real. Para producción, seteá `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
`SMTP_PASSWORD`, `SMTP_FROM` con cualquier proveedor SMTP (Gmail con app password,
Brevo, SES, etc.).

`npm run migrate` sólo aplica las migraciones del dominio (`businesses`, `branches`,
`business_members`, etc.). better-auth mantiene sus propias tablas (`user`, `session`,
`account`, `verification`) vía un pool Postgres separado y necesita su propio comando
de migración — sin correrlo, el registro/login falla con `relation "user" does not exist`.

`apps/web` corre en `http://localhost:3000` y proxea `/api` hacia `apps/api`
(`http://localhost:4000`). Copiá `apps/api/.env.example` a `apps/api/.env` antes de
levantar el server.

## Estructura

```
apps/
  api/src/modules/<dominio>/         # routes + controller + service + model (+ tests)
  api/src/modules/_example/<dominio>/ # módulos de ejemplo (ver abajo)
  web/src/modules/<dominio>/         # componentes + hooks por dominio
  web/src/modules/_example/<dominio>/ # módulos de ejemplo (ver abajo)
  web/src/ui/                  # primitivos de diseño (Button, Card, Input, Modal, Badge, Table)
  web/src/theme/                # design tokens (CSS custom properties) + ThemeContext
packages/shared/               # tipos y schemas Zod compartidos
```

Módulos genéricos (no deberían necesitar cambios entre rubros), en
`apps/api/src/modules/` y `apps/web/src/modules/`: `auth`, `team`, `business`,
`branches`, `customers`, `items`, `catalog`.

Módulos de ejemplo (marcados con `// EJEMPLO` en cada archivo), aislados en
`apps/api/src/modules/_example/` y `apps/web/src/modules/_example/`: `purchases`,
`sales`, `costs`, `metrics`. Dependen de la entidad genérica `Item` (módulo
`items`, no `_example/`) — son el punto de partida a reemplazar por la lógica
real del rubro. Al adaptar el template a un rubro nuevo, todo lo que hay que
borrar/reescribir vive dentro de `_example/`; `items` se mantiene.

## Catálogo público

El módulo `catalog` expone un storefront público de solo lectura en
`/tienda/:businessId` — sin autenticación, sin búsqueda/paginación, sin
carrito/checkout real. La URL se deriva automáticamente del `id` (UUID) del
negocio, no de un valor elegido por el usuario. Muestra nombre y precio de los
items con `visibleInCatalog: true` y stock disponible del negocio dueño del
`id`. El "carrito" es sólo estado local en el navegador que arma un link de
WhatsApp (`wa.me`) con el pedido como texto — no hay modelo de orden ni pago.

Un campo nuevo en `Business` habilita esto: `catalogWhatsapp` (número para el
botón de pedido). Se edita desde `/business` (`BusinessSettings.tsx`), que
también muestra la URL pública de solo lectura. Cada `Item` tiene
`visibleInCatalog` (default `false`, opt-in) editable desde `/items`.

## Cómo adaptar este template a un rubro nuevo

1. Editar `apps/web/src/config/business.config.ts`: nombre de la app, terminología
   (ej. "Producto" → "Corte"), módulos habilitados, nav, color de marca.
2. Reescribir los módulos de ejemplo (`purchases`, `sales`, `costs`, `metrics`) en
   `apps/api/src/modules/_example/` y `apps/web/src/modules/_example/` con las
   entidades reales del rubro, siguiendo el mismo patrón
   `route → controller → service → model` + schema Zod en `packages/shared`.
3. No debería hacer falta tocar `auth`, `team`, `business`, `branches`,
   `customers`, `items`, `catalog`, ni los primitivos de `apps/web/src/ui/`, ni
   el sistema de temas.

## Testing

Vitest en los 3 packages (`npm test` en la raíz corre los tres). `apps/api` usa
SQLite in-memory + supertest para tests de integración de rutas (con un bypass de
auth solo-test vía header `X-Test-User-Id`, ver `apps/api/src/middleware/requireAuth.ts`).
`apps/web` usa React Testing Library + msw.

## CI

`.github/workflows/ci.yml` corre lint, typecheck y test en cada push/PR.
