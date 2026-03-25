import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store';
import { usePermissions } from '@/hooks';
import { UserRole } from '@/shared/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles específicos requeridos (opcional, usa matriz de ROUTE_ACCESS si no se especifica) */
  requiredRoles?: UserRole[];
}

/**
 * Protege rutas autenticadas.
 * Debe tolerar tanto contexto organizacional como contexto personal.
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const { canAccessRoute, role } = usePermissions();
  const location = useLocation();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && role) {
    const hasRequiredRole = requiredRoles.includes(role);
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-text mb-2">{t('routes.accessDenied')}</h1>
            <p className="text-text-muted mb-4">
              {t('routes.accessDeniedDescription')}
            </p>
            <p className="text-sm text-text-muted">
              {t('routes.requiredRole', { roles: requiredRoles.join(' o ') })}
            </p>
          </div>
        </div>
      );
    }
  }

  if (!canAccessRoute(location.pathname)) {
    const target = location.pathname === '/' ? '/login' : '/';
    return <Navigate to={target} replace state={{ from: location, unauthorized: true }} />;
  }

  return <>{children}</>;
}
