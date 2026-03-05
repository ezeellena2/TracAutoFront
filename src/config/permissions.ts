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
  // Conductores
  | 'conductores:ver'
  | 'conductores:crear'
  | 'conductores:editar'
  | 'conductores:eliminar'
  // Geofences
  | 'geofences:ver'
  | 'geofences:crear'
  | 'geofences:editar'
  | 'geofences:eliminar'
  // Organización
  | 'organizacion:editar'
  // Alquileres
  | 'alquileres:ver'
  | 'alquileres:crear'
  | 'alquileres:editar'
  | 'alquileres:eliminar'
  | 'alquileres:configurar'
  | 'alquileres:reportes';

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
    // Conductores
    'conductores:ver',
    'conductores:crear',
    'conductores:editar',
    'conductores:eliminar',
    // Geofences
    'geofences:ver',
    'geofences:crear',
    'geofences:editar',
    'geofences:eliminar',
    // Organización
    'organizacion:editar',
    // Alquileres
    'alquileres:ver',
    'alquileres:crear',
    'alquileres:editar',
    'alquileres:eliminar',
    'alquileres:configurar',
    'alquileres:reportes',
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
    // Conductores
    'conductores:ver',
    'conductores:crear',
    'conductores:editar',
    // Geofences
    'geofences:ver',
    'geofences:crear',
    'geofences:editar',
    // Alquileres (operativo, sin config ni eliminar)
    'alquileres:ver',
    'alquileres:crear',
    'alquileres:editar',
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
    // Conductores (solo lectura)
    'conductores:ver',
    // Geofences (solo lectura)
    'geofences:ver',
    // Alquileres (solo lectura + reportes)
    'alquileres:ver',
    'alquileres:reportes',
  ],
};

/**
 * Roles que pueden acceder a cada ruta protegida
 */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/': ['Admin', 'Operador', 'Analista'],
  '/dashboard': ['Admin', 'Operador', 'Analista'],
  '/mapa': ['Admin', 'Operador', 'Analista'],
  '/replay': ['Admin', 'Operador', 'Analista'],
  '/vehiculos': ['Admin', 'Operador', 'Analista'],
  '/dispositivos': ['Admin', 'Operador', 'Analista'],
  '/eventos': ['Admin', 'Operador', 'Analista'],
  '/conductores': ['Admin', 'Operador', 'Analista'],
  '/geozonas': ['Admin', 'Operador', 'Analista'],
  '/geozonas/crear': ['Admin', 'Operador'],
  '/marketplace': ['Admin', 'Operador', 'Analista'],
  '/importaciones': ['Admin', 'Operador'],
  '/notificaciones': ['Admin', 'Operador', 'Analista'],
  '/usuarios': ['Admin'],
  '/configuracion/empresa/apariencia': ['Admin'],
  '/configuracion/empresa/relaciones': ['Admin'],
  '/configuracion/empresa/solicitudes-cambio': ['Admin'],
  // Alquileres
  '/alquileres': ['Admin', 'Operador', 'Analista'],
  '/alquileres/flota': ['Admin', 'Operador', 'Analista'],
  '/alquileres/sucursales': ['Admin', 'Operador', 'Analista'],
  '/alquileres/tarifas': ['Admin', 'Operador', 'Analista'],
  '/alquileres/recargos': ['Admin', 'Operador', 'Analista'],
  '/alquileres/coberturas': ['Admin', 'Operador', 'Analista'],
  '/alquileres/promociones': ['Admin', 'Operador', 'Analista'],
  '/alquileres/reservas': ['Admin', 'Operador', 'Analista'],
  '/alquileres/reservas/:id': ['Admin', 'Operador', 'Analista'],
  '/alquileres/clientes': ['Admin', 'Operador', 'Analista'],
  '/alquileres/contratos': ['Admin', 'Operador', 'Analista'],
  '/alquileres/reportes': ['Admin', 'Analista'],
  '/alquileres/configuracion': ['Admin'],
};
