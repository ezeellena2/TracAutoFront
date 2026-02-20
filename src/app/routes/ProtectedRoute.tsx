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
 * Componente que protege rutas que requieren autenticación y/o roles específicos
 * - Redirige a /login si el usuario no está autenticado
 * - Tras F5 el token no está en memoria; el interceptor hará refresh con cookie y rellenará el token
 * - Muestra "Acceso Denegado" si no tiene el rol requerido
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const { canAccessRoute, role } = usePermissions();
  const location = useLocation();
  const { t } = useTranslation();

  // 1. Verificar autenticación (no exigir token: tras F5 se obtiene vía refresh en la primera request)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Verificar roles específicos si se proporcionan
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

  // 3. Verificar acceso a ruta según matriz ROUTE_ACCESS
  if (!canAccessRoute(location.pathname)) {
    return <Navigate to="/" replace state={{ from: location, unauthorized: true }} />;
  }

  return <>{children}</>;
}

