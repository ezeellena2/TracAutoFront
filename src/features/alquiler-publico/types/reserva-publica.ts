/**
 * Tipos para crear reserva desde la API publica B2C
 * Alineados con CreateReservaPublicaCommand del backend
 */

// Request para crear reserva publica — POST /api/public/v1/alquiler/reservas
export interface CreateReservaPublicaRequest {
  // Datos del cliente
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  tipoDocumento: number;
  numeroDocumento: string;
  fechaNacimiento?: string;
  numeroLicenciaConducir?: string;
  vencimientoLicencia?: string;

  // Datos de la reserva
  vehiculoAlquilerId?: string;
  categoriaAlquiler?: number;
  sucursalRecogidaId: string;
  sucursalDevolucionId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  recargosSeleccionadosIds: string[];
  coberturasSeleccionadasIds: string[];
  codigoPromocion?: string;
  notas?: string;

  // Idempotencia
  claveIdempotencia?: string;
}

// Form state para datos personales (paso 1 del wizard)
export interface DatosPersonalesForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipoDocumento: number | '';
  numeroDocumento: string;
  fechaNacimiento: string;
  numeroLicenciaConducir: string;
  vencimientoLicencia: string;
}

export const DATOS_PERSONALES_INITIAL: DatosPersonalesForm = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipoDocumento: '',
  numeroDocumento: '',
  fechaNacimiento: '',
  numeroLicenciaConducir: '',
  vencimientoLicencia: '',
};
