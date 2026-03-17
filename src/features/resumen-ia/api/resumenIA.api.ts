import { apiClient } from '@/services/http/apiClient';
import type {
  ConfiguracionResumenIADto,
  ResumenIADto,
  ResumenIAListDto,
  ActualizarConfiguracionRequest,
} from '../types';

const BASE = 'resumen-ia';

export const resumenIAApi = {
  obtenerConfiguracion: async (): Promise<ConfiguracionResumenIADto> => {
    const response = await apiClient.get<ConfiguracionResumenIADto>(`${BASE}/configuracion`);
    return response.data;
  },

  actualizarConfiguracion: async (data: ActualizarConfiguracionRequest): Promise<ConfiguracionResumenIADto> => {
    const response = await apiClient.put<ConfiguracionResumenIADto>(`${BASE}/configuracion`, data);
    return response.data;
  },

  obtenerHistorial: async (pagina = 1, tamanoPagina = 10): Promise<ResumenIAListDto> => {
    const response = await apiClient.get<ResumenIAListDto>(`${BASE}/historial`, {
      params: { pagina, tamanoPagina },
    });
    return response.data;
  },

  generarManual: async (): Promise<ResumenIADto> => {
    const response = await apiClient.post<ResumenIADto>(`${BASE}/generar`);
    return response.data;
  },
};
