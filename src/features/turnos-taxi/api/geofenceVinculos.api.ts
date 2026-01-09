/**
 * API client para Geofence Vinculos
 */

import { apiClient } from '@/services/http/apiClient';
import type {
  GeofenceVinculoDto,
  TraccarGeofenceDto,
  CreateGeofenceVinculoCommand,
  UpdateGeofenceVinculoCommand,
} from '../types';

const BASE = 'geofence-vinculos';

export const geofenceVinculosApi = {
  /**
   * Lista geofences vinculadas a la organización actual
   */
  listar: async (soloActivos: boolean = true): Promise<GeofenceVinculoDto[]> => {
    const response = await apiClient.get<GeofenceVinculoDto[]>(BASE, {
      params: { soloActivos },
    });
    return response.data;
  },

  /**
   * Lista geofences disponibles en Traccar (para modal de vinculación)
   * Incluye flag indicando si ya están vinculadas
   */
  listarTraccar: async (): Promise<TraccarGeofenceDto[]> => {
    const response = await apiClient.get<TraccarGeofenceDto[]>(`${BASE}/traccar`);
    return response.data;
  },

  /**
   * Crea un nuevo vínculo de geofence
   */
  crear: async (command: CreateGeofenceVinculoCommand): Promise<GeofenceVinculoDto> => {
    const response = await apiClient.post<GeofenceVinculoDto>(BASE, command);
    return response.data;
  },

  /**
   * Actualiza un vínculo de geofence existente
   */
  actualizar: async (id: string, command: Omit<UpdateGeofenceVinculoCommand, 'id'>): Promise<GeofenceVinculoDto> => {
    const response = await apiClient.put<GeofenceVinculoDto>(`${BASE}/${id}`, { ...command, id });
    return response.data;
  },

  /**
   * Elimina un vínculo de geofence (soft delete)
   */
  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },
};
