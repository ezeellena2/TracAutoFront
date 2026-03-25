/**
 * Hook centralizado para verificar permisos del usuario actual
 */

import { useCallback, useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { Permission, PERMISSIONS_BY_ROLE, ROUTE_ACCESS } from '@/config/permissions';
import { UserRole } from '@/shared/types';
import { ModuloSistema } from '@/shared/types/api';

interface UsePermissionsReturn {
  /** Verifica si el usuario tiene un permiso especÃ­fico */
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

const PERSONAL_ALLOWED_PERMISSIONS: Permission[] = [
  'dashboard:ver',
  'suscripciones:ver',
];

const PERSONAL_FLOTA_PERMISSIONS: Permission[] = [
  'vehiculos:ver',
  'vehiculos:crear',
  'vehiculos:editar',
  'vehiculos:eliminar',
  'dispositivos:ver',
  'dispositivos:asignar',
  'dispositivos:configurar',
  'conductores:ver',
  'conductores:crear',
  'conductores:editar',
  'conductores:eliminar',
  'geofences:ver',
  'geofences:crear',
  'geofences:editar',
  'geofences:eliminar',
];

const PERSONAL_ROUTE_ACCESS = [
  '/',
  '/dashboard',
  '/mapa',
  '/vehiculos',
  '/dispositivos',
  '/conductores',
  '/geozonas',
  '/geozonas/crear',
  '/geozonas/:id/editar',
  '/geozonas/mapa',
  '/suscripcion',
];

export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuthStore();
  const role = user?.rol ?? null;
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  const activeModules = user?.contextoActivo?.modulosActivos ?? [];

  const permissions = useMemo(() => {
    if (isPersonalContext) {
      const personalPermissions = [...PERSONAL_ALLOWED_PERMISSIONS];
      if (activeModules.includes(ModuloSistema.Flota)) {
        personalPermissions.push(...PERSONAL_FLOTA_PERMISSIONS);
      }
      return personalPermissions;
    }
    if (!role) return [];
    return PERMISSIONS_BY_ROLE[role] ?? [];
  }, [activeModules, isPersonalContext, role]);

  const can = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  // FIX H-F4: Usar matchPath de react-router-dom para soportar rutas dinamicas
  // (ej. /conductores/:id o /vehiculos/:id).
  // Antes se usaba startsWith que no matcheaba parametros de ruta correctamente.
  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (isPersonalContext) {
        return PERSONAL_ROUTE_ACCESS.some((pattern) =>
          matchPath({ path: pattern, end: true }, route)
        );
      }

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
    [isPersonalContext, role]
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

