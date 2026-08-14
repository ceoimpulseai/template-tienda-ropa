import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { data, isPending } = useAuth();

  if (isPending) return <div className="p-6 text-text-muted">Cargando…</div>;
  if (!data) return <Navigate to="/login" replace />;

  return <Outlet />;
}
