import type { RecursoSharingInfoDto } from '@/shared/types/api';

export interface ConductorDto {
  id: string;
  nombreCompleto: string;
  dni?: string;
  email?: string;
  telefono?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  esRecursoAsociado: boolean;
  /**
   * Informacion de comparticion del recurso.
   * Solo se incluye para recursos propios (esRecursoAsociado = false).
   * Indica con cuantas y cuales organizaciones esta compartido este conductor.
   */
  compartidoCon?: RecursoSharingInfoDto | null;
}

export interface ConductorVehiculoAsignacionDto {
  id: string;
  conductorId: string;
  conductorNombre: string;
  vehiculoId: string;
  vehiculoPatente: string;
  inicioUtc: string;
  finUtc?: string;
  motivoCambio?: string;
}

export interface ConductorDispositivoAsignacionDto {
  id: string;
  conductorId: string;
  conductorNombre: string;
  dispositivoId: string;
  dispositivoNombre: string;
  inicioUtc: string;
  finUtc?: string;
  motivoCambio?: string;
}

export interface CreateConductorCommand {
  nombreCompleto: string;
  dni?: string;
  email?: string;
  telefono?: string;
}

export interface UpdateConductorCommand {
  id: string;
  nombreCompleto: string;
  email?: string;
  telefono?: string;
}

export interface AsignarVehiculoRequest {
  vehiculoId: string;
  motivoCambio?: string;
}

export interface AsignarDispositivoRequest {
  dispositivoId: string;
  motivoCambio?: string;
}

