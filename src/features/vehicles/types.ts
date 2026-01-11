/**
 * Vehiculos API Types - aligned with backend TracAuto.Application.Vehiculos
 */

import type { RecursoSharingInfoDto, NivelPermisoCompartido } from '@/shared/types/api';

/** Tipo de vehículo - matches TipoVehiculo enum in backend */
export enum TipoVehiculo {
  Auto = 1,
}

/** Tipo de extensión de vehículo - matches TipoExtensionVehiculo enum in backend (bitmask) */
export enum TipoExtensionVehiculo {
  Ninguno = 0,
  Marketplace = 1,
  Alquiler = 2,
  Taxi = 4,
  Aseguradora = 8,
  FlotaPrivada = 16,
  Otros = 32,
}

/** DTO for vehicle from backend */
export interface VehiculoDto {
  id: string;
  tipo: TipoVehiculo;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  dispositivoActivoId: string | null;
  dispositivoActivoNombre?: string | null;
  esRecursoAsociado: boolean;
  /**
   * Informacion de comparticion del recurso.
   * Solo se incluye para recursos propios (esRecursoAsociado = false).
   * Indica con cuantas y cuales organizaciones esta compartido este vehiculo.
   */
  compartidoCon?: RecursoSharingInfoDto | null;
  permisoAcceso?: NivelPermisoCompartido;
}

/** Datos para crear extensión Marketplace */
export interface VehiculoMarketplaceCreateData {
  precio?: number;
  moneda?: string;
  kilometraje?: number;
  descripcion?: string;
  estado?: number; // EstadoPublicacion enum
  destacado?: boolean;
}

/** Datos para crear extensión Alquiler */
export interface VehiculoAlquilerCreateData {
  categoriaId: string;
  sucursalBaseId?: string;
  estado?: number; // EstadoVehiculoAlquiler enum
  disponibleDesdeUtc?: string;
  disponibleHastaUtc?: string;
  kilometrosMaxDia?: number;
  notas?: string;
}

/** Datos para crear extensión Taxi */
export interface VehiculoTaxiCreateData {
  numeroLicencia?: string;
  numeroInterno?: string;
  habilitadoParaServicio?: boolean;
  vencimientoVTV?: string;
  vencimientoSeguro?: string;
}

/** Datos para crear extensión Aseguradora */
export interface VehiculoAseguradoraCreateData {
  numeroPoliza?: string;
  fechaInicioCobertura?: string;
  fechaVencimientoPoliza?: string;
  companiaAseguradora?: string;
  valorAsegurado?: number;
  tipoCobertura?: string;
}

/** Datos para crear extensión Otros */
export interface VehiculoOtrosCreateData {
  tipoContexto: string;
  descripcion?: string;
  metadatosJson?: string;
}

/** Request to create a vehicle */
export interface CreateVehiculoRequest {
  tipo: TipoVehiculo;
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  extensionesSolicitadas?: TipoExtensionVehiculo;
  datosMarketplace?: VehiculoMarketplaceCreateData;
  datosAlquiler?: VehiculoAlquilerCreateData;
  datosTaxi?: VehiculoTaxiCreateData;
  datosAseguradora?: VehiculoAseguradoraCreateData;
  datosOtros?: VehiculoOtrosCreateData;
}

/** Request to update a vehicle */
export interface UpdateVehiculoRequest {
  id: string;
  tipo: TipoVehiculo;
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  activo: boolean;
}

/** Request to assign a device to a vehicle */
export interface AssignDispositivoRequest {
  dispositivoId: string;
  motivoCambio?: string;
}

/** Label mapping for TipoVehiculo */
export const TIPO_VEHICULO_LABELS: Record<TipoVehiculo, string> = {
  [TipoVehiculo.Auto]: 'Automóvil',
};
