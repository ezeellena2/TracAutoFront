import { apiClient } from '@/services/http/apiClient';
import type {
  Obd2SnapshotDto,
  CerebroDashboardKpiDto,
  VehiculoTelemetriaKpiDto,
  ListaPaginada,
  Obd2HistoryParams,
  VehiculoTelemetriaParams,
} from '../types';

export const obdApi = {
  getLatestSnapshot: async (params?: { vehiculoId?: string; dispositivoId?: string }): Promise<Obd2SnapshotDto | null> => {
    const response = await apiClient.get<Obd2SnapshotDto | null>('cerebro/obd2/latest', { params });
    return response.data;
  },

  getHistory: async (params?: Obd2HistoryParams): Promise<ListaPaginada<Obd2SnapshotDto>> => {
    const response = await apiClient.get<ListaPaginada<Obd2SnapshotDto>>('cerebro/obd2/history', { params });
    return response.data;
  },

  getDashboardKpis: async (params?: { fechaDesdeUtc?: string; fechaHastaUtc?: string }): Promise<CerebroDashboardKpiDto> => {
    const response = await apiClient.get<CerebroDashboardKpiDto>('cerebro/kpis/dashboard', { params });
    return response.data;
  },

  getVehiculosTelemetria: async (params?: VehiculoTelemetriaParams): Promise<ListaPaginada<VehiculoTelemetriaKpiDto>> => {
    const response = await apiClient.get<ListaPaginada<VehiculoTelemetriaKpiDto>>('cerebro/kpis/vehiculos', { params });
    return response.data;
  },
};
