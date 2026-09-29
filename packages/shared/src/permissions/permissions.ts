export const PERMISSIONS = [
  'business:read',
  'business:update',
  'branches:read',
  'branches:create',
  'branches:delete',
  'team:read',
  'team:invite',
  'team:remove',
  'items:read',
  'items:create',
  'items:update',
  'items:delete',
  'customers:read',
  'customers:create',
  'customers:delete',
  'suppliers:read',
  'suppliers:create',
  'suppliers:update',
  'suppliers:delete',
  'purchases:read',
  'purchases:create',
  'sales:read',
  'sales:create',
  'sales:update',
  'costs:read',
  'costs:create',
  'costs:delete',
  'financials:read',
  'metrics:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSIONS_SET = new Set<Permission>(PERMISSIONS);

export function isValidPermission(value: string): value is Permission {
  return PERMISSIONS_SET.has(value as Permission);
}

export function getAllPermissions(): Permission[] {
  return PERMISSIONS.slice();
}

export const PERMISSION_GROUPS = {
  business: ['business:read', 'business:update'],
  branches: ['branches:read', 'branches:create', 'branches:delete'],
  team: ['team:read', 'team:invite', 'team:remove'],
  items: ['items:read', 'items:create', 'items:update', 'items:delete'],
  customers: ['customers:read', 'customers:create', 'customers:delete'],
  suppliers: ['suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete'],
  purchases: ['purchases:read', 'purchases:create'],
  sales: ['sales:read', 'sales:create'],
  costs: ['costs:read', 'costs:create', 'costs:delete'],
  financials: ['financials:read'],
  metrics: ['metrics:read'],
} as const;