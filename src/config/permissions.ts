/**
 * Configuración de permisos por rol
 * RBAC estático - los permisos están hardcodeados por rol
 */

import { UserRole } from '@/shared/types';

/**
 * Permisos disponibles en el sistema
 * Formato: "modulo:accion"
 */
export type Permission =
  // Dashboard
  | 'dashboard:ver'
  // Vehículos
  | 'vehiculos:ver'
  | 'vehiculos:crear'
  | 'vehiculos:editar'
  | 'vehiculos:eliminar'
  // Dispositivos
  | 'dispositivos:ver'
  | 'dispositivos:asignar'
  | 'dispositivos:configurar'
  // Eventos
  | 'eventos:ver'
  | 'eventos:exportar'
  // Usuarios
  | 'usuarios:ver'
  | 'usuarios:invitar'
  | 'usuarios:editar'
  | 'usuarios:eliminar'
  // Organización
  | 'organizacion:editar';

/**
 * Matriz de permisos por rol
 * Admin: acceso total
 * Operador: gestión operativa (vehículos, dispositivos)
 * Analista: solo lectura
 */
export const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  Admin: [
    // Dashboard
    'dashboard:ver',
    // Vehículos
    'vehiculos:ver',
    'vehiculos:crear',
    'vehiculos:editar',
    'vehiculos:eliminar',
    // Dispositivos
    'dispositivos:ver',
    'dispositivos:asignar',
    'dispositivos:configurar',
    // Eventos
    'eventos:ver',
    'eventos:exportar',
    // Usuarios
    'usuarios:ver',
    'usuarios:invitar',
    'usuarios:editar',
    'usuarios:eliminar',
    // Organización
    'organizacion:editar',
  ],

  Operador: [
    // Dashboard
    'dashboard:ver',
    // Vehículos
    'vehiculos:ver',
    'vehiculos:crear',
    'vehiculos:editar',
    // Dispositivos
    'dispositivos:ver',
    'dispositivos:asignar',
    // Eventos
    'eventos:ver',
    'eventos:exportar',
  ],

  Analista: [
    // Dashboard
    'dashboard:ver',
    // Vehículos (solo lectura)
    'vehiculos:ver',
    // Dispositivos (solo lectura)
    'dispositivos:ver',
    // Eventos
    'eventos:ver',
    'eventos:exportar',
  ],
};

/**
 * Roles que pueden acceder a cada ruta protegida
 */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/usuarios': ['Admin'],
  '/vehiculos': ['Admin', 'Operador', 'Analista'],
  '/dispositivos': ['Admin', 'Operador', 'Analista'],
  '/eventos': ['Admin', 'Operador', 'Analista'],
  '/dashboard': ['Admin', 'Operador', 'Analista'],
  '/configuracion/empresa/apariencia': ['Admin'],
};
