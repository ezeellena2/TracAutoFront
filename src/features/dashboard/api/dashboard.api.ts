import { apiClient } from '@/services/http/apiClient';
import type {
  CerebroDashboardKpiDto,
  AlertaCerebroDto,
  ListaPaginada,
  DashboardKpisParams,
  AlertasParams,
} from '../types';

const BASE_KPIS = 'cerebro/kpis';
const BASE_ALERTAS = 'cerebro/alertas';

export const dashboardApi = {
  getKpis: async (params?: DashboardKpisParams): Promise<CerebroDashboardKpiDto> => {
    const response = await apiClient.get<CerebroDashboardKpiDto>(`${BASE_KPIS}/dashboard`, {
      params,
    });
    return response.data;
  },

  getAlertasRecientes: async (params?: AlertasParams): Promise<ListaPaginada<AlertaCerebroDto>> => {
    const response = await apiClient.get<ListaPaginada<AlertaCerebroDto>>(BASE_ALERTAS, {
      params: {
        numeroPagina: 1,
        tamanoPagina: 5,
        descendente: true,
        ...params,
      },
    });
    return response.data;
  },

  getContadorAlertasNoLeidas: async (): Promise<number> => {
    const response = await apiClient.get<number>(`${BASE_ALERTAS}/no-leidas/count`);
    return response.data;
  },
};
