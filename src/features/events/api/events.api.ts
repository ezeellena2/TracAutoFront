import { apiClient } from '@/services/http/apiClient';
import type {
  AlertaCerebroDto,
  ListaPaginada,
  AlertasParams,
  EstadoAlertaCerebro,
} from '@/features/dashboard/types';

const BASE = 'cerebro/alertas';

export const eventsApi = {
  getAlertas: async (params?: AlertasParams): Promise<ListaPaginada<AlertaCerebroDto>> => {
    const response = await apiClient.get<ListaPaginada<AlertaCerebroDto>>(BASE, { params });
    return response.data;
  },

  resolverAlerta: async (id: string, nota?: string): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/resolver`, nota ? { nota } : undefined);
  },

  marcarLeida: async (id: string): Promise<void> => {
    await apiClient.post(`${BASE}/${id}/leer`);
  },

  marcarVariasLeidas: async (ids: string[]): Promise<number> => {
    const response = await apiClient.post<number>(`${BASE}/leer-multiples`, { ids });
    return response.data;
  },

  getContadorNoLeidas: async (): Promise<number> => {
    const response = await apiClient.get<number>(`${BASE}/no-leidas/count`);
    return response.data;
  },
};

export type { AlertaCerebroDto, ListaPaginada, AlertasParams, EstadoAlertaCerebro };
