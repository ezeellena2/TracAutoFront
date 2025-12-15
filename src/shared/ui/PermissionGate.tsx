/**
 * Componente que renderiza children solo si el usuario tiene el permiso requerido
 * Uso: <PermissionGate permission="usuarios:invitar"><Button>Invitar</Button></PermissionGate>
 */

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/config/permissions';

interface PermissionGateProps {
  /** Permiso requerido para mostrar el contenido */
  permission: Permission;
  /** Contenido a mostrar si tiene permiso */
  children: ReactNode;
  /** 
   * Contenido alternativo si NO tiene permiso
   * - undefined/null = ocultar completamente
   * - ReactNode = mostrar fallback (ej: botón deshabilitado)
   */
  fallback?: ReactNode;
}

export function PermissionGate({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGateProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Variante que deshabilita el children en vez de ocultarlo
 * Clona el elemento hijo y le agrega disabled=true
 */
interface DisabledGateProps {
  permission: Permission;
  children: ReactNode;
  /** Mensaje tooltip cuando está deshabilitado */
  disabledMessage?: string;
}

export function DisabledGate({ 
  permission, 
  children,
  disabledMessage = 'No tienes permisos para esta acción'
}: DisabledGateProps) {
  const { can } = usePermissions();
  const hasPermission = can(permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  // Envolver en span con tooltip y deshabilitar interacción
  return (
    <span 
      className="inline-block cursor-not-allowed opacity-50" 
      title={disabledMessage}
    >
      <span className="pointer-events-none">
        {children}
      </span>
    </span>
  );
}
