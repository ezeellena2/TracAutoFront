/**
 * API client para Turnos de Taxi
 */

import { apiClient } from '@/services/http/apiClient';
import type { ListaPaginada } from '@/shared/types/api';
import type {
  TurnoTaxiDto,
  TurnoActivoDto,
  CreateTurnoTaxiCommand,
  UpdateTurnoTaxiCommand,
  ListTurnosTaxiParams,
  GetTurnosActivosParams,
} from '../types';

const BASE = 'turnos-taxi';

export const turnosTaxiApi = {
  /**
   * Lista turnos de taxi con paginación y filtros
   */
  listar: async (params: ListTurnosTaxiParams = {}): Promise<ListaPaginada<TurnoTaxiDto>> => {
    const {
      numeroPagina = 1,
      tamanoPagina = 10,
      vehiculoId,
      vehiculoIds,
      soloActivos,
      buscar
    } = params;

    const queryParams: Record<string, string | number | boolean> = {
      numeroPagina,
      tamanoPagina,
    };

    if (vehiculoId) {
      queryParams.vehiculoId = vehiculoId;
    }
    if (soloActivos !== undefined) {
      queryParams.soloActivos = soloActivos;
    }
    if (buscar) {
      queryParams.buscar = buscar;
    }

    // vehiculoIds se pasa como query string repetido
    let url = BASE;
    if (vehiculoIds && vehiculoIds.length > 0) {
      const vehiculoIdsParams = vehiculoIds.map(id => `vehiculoIds=${id}`).join('&');
      url = `${BASE}?${vehiculoIdsParams}`;
    }

    const response = await apiClient.get<ListaPaginada<TurnoTaxiDto>>(url, {
      params: vehiculoIds?.length ? undefined : queryParams
    });
    return response.data;
  },

  /**
   * Obtiene un turno por ID
   */
  obtenerPorId: async (id: string): Promise<TurnoTaxiDto> => {
    const response = await apiClient.get<TurnoTaxiDto>(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Obtiene turnos activos en un momento dado (para mapa)
   */
  obtenerActivos: async (params: GetTurnosActivosParams = {}): Promise<TurnoActivoDto[]> => {
    const { vehiculoIds, atUtc } = params;

    let url = `${BASE}/activos`;
    const queryParts: string[] = [];

    if (vehiculoIds && vehiculoIds.length > 0) {
      vehiculoIds.forEach(id => queryParts.push(`vehiculoIds=${id}`));
    }
    if (atUtc) {
      queryParts.push(`atUtc=${encodeURIComponent(atUtc)}`);
    }

    if (queryParts.length > 0) {
      url = `${url}?${queryParts.join('&')}`;
    }

    const response = await apiClient.get<TurnoActivoDto[]>(url);
    return response.data;
  },

  /**
   * Crea un nuevo turno
   */
  crear: async (command: CreateTurnoTaxiCommand): Promise<TurnoTaxiDto> => {
    const response = await apiClient.post<TurnoTaxiDto>(BASE, command);
    return response.data;
  },

  /**
   * Actualiza un turno existente
   */
  actualizar: async (id: string, command: Omit<UpdateTurnoTaxiCommand, 'id'>): Promise<TurnoTaxiDto> => {
    const response = await apiClient.put<TurnoTaxiDto>(`${BASE}/${id}`, { ...command, id });
    return response.data;
  },

  /**
   * Elimina un turno (soft delete)
   */
  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  /**
   * Duplica un turno existente
   */
  duplicar: async (id: string, nuevoNombre?: string): Promise<TurnoTaxiDto> => {
    const params = nuevoNombre ? { nuevoNombre } : undefined;
    const response = await apiClient.post<TurnoTaxiDto>(`${BASE}/${id}/duplicar`, null, { params });
    return response.data;
  },
};
