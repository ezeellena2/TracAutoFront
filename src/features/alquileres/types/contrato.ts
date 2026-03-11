/**
 * Tipos para el modulo de Contratos y Plantillas de Alquiler
 * Alineados con los DTOs del backend (PlantillaContratoDto, ContratoAlquilerDto)
 */

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
  fechaCreacion: string;
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
