import { apiClient } from '../http/apiClient';
import type {
  ConductorDto,
  ConductorVehiculoAsignacionDto,
  ConductorDispositivoAsignacionDto,
  CreateConductorCommand,
  UpdateConductorCommand,
  AsignarVehiculoRequest,
  AsignarDispositivoRequest,
} from '@/features/drivers/types';
import type { ListaPaginada } from '@/shared/types/api';

const BASE = 'conductores';

export const conductoresApi = {
  /**
   * Obtiene la lista paginada de conductores
   */
  listar: async (
    numeroPagina: number = 1,
    tamanoPagina: number = 10,
    soloActivos?: boolean,
    buscar?: string
  ): Promise<ListaPaginada<ConductorDto>> => {
    const params: Record<string, string | number> = {
      numeroPagina,
      tamanoPagina,
    };
    if (soloActivos !== undefined) {
      params.soloActivos = soloActivos.toString();
    }
    if (buscar) {
      params.buscar = buscar;
    }
    const response = await apiClient.get<ListaPaginada<ConductorDto>>(BASE, { params });
    return response.data;
  },

  /**
   * Obtiene un conductor por ID
   */
  obtenerPorId: async (id: string): Promise<ConductorDto> => {
    const response = await apiClient.get<ConductorDto>(`${BASE}/${id}`);
    return response.data;
  },

  /**
   * Crea un nuevo conductor
   */
  crear: async (command: CreateConductorCommand): Promise<ConductorDto> => {
    const response = await apiClient.post<ConductorDto>(BASE, command);
    return response.data;
  },

  /**
   * Actualiza un conductor existente
   */
  actualizar: async (id: string, command: Omit<UpdateConductorCommand, 'id'>): Promise<ConductorDto> => {
    const response = await apiClient.put<ConductorDto>(`${BASE}/${id}`, { ...command, id });
    return response.data;
  },

  /**
   * Elimina un conductor (soft delete)
   */
  eliminar: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  /**
   * Asigna un conductor a un vehículo
   */
  asignarVehiculo: async (
    conductorId: string,
    request: AsignarVehiculoRequest
  ): Promise<ConductorVehiculoAsignacionDto> => {
    const response = await apiClient.post<ConductorVehiculoAsignacionDto>(
      `${BASE}/${conductorId}/asignaciones/vehiculos`,
      request
    );
    return response.data;
  },

  /**
   * Desasigna un conductor de un vehículo
   */
  desasignarVehiculo: async (conductorId: string, vehiculoId: string, motivoCambio?: string): Promise<void> => {
    const params = motivoCambio ? { motivoCambio } : undefined;
    await apiClient.delete(`${BASE}/${conductorId}/asignaciones/vehiculos/${vehiculoId}`, { params });
  },

  /**
   * Asigna un conductor a un dispositivo
   */
  asignarDispositivo: async (
    conductorId: string,
    request: AsignarDispositivoRequest
  ): Promise<ConductorDispositivoAsignacionDto> => {
    const response = await apiClient.post<ConductorDispositivoAsignacionDto>(
      `${BASE}/${conductorId}/asignaciones/dispositivos`,
      request
    );
    return response.data;
  },

  /**
   * Desasigna un conductor de un dispositivo
   */
  desasignarDispositivo: async (
    conductorId: string,
    dispositivoId: string,
    motivoCambio?: string
  ): Promise<void> => {
    const params = motivoCambio ? { motivoCambio } : undefined;
    await apiClient.delete(`${BASE}/${conductorId}/asignaciones/dispositivos/${dispositivoId}`, { params });
  },

  /**
   * Obtiene las asignaciones de vehículos de un conductor
   */
  obtenerAsignacionesVehiculos: async (
    conductorId: string,
    soloActivos?: boolean
  ): Promise<ConductorVehiculoAsignacionDto[]> => {
    const params = soloActivos !== undefined ? { soloActivos: soloActivos.toString() } : undefined;
    const response = await apiClient.get<ConductorVehiculoAsignacionDto[]>(
      `${BASE}/${conductorId}/asignaciones/vehiculos`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtiene las asignaciones de dispositivos de un conductor
   */
  obtenerAsignacionesDispositivos: async (
    conductorId: string,
    soloActivos?: boolean
  ): Promise<ConductorDispositivoAsignacionDto[]> => {
    const params = soloActivos !== undefined ? { soloActivos: soloActivos.toString() } : undefined;
    const response = await apiClient.get<ConductorDispositivoAsignacionDto[]>(
      `${BASE}/${conductorId}/asignaciones/dispositivos`,
      { params }
    );
    return response.data;
  },
};

