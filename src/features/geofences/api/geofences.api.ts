/**
 * API client para Geofences
 */

import { apiClient } from '@/services/http/apiClient';
import { useAuthStore } from '@/store';
import type {
  GeofenceDto,
  CreateGeofenceCommand,
  UpdateGeofenceCommand,
  ListGeofencesParams,
  VehiculoAsignadoDto,
  ListaPaginada,
} from '../types';

const BASE = 'geofences';

function getGeofencesBase() {
  const user = useAuthStore.getState().user;
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  return isPersonalContext ? 'personal/geofences' : BASE;
}

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

    const response = await apiClient.get<ListaPaginada<GeofenceDto>>(getGeofencesBase(), { params: queryParams });
    return response.data;
  },

  /**
   * Obtiene una geofence por ID
   */
  obtenerPorId: async (id: string): Promise<GeofenceDto> => {
    const response = await apiClient.get<GeofenceDto>(`${getGeofencesBase()}/${id}`);
    return response.data;
  },

  /**
   * Crea una nueva geofence
   */
  crear: async (command: CreateGeofenceCommand): Promise<GeofenceDto> => {
    const response = await apiClient.post<GeofenceDto>(getGeofencesBase(), command);
    return response.data;
  },

  /**
   * Actualiza una geofence existente
   */
  actualizar: async (id: string, command: Omit<UpdateGeofenceCommand, 'id'>): Promise<GeofenceDto> => {
    const response = await apiClient.put<GeofenceDto>(`${getGeofencesBase()}/${id}`, { ...command, id });
    return response.data;
  },

  /**
   * Elimina una geofence (soft delete)
   */
  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`${getGeofencesBase()}/${id}`);
  },

  /**
   * Lista los vehículos actualmente asignados a una geofence
   */
  listarVehiculosAsignados: async (geofenceId: string): Promise<VehiculoAsignadoDto[]> => {
    const response = await apiClient.get<VehiculoAsignadoDto[]>(`${getGeofencesBase()}/${geofenceId}/vehiculos`);
    return response.data;
  },

  /**
   * Asigna un vehículo a una geofence
   */
  asignarVehiculo: async (geofenceId: string, vehiculoId: string): Promise<boolean> => {
    const response = await apiClient.post<boolean>(
      `${getGeofencesBase()}/${geofenceId}/vehiculos/${vehiculoId}`
    );
    return response.data;
  },

  /**
   * Desasigna un vehículo de una geofence
   */
  desasignarVehiculo: async (geofenceId: string, vehiculoId: string): Promise<boolean> => {
    const response = await apiClient.delete<boolean>(
      `${getGeofencesBase()}/${geofenceId}/vehiculos/${vehiculoId}`
    );
    return response.data;
  },
};
