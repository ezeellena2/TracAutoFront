export enum CategoriaNotificacion {
  Geofence = 1,
  Vehiculo = 2,
  Conductor = 3,
  Sistema = 4,
  Seguridad = 5,
  Solicitud = 6,
  Mantenimiento = 7,
  Alquiler = 8,
}

export interface PreferenciasNotificacionDto {
  telefonoWhatsApp: string | null;
  telefonoVerificado: boolean;
  whatsAppHabilitado: boolean;
  smsHabilitado: boolean;
  emailHabilitado: boolean;
  categoriasWhatsApp: CategoriaNotificacion[] | null;
}

export interface ActualizarPreferenciasRequest {
  whatsAppHabilitado: boolean;
  emailHabilitado: boolean;
  categoriasWhatsApp?: CategoriaNotificacion[] | null;
}

export interface EnviarCodigoRequest {
  telefono: string;
}

export interface VerificarTelefonoRequest {
  telefono: string;
  codigo: string;
}
