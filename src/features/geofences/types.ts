/**
 * Tipos TypeScript para el módulo de Geofences
 */

// ================================
// ENUMS
// ================================

export enum SyncStatus {
  PendingCreate = 0,
  Synced = 1,
  Dirty = 2,
  Error = 3,
  Stale = 4,
  Deleting = 5,
}

export enum TipoGeofence {
  Polygon = 0,
  Circle = 1,
  Polyline = 2,
}

// ================================
// DTOs
// ================================

export interface GeofenceDto {
  id: string;
  nombre: string;
  descripcion?: string;
  geometria: string;
  tipo: TipoGeofence;
  traccarId?: number;
  syncStatus: SyncStatus;
  lastSyncError?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface VehiculoGeofenceDto {
  vehiculoId: string;
  geofenceId: string;
  vehiculoPatente?: string;
}

export interface VehiculoAsignadoDto {
  vehiculoId: string;
  patente: string;
  marca?: string;
  modelo?: string;
  geofenceId: string;
}

// ================================
// PAGINACION (re-export del tipo compartido)
// ================================

export type { ListaPaginada } from '@/shared/types/api';

// ================================
// CONSTANTES
// ================================

/** Tamaño de página por defecto para listar geofences (máximo permitido por el backend) */
export const GEOFENCES_PAGE_SIZE = 50;

// ================================
// COMMANDS
// ================================

export interface CreateGeofenceCommand {
  nombre: string;
  descripcion?: string;
  geometria: string;
  tipo: TipoGeofence;
}

export interface UpdateGeofenceCommand {
  id: string;
  nombre: string;
  descripcion?: string;
  geometria: string;
  tipo: TipoGeofence;
}

// ================================
// PARAMS
// ================================

export interface ListGeofencesParams {
  soloActivas?: boolean;
  buscar?: string;
  numeroPagina?: number;
  tamanoPagina?: number;
}

// ================================
// UI STATE
// ================================

export interface GeofenceModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  geofence?: GeofenceDto;
}

export interface AssignModalState {
  isOpen: boolean;
  geofence?: GeofenceDto;
}

export interface GeofencesFiltros {
  soloActivas: boolean;
  buscar?: string;
}
