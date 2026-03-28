import { UserRole } from '@/shared/types';

export type Permission =
  | 'dashboard:ver'
  | 'vehiculos:ver'
  | 'vehiculos:crear'
  | 'vehiculos:editar'
  | 'vehiculos:eliminar'
  | 'dispositivos:ver'
  | 'dispositivos:asignar'
  | 'dispositivos:configurar'
  | 'usuarios:ver'
  | 'usuarios:invitar'
  | 'usuarios:editar'
  | 'usuarios:eliminar'
  | 'conductores:ver'
  | 'conductores:crear'
  | 'conductores:editar'
  | 'conductores:eliminar'
  | 'geofences:ver'
  | 'geofences:crear'
  | 'geofences:editar'
  | 'geofences:eliminar'
  | 'organizacion:editar'
  | 'suscripciones:ver'
  | 'suscripciones:gestionar';

export const PERMISSIONS_BY_ROLE: Record<UserRole, Permission[]> = {
  SuperAdmin: [
    'dashboard:ver',
    'vehiculos:ver',
    'vehiculos:crear',
    'vehiculos:editar',
    'vehiculos:eliminar',
    'dispositivos:ver',
    'dispositivos:asignar',
    'dispositivos:configurar',
    'usuarios:ver',
    'usuarios:invitar',
    'usuarios:editar',
    'usuarios:eliminar',
    'conductores:ver',
    'conductores:crear',
    'conductores:editar',
    'conductores:eliminar',
    'geofences:ver',
    'geofences:crear',
    'geofences:editar',
    'geofences:eliminar',
    'organizacion:editar',
    'suscripciones:ver',
    'suscripciones:gestionar',
  ],
  Admin: [
    'dashboard:ver',
    'vehiculos:ver',
    'vehiculos:crear',
    'vehiculos:editar',
    'vehiculos:eliminar',
    'dispositivos:ver',
    'dispositivos:asignar',
    'dispositivos:configurar',
    'usuarios:ver',
    'usuarios:invitar',
    'usuarios:editar',
    'usuarios:eliminar',
    'conductores:ver',
    'conductores:crear',
    'conductores:editar',
    'conductores:eliminar',
    'geofences:ver',
    'geofences:crear',
    'geofences:editar',
    'geofences:eliminar',
    'organizacion:editar',
    'suscripciones:ver',
    'suscripciones:gestionar',
  ],
  Operador: [
    'dashboard:ver',
    'vehiculos:ver',
    'vehiculos:crear',
    'vehiculos:editar',
    'dispositivos:ver',
    'dispositivos:asignar',
    'conductores:ver',
    'conductores:crear',
    'conductores:editar',
    'geofences:ver',
    'geofences:crear',
    'geofences:editar',
    'suscripciones:ver',
  ],
  Analista: [
    'dashboard:ver',
    'vehiculos:ver',
    'dispositivos:ver',
    'conductores:ver',
    'geofences:ver',
    'suscripciones:ver',
  ],
};

export const ROUTE_ACCESS: Record<string, UserRole[]> = {
  '/': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/dashboard': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/mapa': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/vehiculos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/dispositivos': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/conductores': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/geozonas': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/geozonas/crear': ['SuperAdmin', 'Admin', 'Operador'],
  '/geozonas/:id/editar': ['SuperAdmin', 'Admin', 'Operador'],
  '/geozonas/mapa': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/importaciones': ['SuperAdmin', 'Admin', 'Operador'],
  '/notificaciones': ['SuperAdmin', 'Admin', 'Operador', 'Analista'],
  '/usuarios': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/apariencia': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/preferencias': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/relaciones': ['SuperAdmin', 'Admin'],
  '/configuracion/empresa/solicitudes-cambio': ['SuperAdmin', 'Admin'],
  '/suscripcion': ['SuperAdmin', 'Admin'],
};
