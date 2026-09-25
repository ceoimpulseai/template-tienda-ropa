import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { Permission } from '@template/shared';

export function useCan(): (permission: Permission) => boolean {
  const context = useContext(AuthContext);
  const permissions = context?.permissions ?? null;

  return (permission: Permission) => {
    if (!permissions) return false;
    return permissions.includes(permission);
  };
}