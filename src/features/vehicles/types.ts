/**
 * Vehiculos API Types - aligned with backend TracAuto.Application.Vehiculos
 */

/** Tipo de vehículo - matches TipoVehiculo enum in backend */
export enum TipoVehiculo {
  Auto = 1,
}

/** DTO for vehicle from backend */
export interface VehiculoDto {
  id: string;
  tipo: TipoVehiculo;
  patente: string;
  marca: string | null;
  modelo: string | null;
  año: number | null;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  dispositivoActivoId: string | null;
}

/** Request to create a vehicle */
export interface CreateVehiculoRequest {
  tipo: TipoVehiculo;
  patente: string;
  marca?: string;
  modelo?: string;
  año?: number;
}

/** Request to update a vehicle */
export interface UpdateVehiculoRequest {
  id: string;
  tipo: TipoVehiculo;
  patente: string;
  marca?: string;
  modelo?: string;
  año?: number;
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
