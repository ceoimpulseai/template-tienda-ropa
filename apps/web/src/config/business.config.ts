// Único archivo pensado para editar al adaptar el template a un rubro nuevo.
// No debería hacer falta tocar lógica de módulos para cambiar de rubro — solo esto.
//
// Para cambiar la PALETA DE COLORES del cliente, editá `src/theme/palette.css`.
// Para cambiar terminología, módulos habilitados, o nav, editá este archivo.
export interface NavEntry {
  to: string;
  label: string;
  // Presente sólo para los módulos de ejemplo: gatea la entrada de nav (y su ruta
  // en App.tsx) contra el flag correspondiente en enabledModules. Ausente = siempre
  // visible (módulos genéricos: customers, team, business, branches).
  moduleKey?: keyof BusinessConfig['enabledModules'];
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
  metrics: true,
  catalog: true,
};

const nav: NavEntry[] = [
  { to: '/', label: 'Métricas', moduleKey: 'metrics' },
  { to: '/items', label: terminology.itemPlural },
  { to: '/purchases', label: 'Compras', moduleKey: 'purchases' },
  { to: '/sales', label: 'Ventas', moduleKey: 'sales' },
  { to: '/costs', label: 'Gastos', moduleKey: 'costs' },
  { to: '/suppliers', label: 'Proveedores' },
  { to: '/customers', label: 'Clientes' },
  { to: '/team', label: 'Equipo' },
  { to: '/business', label: 'Negocio' },
  { to: '/branches', label: terminology.branchPlural },
];

export const businessConfig: BusinessConfig = {
  appName: 'Business Admin Template',
  terminology,
  enabledModules,
  nav,
};
