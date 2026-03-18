export enum TipoAccesoTracking {
  SoloUbicacion = 1,
  UbicacionConRuta = 2,
  Completo = 3,
}

export interface LinkTrackingDto {
  id: string;
  token: string;
  url: string;
  nombre: string | null;
  vehiculoPatente: string;
  vehiculoNombre: string;
  fechaCreacion: string;
  fechaExpiracion: string;
  tipoAcceso: TipoAccesoTracking;
  accesosCount: number;
  maxAccesos: number | null;
  activo: boolean;
  estaExpirado: boolean;
}

export interface CrearLinkTrackingRequest {
  vehiculoId: string;
  nombre?: string;
  duracionMinutos?: number;
  tipoAcceso?: TipoAccesoTracking;
  maxAccesos?: number;
}

export interface CrearLinkTrackingResponse {
  id: string;
  token: string;
  url: string;
  fechaExpiracion: string;
  tipoAcceso: TipoAccesoTracking;
}

export interface ExtenderLinkTrackingRequest {
  minutosAdicionales: number;
}

export interface ExtenderLinkTrackingResponse {
  nuevaFechaExpiracion: string;
}

export interface PosicionPublicaDto {
  latitud: number;
  longitud: number;
  velocidad: number | null;
  rumbo: number | null;
  fechaUltimaPosicion: string;
  vehiculoNombre: string | null;
  vehiculoColor: string | null;
  tipoAcceso: TipoAccesoTracking;
  ruta: PuntoPosicionDto[] | null;
  organizacionNombre: string | null;
}

export interface PuntoPosicionDto {
  latitud: number;
  longitud: number;
  fecha: string;
  velocidad: number | null;
}
