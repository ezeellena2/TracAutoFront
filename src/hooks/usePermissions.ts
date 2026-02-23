/**
 * Hook centralizado para verificar permisos del usuario actual
 */

import { useCallback, useMemo } from 'react';
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

  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!role) return false;
      // Exact match first
      const exactMatch = ROUTE_ACCESS[route];
      if (exactMatch) return exactMatch.includes(role);
      // Prefix match: /geozonas/abc/editar hereda permisos de /geozonas
      const prefixMatch = Object.keys(ROUTE_ACCESS)
        .filter(key => route.startsWith(key + '/'))
        .sort((a, b) => b.length - a.length)[0];
      if (prefixMatch) return ROUTE_ACCESS[prefixMatch].includes(role);
      return false; // Deny unknown routes
    },
    [role]
  );

  return {
    can,
    canAccessRoute,
    role,
    isAdmin: role === 'Admin',
    isOperador: role === 'Operador',
    isAnalista: role === 'Analista',
  };
}
