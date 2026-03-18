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
  | 'alquileres:reportes'
  // Scoring
  | 'scoring:ver'
  | 'scoring:configurar'
  // Reglas de Alerta
  | 'alertas:ver'
  | 'alertas:gestionar'
  // Billing / Suscripción
  | 'billing:ver'
  | 'billing:gestionar'
  // Admin (SuperAdmin only)
  | 'admin:panel';

/**
 * Matriz de permisos por rol
 * SuperAdmin: acceso total + panel de administración del sistema
 * Admin: acceso total a su organización
 * Operador: gestión operativa (vehículos, dispositivos)
 * Analista: solo lectura
 */
export const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  SuperAdmin: [
    // Admin panel
    'admin:panel',
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
    // Scoring
    'scoring:ver',
    'scoring:configurar',
    // Reglas de Alerta
    'alertas:ver',
    'alertas:gestionar',
    // Billing
    'billing:ver',
    'billing:gestionar',
  ],

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
    // Scoring
    'scoring:ver',
    'scoring:configurar',
    // Reglas de Alerta
    'alertas:ver',
    'alertas:gestionar',
    // Billing
    'billing:ver',
    'billing:gestionar',
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
    // Scoring (solo lectura)
    'scoring:ver',
    // Reglas de Alerta
    'alertas:ver',
    'alertas:gestionar',
    // Billing (solo lectura)
    'billing:ver',
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
    // Scoring (solo lectura)
    'scoring:ver',
    // Reglas de Alerta (solo lectura)
    'alertas:ver',
    // Billing (solo lectura)
    'billing:ver',
  ],
};

/**
 * Roles que pueden acceder a cada ruta protegida
 */
/**
 * SuperAdmin tiene acceso a todo lo que Admin + panel /admin.
 * Incluido en todas las rutas donde hay Admin para que no sea redirigido al dashboard.
 */
export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/dashboard': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/mapa': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/replay': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/vehiculos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/dispositivos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/eventos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/conductores': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/geozonas': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/geozonas/crear': ['SuperAdmin', 'Admin', 'Operador'],
  '/marketplace': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/importaciones': ['SuperAdmin', 'Admin', 'Operador'],
  '/notificaciones': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/usuarios': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/apariencia': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/preferencias': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/relaciones': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/solicitudes-cambio': ['SuperAdmin', 'Admin'],
  // Alquileres
  '/alquileres': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/flota': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/sucursales': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/tarifas': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/recargos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/coberturas': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/promociones': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/reservas': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/reservas/:id': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/clientes': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/contratos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/alquileres/reportes': ['SuperAdmin', 'Admin', 'Analista'],
  '/alquileres/configuracion': ['SuperAdmin', 'Admin'],
  // Tracking Links
  '/tracking-links': ['SuperAdmin', 'Admin', 'Operador'],
  // Widgets
  '/widgets': ['SuperAdmin', 'Admin'],
  // Preferencias de Notificacion
  '/preferencias-notificacion': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  // Resumen IA
  '/resumen-ia': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  // Geozonas (edicion y mapa)
  '/geozonas/:id/editar': ['SuperAdmin', 'Admin', 'Operador'],
  '/geozonas/mapa': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  // Scoring
  '/scoring': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/scoring/conductores/:id': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/scoring/configuracion': ['SuperAdmin', 'Admin'],
  // Reglas de Alerta
  '/alertas/reglas': ['SuperAdmin', 'Admin', 'Operador'],
  // OBD2 Diagnostics
  '/diagnosticos-obd': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  // Billing / Suscripcion
  '/suscripcion': ['SuperAdmin', 'Admin'],
  // Admin panel (SuperAdmin only)
  '/admin': ['SuperAdmin'],
};
