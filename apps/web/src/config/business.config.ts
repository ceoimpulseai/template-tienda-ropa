// Único archivo pensado para editar al adaptar el template a un rubro nuevo.
// No debería hacer falta tocar lógica de módulos para cambiar de rubro — solo esto.
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
  };
  branding: {
    primaryColor: string; // debe coincidir con --color-primary en theme/tokens.css
  };
}

export const businessConfig: BusinessConfig = {
  appName: 'Business Admin Template',
  terminology: {
    item: 'Producto',
    itemPlural: 'Productos',
    branch: 'Sucursal',
    branchPlural: 'Sucursales',
  },
  enabledModules: {
    purchases: true,
    sales: true,
    costs: true,
    metrics: true,
  },
  branding: {
    primaryColor: '#2563eb',
  },
};
