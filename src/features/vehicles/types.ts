import type { RecursoSharingInfoDto, NivelPermisoCompartido } from '@/shared/types/api';

export enum TipoVehiculo {
  Auto = 1,
}

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
  compartidoCon?: RecursoSharingInfoDto | null;
  permisoAcceso?: NivelPermisoCompartido;
}

export interface CreateVehiculoRequest {
  tipo: TipoVehiculo;
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
}

export interface UpdateVehiculoRequest {
  id: string;
  tipo: TipoVehiculo;
  patente: string;
  marca?: string;
  modelo?: string;
  anio?: number;
  activo: boolean;
}

export interface AssignDispositivoRequest {
  dispositivoId: string;
  motivoCambio?: string;
}

export const TIPO_VEHICULO_LABELS: Record<TipoVehiculo, string> = {
  [TipoVehiculo.Auto]: 'Automovil',
};
