/**
 * Tipos para el modulo de Contratos y Plantillas de Alquiler
 * Alineados con los DTOs del backend (PlantillaContratoDto, ContratoAlquilerDto)
 */

export enum EstadoFirmaDigital {
  Enviado = 1,
  Firmado = 2,
  Rechazado = 3,
  Expirado = 4,
  Error = 5,
}

// DTO lista de plantillas (sin contenido HTML)
export interface PlantillaContratoDto {
  id: string;
  nombre: string;
  version: number;
  esDefault: boolean;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// DTO detalle de plantilla (con contenido HTML)
export interface PlantillaContratoDetalleDto extends PlantillaContratoDto {
  contenidoHtml: string;
}

// DTO contrato generado
export interface ContratoAlquilerDto {
  id: string;
  reservaAlquilerId: string;
  numeroContrato: string;
  plantillaVersion: number;
  contenidoHtml: string;
  firmaCliente: boolean;
  fechaFirma: string | null;
  ipFirma: string | null;
  metodoFirma: number | null;
  firmadoPorNombre: string | null;
  documentoPdfUrl: string | null;
  estadoFirmaDigital: EstadoFirmaDigital | null;
  fechaEnvioFirmaDigital: string | null;
  fechaCreacion: string;
}

export interface FirmaDigitalResult {
  exitoso: boolean;
  envelopeId: string | null;
  mensajeError: string | null;
  fechaEnvio: string | null;
  estadoActual: EstadoFirmaDigital | null;
  urlAccion: string | null;
  idempotente: boolean;
}

// Requests
export interface CreatePlantillaContratoRequest {
  nombre: string;
  contenidoHtml: string;
  esDefault: boolean;
}

export interface UpdatePlantillaContratoRequest {
  nombre: string;
  contenidoHtml: string;
  esDefault: boolean;
  activa: boolean;
}

export interface GenerarContratoRequest {
  reservaId: string;
  plantillaId?: string;
}

export interface FirmarContratoRequest {
  contratoId: string;
  metodoFirma: number;
  firmadoPorNombre: string;
}