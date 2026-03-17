import { apiClient } from '../http/apiClient';
import type { ListaPaginada, PaginacionParams } from '@/shared/types/api';
import type {
  ConductorScoreResumenDto,
  ScoreConduccionDto,
  ResumenScoringFlotaDto,
  ConfiguracionScoringDto,
  ConfigurarScoringRequest,
} from '@/features/scoring/types';

const BASE = 'scoring';

export interface GetScoresConductoresParams extends PaginacionParams {}

export interface GetHistorialParams {
  conductorId: string;
  fechaInicio: string;
  fechaFin: string;
}

export const scoringApi = {
  obtenerScoresConductores: async (
    params: GetScoresConductoresParams = {}
  ): Promise<ListaPaginada<ConductorScoreResumenDto>> => {
    const { numeroPagina = 1, tamanoPagina = 10 } = params;
    const response = await apiClient.get<ListaPaginada<ConductorScoreResumenDto>>(
      `${BASE}/conductores`,
      { params: { numeroPagina, tamanoPagina } }
    );
    return response.data;
  },

  obtenerHistorialConductor: async (
    params: GetHistorialParams
  ): Promise<ScoreConduccionDto[]> => {
    const { conductorId, fechaInicio, fechaFin } = params;
    const response = await apiClient.get<ScoreConduccionDto[]>(
      `${BASE}/conductores/${conductorId}/historial`,
      { params: { fechaInicio, fechaFin } }
    );
    return response.data;
  },

  obtenerResumenFlota: async (): Promise<ResumenScoringFlotaDto> => {
    const response = await apiClient.get<ResumenScoringFlotaDto>(
      `${BASE}/resumen`
    );
    return response.data;
  },

  obtenerConfiguracion: async (): Promise<ConfiguracionScoringDto> => {
    const response = await apiClient.get<ConfiguracionScoringDto>(
      `${BASE}/configuracion`
    );
    return response.data;
  },

  configurar: async (
    data: ConfigurarScoringRequest
  ): Promise<ConfiguracionScoringDto> => {
    const response = await apiClient.put<ConfiguracionScoringDto>(
      `${BASE}/configuracion`,
      data
    );
    return response.data;
  },
};
