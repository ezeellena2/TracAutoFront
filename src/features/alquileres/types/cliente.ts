/**
 * Tipos para el modulo de Clientes de Alquiler
 * Alineados con los DTOs del backend (ClienteAlquilerDto, TipoDocumento)
 */

export enum TipoDocumento {
  DNI = 1,
  Pasaporte = 2,
  CUIT = 3,
  CedulaIdentidad = 4,
  Otro = 99,
}

export const TIPO_DOCUMENTO_VALUES = [
  TipoDocumento.DNI,
  TipoDocumento.Pasaporte,
  TipoDocumento.CUIT,
  TipoDocumento.CedulaIdentidad,
  TipoDocumento.Otro,
] as const;

export interface ClienteAlquilerDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  tipoDocumento: number;
  numeroDocumento: string;
  fechaNacimiento: string | null;
  ciudad: string | null;
  provincia: string | null;
  numeroLicenciaConducir: string | null;
  vencimientoLicencia: string | null;
  usuarioId: string | null;
  fechaRegistro: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CreateClienteAlquilerRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  tipoDocumento: number;
  numeroDocumento: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  numeroLicenciaConducir?: string;
  vencimientoLicencia?: string;
  notas?: string;
}

// DTO resumido de reserva para historial del cliente
export interface ReservaResumenClienteDto {
  id: string;
  numeroReserva: string;
  estado: number;
  categoriaAlquiler: number;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  precioTotal: number;
  moneda: string;
  fechaCreacion: string;
}

// DTO detallado del cliente (GET /clientes/{id})
export interface ClienteAlquilerDetalleDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  tipoDocumento: number;
  numeroDocumento: string;
  fechaNacimiento: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  numeroLicenciaConducir: string | null;
  vencimientoLicencia: string | null;
  notas: string | null;
  stripeCustomerId: string | null;
  usuarioId: string | null;
  fechaRegistro: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  ultimasReservas: ReservaResumenClienteDto[];
  totalReservas: number;
}
