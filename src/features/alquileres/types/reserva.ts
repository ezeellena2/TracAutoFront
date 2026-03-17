export enum EstadoReserva {
  Tentativa = 1,
  Confirmada = 2,
  EnCurso = 3,
  Completada = 4,
  Cancelada = 5,
  NoShow = 6,
}

export enum OrigenReserva {
  Web = 1,
  Telefono = 2,
  Presencial = 3,
  App = 4,
}

export interface ReservaAlquilerResumenDto {
  id: string;
  numeroReserva: string;
  estado: number;
  clienteNombreCompleto: string;
  categoriaAlquiler: number;
  vehiculoDescripcion: string | null;
  sucursalRecogida: string;
  sucursalDevolucion: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  precioTotal: number;
  moneda: string;
  fechaCreacion: string;
}

export interface ReservaCalendarioDto {
  id: string;
  numeroReserva: string;
  estado: number;
  clienteNombreCompleto: string;
  categoriaAlquiler: number;
  vehiculoDescripcion: string | null;
  vehiculoAlquilerId: string | null;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
}

export interface CancelarReservaRequest {
  reservaId: string;
  motivoCancelacion: string;
}

export interface NoShowReservaRequest {
  reservaId: string;
  notas?: string;
}

// =====================================================
// Enums adicionales (D6 â€” Detalle)
// =====================================================

export enum TipoPago {
  Senal = 1,
  PagoTotal = 2,
  Deposito = 3,
  RecargoPostDevolucion = 4,
  ReembolsoDeposito = 5,
  ReembolsoCancelacion = 6,
  PenalizacionNoShow = 7,
}

export enum MetodoPago {
  Tarjeta = 1,
  Efectivo = 2,
  Transferencia = 3,
  MercadoPago = 4,
}

export enum EstadoPago {
  Pendiente = 1,
  Procesando = 2,
  Completado = 3,
  Fallido = 4,
  Reembolsado = 5,
  ReembolsoParcial = 6,
}

export enum TipoInspeccion {
  CheckOut = 1,
  CheckIn = 2,
}

// Opciones de estado para inspecciones (check-out / check-in).
// Las claves se usan en i18n y como value de los selects.
// Los labels son strings fijos en espaÃ±ol para persistir consistentemente en la DB.
export const ESTADO_INSPECCION_KEYS = ['excelente', 'bueno', 'regular', 'malo', 'muyMalo'] as const;
export type EstadoInspeccionKey = typeof ESTADO_INSPECCION_KEYS[number];

export const ESTADO_INSPECCION_LABELS: Record<EstadoInspeccionKey, string> = {
  excelente: 'Excelente',
  bueno: 'Bueno',
  regular: 'Regular',
  malo: 'Malo',
  muyMalo: 'Muy malo',
};

// =====================================================
// DTOs del detalle de reserva
// =====================================================

export interface DetalleRecargoReservaDto {
  recargoAlquilerId: string;
  cantidad: number;
  precioAplicado: number;
}

export interface DetalleCoberturaReservaDto {
  coberturaAlquilerId: string;
  precioAplicado: number;
}

export interface DetallePagoReservaDto {
  id: string;
  tipoPago: number;
  monto: number;
  moneda: string;
  metodoPago: number;
  estadoPago: number;
  referenciaExterna: string | null;
  fechaPago: string;
}

export interface ReservaAlquilerDetalleDto {
  id: string;
  numeroReserva: string;
  estado: number;
  clienteNombreCompleto: string;
  clienteAlquilerId: string;
  categoriaAlquiler: number;
  vehiculoDescripcion: string | null;
  vehiculoAlquilerId: string | null;
  sucursalRecogida: string;
  sucursalRecogidaId: string;
  sucursalDevolucion: string;
  sucursalDevolucionId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  precioBase: number;
  totalRecargos: number;
  descuento: number;
  precioTotal: number;
  montoDeposito: number;
  moneda: string;
  promocionCodigo: string | null;
  origenReserva: number;
  notas: string | null;
  fechaCreacion: string;
  fechaCancelacion: string | null;
  motivoCancelacion: string | null;
  recargos: DetalleRecargoReservaDto[];
  coberturas: DetalleCoberturaReservaDto[];
  pagos: DetallePagoReservaDto[];
}

export interface CheckOutAlquilerDto {
  id: string;
  reservaAlquilerId: string;
  fechaHoraReal: string;
  kilometrajeInicial: number;
  nivelCombustible: number;
  estadoExterior: string;
  estadoInterior: string;
  observaciones: string | null;
  sucursalId: string;
  sucursalNombre: string;
  realizadoPorUsuarioId: string;
}

export interface CheckInAlquilerDto {
  id: string;
  reservaAlquilerId: string;
  fechaHoraReal: string;
  kilometrajeFinal: number;
  nivelCombustible: number;
  estadoExterior: string;
  estadoInterior: string;
  danosDetectados: boolean;
  descripcionDanos: string | null;
  recargoCombustible: number;
  recargoKmExcedente: number;
  recargoTardanza: number;
  recargoDanos: number | null;
  totalRecargosCheckIn: number;
  observaciones: string | null;
  sucursalId: string;
  sucursalNombre: string;
  realizadoPorUsuarioId: string;
}

export interface FotoInspeccionDto {
  id: string;
  url: string;
  descripcion: string | null;
  fechaCaptura: string;
  orden: number;
  tipoInspeccion: number;
}

export interface HistorialAuditoriaCambioDto {
  clave: string;
  valorAnterior: string | null;
  valorNuevo: string | null;
}

export interface HistorialAuditoriaDto {
  id: string;
  tipoEntidad: string;
  entidadId: string;
  fuente: string;
  accion: string;
  fechaEvento: string;
  actor: string | null;
  cambios: HistorialAuditoriaCambioDto[];
  fechaCreacion: string;
  creadoPor: string | null;
  fechaActualizacion: string;
  modificadoPor: string | null;
  estado: string | null;
}

// =====================================================
// Request types (D6 â€” mutations)
// =====================================================

export interface CreateCheckOutRequest {
  reservaId: string;
  kilometrajeInicial: number;
  nivelCombustible: number;
  estadoExterior: string;
  estadoInterior: string;
  observaciones?: string;
  sucursalId: string;
}

export interface CreateCheckInRequest {
  reservaId: string;
  kilometrajeFinal: number;
  nivelCombustible: number;
  estadoExterior: string;
  estadoInterior: string;
  danosDetectados: boolean;
  descripcionDanos?: string;
  recargoDanos?: number;
  observaciones?: string;
  sucursalId: string;
}

export interface RegistrarPagoManualRequest {
  reservaAlquilerId: string;
  tipoPago: number;
  monto: number;
  moneda: string;
  metodoPago: number;
  referenciaExterna?: string;
  claveIdempotencia: string;
}

export interface CreatePaymentIntentRequest {
  reservaId: string;
  tipoPago: number;
  monto: number;
  moneda: string;
  claveIdempotencia: string;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface LiberarDepositoRequest {
  reservaId: string;
  monto?: number;
  notas?: string;
  claveIdempotencia: string;
}

export interface DeducirDepositoRequest {
  reservaId: string;
  monto: number;
  notas: string;
  claveIdempotencia: string;
}

export interface CreateReservaAlquilerRequest {
  clienteNombre: string;
  clienteApellido: string;
  clienteEmail: string;
  clienteTelefono?: string;
  clienteTipoDocumento: number;
  clienteNumeroDocumento: string;
  clienteFechaNacimiento?: string;
  clienteNumeroLicencia?: string;
  clienteVencimientoLicencia?: string;
  vehiculoAlquilerId?: string;
  categoriaAlquiler?: number;
  sucursalRecogidaId: string;
  sucursalDevolucionId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  recargosSeleccionadosIds: string[];
  coberturasSeleccionadasIds: string[];
  codigoPromocion?: string;
  origenReserva: number;
  notas?: string;
  claveIdempotencia?: string;
}

/**
 * Request para modificar una reserva de alquiler existente.
 * Espeja UpdateReservaAlquilerCommand del backend.
 * Solo permitido en estados Tentativa y Confirmada.
 */
export interface ModificarReservaAlquilerRequest {
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
}

// =====================================================
// Frontend-only (timeline computado)
// =====================================================

export interface TimelineEntry {
  estado: EstadoReserva;
  fecha: string | null;
  esActual: boolean;
  descripcion?: string;
}

