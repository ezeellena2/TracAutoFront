import { apiClient } from '@/services/http/apiClient';
import type { ModuloActivoDto, ModuloDisponibleDto } from '../types';

const BASE_SUSCRIPCION = 'suscripcion';

export const suscripcionesApi = {
  getModulosActivos: async (): Promise<ModuloActivoDto[]> => {
    const response = await apiClient.get<ModuloActivoDto[]>(BASE_SUSCRIPCION);
    return response.data;
  },

  getModulosDisponibles: async (): Promise<ModuloDisponibleDto[]> => {
    const response = await apiClient.get<ModuloDisponibleDto[]>(`${BASE_SUSCRIPCION}/modulos`);
    return response.data;
  },

  activarModulo: async (codigo: number): Promise<void> => {
    await apiClient.post(`${BASE_SUSCRIPCION}/modulos/${codigo}/activar`);
  },

  desactivarModulo: async (codigo: number): Promise<void> => {
    await apiClient.delete(`${BASE_SUSCRIPCION}/modulos/${codigo}`);
  },
};
