/**
 * Vehiculos API Service
 * Endpoints for vehicle management (CRUD + device assignment)
 */

import { apiClient } from '../http/apiClient';
import type {
  VehiculoDto,
  CreateVehiculoRequest,
  UpdateVehiculoRequest,
  AssignDispositivoRequest,
} from '@/features/vehicles/types';
import type { ConductorVehiculoAsignacionDto } from '@/features/drivers/types';
import type {
  ListaPaginada,
  PaginacionParams,
  RecursoSharingStatusDto,
  ActualizarComparticionRequest,
} from '@/shared/types/api';

const VEHICULOS_BASE = 'vehiculos';

/**
 * Parámetros para obtener vehículos
 */
export interface GetVehiculosParams extends PaginacionParams {
  soloActivos?: boolean;
  filtroPatente?: string;
  /** Si es true, solo retorna vehículos propios (excluye compartidos/asociados) */
  soloPropios?: boolean;
  /** Filtrar por ID específico. Útil para navegación directa desde tabla de conductores. */
  filtroId?: string;
  /** Filtros de columna de useTableFilters (e.g. { 'filters[patente]': 'ABC', 'op[patente]': 'contains' }) */
  filterParams?: Record<string, string>;
}

/**
 * Fetches vehicles with pagination
 * @returns ListaPaginada with items and metadata
 */
export async function getVehiculos(
  params: GetVehiculosParams = {}
): Promise<ListaPaginada<VehiculoDto>> {
  const { numeroPagina = 1, tamanoPagina = 10, soloActivos, filtroPatente, soloPropios, filtroId, filterParams } = params;

  const queryParams: Record<string, string | number | boolean> = {
    numeroPagina,
    tamanoPagina,
  };

  if (soloActivos !== undefined) {
    queryParams.soloActivos = soloActivos;
  }
  if (filtroPatente) {
    queryParams.filtroPatente = filtroPatente;
  }
  if (soloPropios !== undefined) {
    queryParams.soloPropios = soloPropios;
  }
  if (filtroId !== undefined) {
    queryParams.filtroId = filtroId;
  }

  // Forward advanced filter params (filters[key], op[key]) from useTableFilters
  if (filterParams) {
    Object.entries(filterParams).forEach(([k, v]) => {
      if (v !== undefined && v !== '') {
        queryParams[k] = v;
      }
    });
  }

  const response = await apiClient.get<ListaPaginada<VehiculoDto>>(VEHICULOS_BASE, {
    params: queryParams
  });
  return response.data;
}

/**
 * Fetches a vehicle by ID
 */
export async function getVehiculoById(id: string): Promise<VehiculoDto> {
  const response = await apiClient.get<VehiculoDto>(`${VEHICULOS_BASE}/${id}`);
  return response.data;
}

/**
 * Creates a new vehicle
 */
export async function createVehiculo(
  data: CreateVehiculoRequest
): Promise<VehiculoDto> {
  const response = await apiClient.post<VehiculoDto>(VEHICULOS_BASE, data);
  return response.data;
}

/**
 * Updates an existing vehicle
 */
export async function updateVehiculo(
  id: string,
  data: UpdateVehiculoRequest
): Promise<VehiculoDto> {
  const response = await apiClient.put<VehiculoDto>(
    `${VEHICULOS_BASE}/${id}`,
    data
  );
  return response.data;
}

/**
 * Deletes a vehicle (soft delete)
 */
export async function deleteVehiculo(id: string): Promise<void> {
  await apiClient.delete(`${VEHICULOS_BASE}/${id}`);
}

/**
 * Assigns a device to a vehicle
 */
export async function assignDispositivo(
  vehiculoId: string,
  data: AssignDispositivoRequest
): Promise<void> {
  await apiClient.post(`${VEHICULOS_BASE}/${vehiculoId}/asignaciones`, data);
}

/**
 * Unassigns a device from a vehicle
 */
export async function unassignDispositivo(
  vehiculoId: string,
  dispositivoId: string
): Promise<void> {
  await apiClient.post(
    `${VEHICULOS_BASE}/${vehiculoId}/asignaciones/${dispositivoId}/finalizar`
  );
}

/**
 * Respuesta de conductores por vehículo en batch (una sola request para N vehículos).
 */
export interface VehiculoConductoresBatchItemDto {
  vehiculoId: string;
  conductores: ConductorVehiculoAsignacionDto[];
}

/**
 * Obtiene en una sola petición los conductores asignados a varios vehículos.
 * Evita N+1 cuando se muestra la lista de vehículos y se necesita el conteo por vehículo.
 * @param vehiculoIds IDs de vehículos
 * @param soloActivos Si true, solo asignaciones activas (sin fecha fin)
 */
export async function getConductoresAsignadosBatch(
  vehiculoIds: string[],
  soloActivos?: boolean
): Promise<VehiculoConductoresBatchItemDto[]> {
  if (vehiculoIds.length === 0) return [];

  const params: Record<string, string | boolean> = {
    vehiculoIds: vehiculoIds.join(','),
  };
  if (soloActivos !== undefined) params.soloActivos = soloActivos;
  const response = await apiClient.get<VehiculoConductoresBatchItemDto[]>(
    `${VEHICULOS_BASE}/conductores-batch`,
    { params }
  );
  return response.data;
}

/**
 * Obtiene los conductores asignados a un vehículo.
 * @param vehiculoId ID del vehículo
 * @param soloActivos Si true, solo asignaciones activas (sin fecha fin)
 */
export async function getConductoresAsignados(
  vehiculoId: string,
  soloActivos?: boolean
): Promise<ConductorVehiculoAsignacionDto[]> {
  const params: Record<string, boolean> = {};
  if (soloActivos !== undefined) params.soloActivos = soloActivos;
  const response = await apiClient.get<ConductorVehiculoAsignacionDto[]>(
    `${VEHICULOS_BASE}/${vehiculoId}/conductores`,
    { params: Object.keys(params).length ? params : undefined }
  );
  return response.data;
}

// ========================================
// FUNCIONES DE COMPARTICIÓN
// ========================================

/**
 * Obtiene el estado de compartición de un vehículo.
 * Muestra todas las relaciones activas y si el vehículo está compartido/excluido en cada una.
 */
export async function getSharingStatus(vehiculoId: string): Promise<RecursoSharingStatusDto> {
  const response = await apiClient.get<RecursoSharingStatusDto>(
    `${VEHICULOS_BASE}/${vehiculoId}/sharing`
  );
  return response.data;
}

/**
 * Actualiza el estado de compartición de un vehículo.
 * Permite compartir, descompartir y excluir el vehículo en múltiples relaciones.
 */
export async function updateSharingStatus(
  vehiculoId: string,
  request: ActualizarComparticionRequest
): Promise<void> {
  await apiClient.put(`${VEHICULOS_BASE}/${vehiculoId}/sharing`, request);
}

/** Grouped API exports */
export const vehiculosApi = {
  getVehiculos,
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  assignDispositivo,
  unassignDispositivo,
  getConductoresAsignados,
  getConductoresAsignadosBatch,
  getSharingStatus,
  updateSharingStatus,
};
