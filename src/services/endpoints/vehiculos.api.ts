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

const VEHICULOS_BASE = 'vehiculos';

/**
 * Fetches all vehicles for the current organization
 */
export async function getVehiculos(
  soloActivos?: boolean,
  filtroPatente?: string
): Promise<VehiculoDto[]> {
  const params = new URLSearchParams();
  if (soloActivos !== undefined) {
    params.append('soloActivos', String(soloActivos));
  }
  if (filtroPatente) {
    params.append('filtroPatente', filtroPatente);
  }
  
  const queryString = params.toString();
  const url = queryString ? `${VEHICULOS_BASE}?${queryString}` : VEHICULOS_BASE;
  
  const response = await apiClient.get<VehiculoDto[]>(url);
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
