/**
 * Hook centralizado para verificar permisos del usuario actual
 */

import { useCallback, useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Permission, PERMISSIONS_BY_ROLE, ROUTE_ACCESS } from '@/config/permissions';
import { UserRole } from '@/shared/types';

interface UsePermissionsReturn {
  /** Verifica si el usuario tiene un permiso específico */
  can: (permission: Permission) => boolean;
  /** Verifica si el usuario puede acceder a una ruta */
  canAccessRoute: (route: string) => boolean;
  /** Rol actual del usuario */
  role: UserRole | null;
  /** Shortcuts para verificar rol */
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isOperador: boolean;
  isAnalista: boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuthStore();
  const role = user?.rol ?? null;

  const permissions = useMemo(() => {
    if (!role) return [];
    return PERMISSIONS_BY_ROLE[role] ?? [];
  }, [role]);

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!role) return false;
      return permissions.includes(permission);
    },
    [role, permissions]
  );

  // FIX H-F4: Usar matchPath de react-router-dom para soportar rutas dinamicas
  // (ej. /alquileres/reservas/:id, /scoring/conductores/:id).
  // Antes se usaba startsWith que no matcheaba parametros de ruta correctamente.
  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!role) return false;

      // Buscar la mejor coincidencia usando matchPath (soporta :param)
      // Ordenar por longitud descendente para priorizar rutas mas especificas
      const patterns = Object.keys(ROUTE_ACCESS).sort((a, b) => b.length - a.length);

      for (const pattern of patterns) {
        if (matchPath({ path: pattern, end: true }, route)) {
          return ROUTE_ACCESS[pattern].includes(role);
        }
      }

      return false; // Denegar rutas desconocidas
    },
    [role]
  );

  return {
    can,
    canAccessRoute,
    role,
    isSuperAdmin: role === 'SuperAdmin',
    isAdmin: role === 'Admin' || role === 'SuperAdmin',
    isOperador: role === 'Operador',
    isAnalista: role === 'Analista',
  };
}
