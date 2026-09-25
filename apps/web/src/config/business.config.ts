// Único archivo pensado para editar al adaptar el template a un rubro nuevo.
// No debería hacer falta tocar lógica de módulos para cambiar de rubro — solo esto.
//
// Para cambiar la PALETA DE COLORES del cliente, editá `src/theme/palette.css`.
// Para cambiar terminología, módulos habilitados, o nav, editá este archivo.
import type { Permission } from '@template/shared';

export interface NavEntry {
  to: string;
  label: string;
  // Presente sólo para los módulos de ejemplo: gatea la entrada de nav (y su ruta
  // en App.tsx) contra el flag correspondiente en enabledModules. Ausente = siempre
  // visible (módulos genéricos: customers, team, business, branches).
  moduleKey?: keyof BusinessConfig['enabledModules'];
  // Permiso requerido para ver esta entrada de navegación. Si no tiene permiso,
  // la entrada no se renderiza en el sidebar.
  permission?: Permission;
}

export interface BusinessConfig {
  appName: string;
  terminology: {
    item: string; // ej: "Producto", "Corte", "Repuesto"
    itemPlural: string;
    branch: string; // ej: "Sucursal", "Local"
    branchPlural: string;
  };
  enabledModules: {
    purchases: boolean;
    sales: boolean;
    costs: boolean;
    financials: boolean;
    metrics: boolean;
    catalog: boolean;
  };
  nav: NavEntry[];
}

const terminology = {
  item: 'Producto',
  itemPlural: 'Productos',
  branch: 'Sucursal',
  branchPlural: 'Sucursales',
};

const enabledModules = {
  purchases: true,
  sales: true,
  costs: true,
  financials: true,
  metrics: true,
  catalog: true,
};

const nav: NavEntry[] = [
  { to: '/', label: 'Métricas', moduleKey: 'metrics', permission: 'metrics:read' },
  { to: '/items', label: terminology.itemPlural, permission: 'items:read' },
  { to: '/purchases', label: 'Compras', moduleKey: 'purchases', permission: 'purchases:read' },
  { to: '/sales', label: 'Ventas', moduleKey: 'sales', permission: 'sales:read' },
  { to: '/costs', label: 'Gastos', moduleKey: 'costs', permission: 'costs:read' },
  { to: '/financials', label: 'Financiero', moduleKey: 'financials', permission: 'financials:read' },
  { to: '/suppliers', label: 'Proveedores', permission: 'suppliers:read' },
  { to: '/customers', label: 'Clientes', permission: 'customers:read' },
  { to: '/team', label: 'Equipo', permission: 'team:read' },
  { to: '/business', label: 'Negocio', permission: 'business:read' },
  { to: '/branches', label: terminology.branchPlural, permission: 'branches:read' },
];

export const businessConfig: BusinessConfig = {
  appName: 'Business Admin Template',
  terminology,
  enabledModules,
  nav,
};
