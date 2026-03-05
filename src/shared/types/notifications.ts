export enum TipoNotificacion {
  Info = 'Info',
  Success = 'Success',
  Warning = 'Warning',
  Error = 'Error',
  SystemAlert = 'SystemAlert',
}

export enum CategoriaNotificacion {
  Geofence = 'Geofence',
  Vehiculo = 'Vehiculo',
  Conductor = 'Conductor',
  Sistema = 'Sistema',
  Seguridad = 'Seguridad',
  Solicitud = 'Solicitud',
  Mantenimiento = 'Mantenimiento',
  Alquiler = 'Alquiler',
}

export enum NotificationAudienceType {
  UserDirect = 'UserDirect',
  RoleScoped = 'RoleScoped',
  OrgScoped = 'OrgScoped',
  SegmentScoped = 'SegmentScoped',
}

export interface NotificacionDto {
  id: string;
  templateKey?: string | null;
  params?: Record<string, unknown> | null;
  audienceType?: NotificationAudienceType | null;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  categoria: CategoriaNotificacion;
  fechaCreacion: string;
  fechaLectura?: string | null;
  leida: boolean;
  linkAccion?: string | null;
  metadata?: string | null;
  archivada: boolean;
  prioridadAlta?: boolean;
}

/**
 * @deprecated Use NotificacionDto instead
 */
export type NotificacionListItemDto = NotificacionDto;
