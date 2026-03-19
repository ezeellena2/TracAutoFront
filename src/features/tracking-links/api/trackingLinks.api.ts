import { apiClient } from '@/services/http/apiClient';
import { publicApiClient } from '@/services/http/publicApiClient';
import type {
  LinkTrackingDto,
  CrearLinkTrackingRequest,
  CrearLinkTrackingResponse,
  ExtenderLinkTrackingRequest,
  ExtenderLinkTrackingResponse,
  PosicionPublicaDto,
} from '../types';

const BASE = 'link-tracking';

interface ListarLinksTrackingParams {
  soloActivos?: boolean;
  vehiculoId?: string;
  reservaAlquilerId?: string;
}

export const trackingLinksApi = {
  listar: async (params?: ListarLinksTrackingParams): Promise<LinkTrackingDto[]> => {
    const response = await apiClient.get<LinkTrackingDto[]>(BASE, { params });
    return response.data;
  },

  crear: async (request: CrearLinkTrackingRequest): Promise<CrearLinkTrackingResponse> => {
    const response = await apiClient.post<CrearLinkTrackingResponse>(BASE, request);
    return response.data;
  },

  revocar: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`);
  },

  extender: async (id: string, request: ExtenderLinkTrackingRequest): Promise<ExtenderLinkTrackingResponse> => {
    const response = await apiClient.patch<ExtenderLinkTrackingResponse>(`${BASE}/${id}/extender`, request);
    return response.data;
  },
};

export const trackingPublicoApi = {
  obtenerPosicion: async (token: string): Promise<PosicionPublicaDto> => {
    const response = await publicApiClient.get<PosicionPublicaDto>(`tracking/${token}`);
    return response.data;
  },
};
