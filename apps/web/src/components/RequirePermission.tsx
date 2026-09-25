import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCan } from '../hooks/useCan';
import type { Permission } from '@template/shared';

interface RequirePermissionProps {
  permission: Permission;
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { data, isPending } = useAuth();
  const can = useCan();

  if (isPending) return <div className="p-6 text-text-muted">Cargando…</div>;
  if (!data) return <Navigate to="/login" replace />;
  if (!can(permission)) return <Navigate to="/" replace />;

  return <Outlet />;
}