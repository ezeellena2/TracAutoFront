/**
 * API client para Geofences
 */

import { apiClient } from '@/services/http/apiClient';
import type {
  GeofenceDto,
  CreateGeofenceCommand,
  UpdateGeofenceCommand,
  ListGeofencesParams,
  VehiculoAsignadoDto,
  ListaPaginada,
} from '../types';

const BASE = 'geofences';

export const geofencesApi = {
  /**
   * Lista geofences de la organización actual con paginación
   */
  listar: async (params: ListGeofencesParams = {}): Promise<ListaPaginada<GeofenceDto>> => {
    const queryParams: Record<string, string | boolean | number> = {};

    if (params.soloActivas !== undefined) {
      queryParams.soloActivas = params.soloActivas;
    }
    if (params.buscar) {
      queryParams.buscar = params.buscar;
    }
    if (params.numeroPagina !== undefined) {
      queryParams.numeroPagina = params.numeroPagina;
    }
    if (params.tamanoPagina !== undefined) {
      queryParams.tamanoPagina = params.tamanoPagina;
    }

    const response = await apiClient.get<ListaPaginada<GeofenceDto>>(BASE, { params: queryParams });
    return response.data;
  },

  /**
   * Obtiene una geofence por ID
   */
  obtenerPorId: async (id: string): Promise<GeofenceDto> => {
    const response = await apiClient.get<GeofenceDto>(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva geofence
   */
  crear: async (command: CreateGeofenceCommand): Promise<GeofenceDto> => {
    const response = await apiClient.post<GeofenceDto>(BASE, command);
    return response.data;
  },

  /**
   * Actualiza una geofence existente
   */
  actualizar: async (id: string, command: Omit<UpdateGeofenceCommand, 'id'>): Promise<GeofenceDto> => {
    const response = await apiClient.put<GeofenceDto>(`${BASE}/${id}`, { ...command, id });
    return response.data;
  },

  /**
   * Elimina una geofence (soft delete)
   */
  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  /**
   * Lista los vehículos actualmente asignados a una geofence
   */
  listarVehiculosAsignados: async (geofenceId: string): Promise<VehiculoAsignadoDto[]> => {
    const response = await apiClient.get<VehiculoAsignadoDto[]>(`${BASE}/${geofenceId}/vehiculos`);
    return response.data;
  },

  /**
   * Asigna un vehículo a una geofence
   */
  asignarVehiculo: async (geofenceId: string, vehiculoId: string): Promise<boolean> => {
    const response = await apiClient.post<boolean>(
      `${BASE}/${geofenceId}/vehiculos/${vehiculoId}`
    );
    return response.data;
  },

  /**
   * Desasigna un vehículo de una geofence
   */
  desasignarVehiculo: async (geofenceId: string, vehiculoId: string): Promise<boolean> => {
    const response = await apiClient.delete<boolean>(
      `${BASE}/${geofenceId}/vehiculos/${vehiculoId}`
    );
    return response.data;
  },
};
