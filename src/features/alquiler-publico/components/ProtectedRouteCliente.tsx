import { Navigate, useLocation } from 'react-router-dom';
import { useAuthClienteStore, selectIsAuthenticated } from '@/store/authCliente.store';

interface ProtectedRouteClienteProps {
  children: React.ReactNode;
}

/**
 * Protege rutas B2C que requieren autenticacion de cliente.
 * Sin verificacion de roles (no aplica para B2C).
 * Redirige a /login con param redirect= para volver tras autenticarse.
 */
export function ProtectedRouteCliente({ children }: ProtectedRouteClienteProps) {
  const isAuthenticated = useAuthClienteStore(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(fullPath)}`} replace />;
  }

  return <>{children}</>;
}
