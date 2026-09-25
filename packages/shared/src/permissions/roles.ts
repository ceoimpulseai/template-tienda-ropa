import { Permission, getAllPermissions } from './permissions.js';
import { type Role } from '../schemas/user.js';

export const ROLES: Role[] = ['admin', 'manager', 'operator', 'viewer'];

export function isValidRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

export const ROLE_PERMISSIONS: Record<Exclude<Role, 'admin'>, Permission[]> = {
  manager: [
    'business:read',
    'branches:read',
    'branches:create',
    'team:read',
    'items:read',
    'items:create',
    'items:update',
    'customers:read',
    'customers:create',
    'suppliers:read',
    'suppliers:create',
    'suppliers:update',
    'purchases:read',
    'purchases:create',
    'sales:read',
    'sales:create',
    'costs:read',
    'costs:create',
    'financials:read',
    'metrics:read',
  ],
  operator: [
    'items:read',
    'items:create',
    'customers:read',
    'customers:create',
    'suppliers:read',
    'suppliers:create',
    'purchases:read',
    'purchases:create',
    'sales:read',
    'sales:create',
    'costs:read',
    'costs:create',
    'metrics:read',
  ],
  viewer: [
    'items:read',
    'customers:read',
    'suppliers:read',
    'purchases:read',
    'sales:read',
    'costs:read',
    'metrics:read',
  ],
};

export function getPermissionsForRole(role: Role): Permission[] {
  if (role === 'admin') {
    return getAllPermissions();
  }
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  operator: 'Operador',
  viewer: 'Consulta',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Acceso completo a todo el sistema',
  manager: 'Gestiona operaciones, no configura negocio ni equipo',
  operator: 'Operaciones diarias: ventas, compras, stock',
  viewer: 'Solo lectura en módulos operativos',
};