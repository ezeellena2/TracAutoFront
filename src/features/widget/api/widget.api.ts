import { apiClient } from '@/services/http/apiClient';
import type {
  WidgetConfiguracionDto,
  WidgetConfiguracionConApiKeyDto,
  CrearWidgetRequest,
  ActualizarWidgetRequest,
} from '../types';

const BASE = 'widget';

export const widgetApi = {
  listar: async (): Promise<WidgetConfiguracionDto[]> => {
    const response = await apiClient.get<WidgetConfiguracionDto[]>(BASE);
    return response.data;
  },

  obtenerPorId: async (id: string): Promise<WidgetConfiguracionConApiKeyDto> => {
    const response = await apiClient.get<WidgetConfiguracionConApiKeyDto>(`${BASE}/${id}`);
    return response.data;
  },

  crear: async (request: CrearWidgetRequest): Promise<WidgetConfiguracionConApiKeyDto> => {
    const response = await apiClient.post<WidgetConfiguracionConApiKeyDto>(BASE, request);
    return response.data;
  },

  actualizar: async (id: string, request: ActualizarWidgetRequest): Promise<WidgetConfiguracionDto> => {
    const response = await apiClient.put<WidgetConfiguracionDto>(`${BASE}/${id}`, request);
    return response.data;
  },

  desactivar: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  regenerarApiKey: async (id: string): Promise<WidgetConfiguracionConApiKeyDto> => {
    const response = await apiClient.post<WidgetConfiguracionConApiKeyDto>(`${BASE}/${id}/regenerar-api-key`);
    return response.data;
  },
};
