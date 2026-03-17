import { apiClient } from '../http/apiClient';

const BASE_URL = '/indices';

/** DTO de cotización dólar blue (proxy DolarAPI). */
export interface DolarIndiceDto {
  compra: number;
  venta: number;
  fechaActualizacion: string;
  casa?: string;
}

/** DTO último valor riesgo país Argentina (proxy Anduin). */
export interface RiesgoPaisIndiceDto {
  valor: number;
  fecha: string;
  timestamp?: string;
}

/** DTO agregado para el header (un único request). */
export interface IndicesAgregadoDto {
  dolar: DolarIndiceDto | null;
  riesgoPais: RiesgoPaisIndiceDto | null;
}

export const indicesApi = {
  /**
   * GET /api/v1/indices — Dólar blue y riesgo país en un único request (para el header).
   */
  getIndices: async (): Promise<IndicesAgregadoDto> => {
    const response = await apiClient.get<IndicesAgregadoDto>(BASE_URL);
    return response.data;
  },
};
