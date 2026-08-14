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
npx @better-auth/cli migrate --config apps/api/src/config/auth.ts   # tablas propias de better-auth
npm run dev:api                # terminal 1
npm run dev:web                # terminal 2
```

`npm run migrate` sólo aplica las migraciones del dominio (`businesses`, `branches`,
`business_members`, etc.). better-auth mantiene sus propias tablas (`user`, `session`,
`account`, `verification`) vía un pool Postgres separado y necesita su propio comando
de migración — sin correrlo, el registro/login falla con `relation "user" does not exist`.

`apps/web` corre en `http://localhost:5173` y proxea `/api` hacia `apps/api`
(`http://localhost:4000`). Copiá `apps/api/.env.example` a `apps/api/.env` antes de
levantar el server.

## Estructura

```
apps/
  api/src/modules/<dominio>/   # routes + controller + service + model (+ tests)
  web/src/modules/<dominio>/   # componentes + hooks por dominio
  web/src/ui/                  # primitivos de diseño (Button, Card, Input, Modal, Badge, Table)
  web/src/theme/                # design tokens (CSS custom properties) + ThemeContext
packages/shared/               # tipos y schemas Zod compartidos
```

Módulos genéricos (no deberían necesitar cambios entre rubros): `auth`, `team`,
`business`, `branches`.

Módulos de ejemplo (marcados con `// EJEMPLO` en cada archivo): `purchases`, `sales`,
`costs`, `metrics`. Usan una entidad genérica `Item` — son el punto de partida a
reemplazar por la lógica real del rubro.

## Cómo adaptar este template a un rubro nuevo

1. Editar `apps/web/src/config/business.config.ts`: nombre de la app, terminología
   (ej. "Producto" → "Corte"), módulos habilitados, color de marca.
2. Reescribir los módulos de ejemplo (`purchases`, `sales`, `costs`, `metrics`) en
   `apps/api/src/modules/` y `apps/web/src/modules/` con las entidades reales del
   rubro, siguiendo el mismo patrón `route → controller → service → model` +
   schema Zod en `packages/shared`.
3. No debería hacer falta tocar `auth`, `team`, `business`, `branches`, ni los
   primitivos de `apps/web/src/ui/`, ni el sistema de temas.

## Testing

Vitest en los 3 packages (`npm test` en la raíz corre los tres). `apps/api` usa
SQLite in-memory + supertest para tests de integración de rutas (con un bypass de
auth solo-test vía header `X-Test-User-Id`, ver `apps/api/src/middleware/requireAuth.ts`).
`apps/web` usa React Testing Library + msw.

## CI

`.github/workflows/ci.yml` corre lint, typecheck y test en cada push/PR.
