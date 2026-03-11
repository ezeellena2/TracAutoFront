/**
 * Tipos para detalle publico del vehiculo de alquiler
 * Alineados con DTOs del backend (AlquilerPublicoController)
 */

import type { VehiculoDisponibleDto } from './busqueda';

// Sucursal donde el vehiculo esta disponible
export interface SucursalVehiculoPublicoDto {
  sucursalId: string;
  nombre: string;
  ciudad: string;
}

// Detalle completo del vehiculo — extiende VehiculoDisponibleDto
export interface VehiculoAlquilerPublicoDto extends VehiculoDisponibleDto {
  kilometrajeLimiteDiario: number | null;
  precioPorKmExcedente: number;
  politicaCombustible: number;
  depositoMinimo: number;
  edadMinimaConductor: number;
  licenciaRequerida: string;
  capacidadEquipaje: string | null;
  sucursales: SucursalVehiculoPublicoDto[];
}

// Coberturas y recargos públicos para selector de opciones
export interface OpcionesPublicasDto {
  coberturas: CoberturaPublicaDto[];
  recargos: RecargoPublicoDto[];
}

export interface CoberturaPublicaDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioPorDia: number;
  obligatoria: boolean;
}

export interface RecargoPublicoDto {
  id: string;
  nombre: string;
  descripcion: string | null;
  precioFijo: number | null;
  precioPorDia: number | null;
  obligatorio: boolean;
}

// Request para cotizar — POST /api/public/v1/alquiler/cotizar
export interface CotizarPublicoRequest {
  vehiculoAlquilerId?: string;
  categoriaAlquiler?: number;
  sucursalRecogidaId: string;
  sucursalDevolucionId: string;
  fechaHoraRecogida: string;
  fechaHoraDevolucion: string;
  recargosSeleccionadosIds: string[];
  coberturasSeleccionadasIds: string[];
  codigoPromocion?: string;
}

// Request para validar promocion — POST /api/public/v1/alquiler/promocion/validar
export interface ValidarPromocionPublicoRequest {
  codigo: string;
  montoReserva: number;
  sucursalId: string;
}
