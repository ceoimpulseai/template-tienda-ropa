import { useCan } from '../hooks/useCan';
import type { Permission } from '@template/shared';

interface CanProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, children, fallback = null }: CanProps) {
  const can = useCan();

  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

Can.I = ({ permission, children, fallback = null }: CanProps) => <Can permission={permission} children={children} fallback={fallback} />;