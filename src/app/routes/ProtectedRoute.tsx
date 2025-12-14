import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Componente que protege rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 */
export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, token } = useAuthStore();
  const location = useLocation();

  // Verificar autenticación
  if (!isAuthenticated || !token) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si se especifican
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.rol);
    if (!hasRequiredRole) {
      // Usuario no tiene el rol requerido
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-text mb-2">Acceso Denegado</h1>
            <p className="text-text-muted mb-4">
              No tiene permisos para acceder a esta sección.
            </p>
            <p className="text-sm text-text-muted">
              Rol requerido: {requiredRoles.join(' o ')}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
