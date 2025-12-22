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
import type { ListaPaginada, PaginacionParams } from '@/shared/types/api';

const VEHICULOS_BASE = 'vehiculos';

/**
 * Parámetros para obtener vehículos
 */
export interface GetVehiculosParams extends PaginacionParams {
  soloActivos?: boolean;
  filtroPatente?: string;
}

/**
 * Fetches vehicles with pagination
 * @returns ListaPaginada with items and metadata
 */
export async function getVehiculos(
  params: GetVehiculosParams = {}
): Promise<ListaPaginada<VehiculoDto>> {
  const { numeroPagina = 1, tamanoPagina = 10, soloActivos, filtroPatente } = params;
  
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

/** Grouped API exports */
export const vehiculosApi = {
  getVehiculos,
  getVehiculoById,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  assignDispositivo,
  unassignDispositivo,
};
