import { apiClient } from '@/services/http/apiClient';
import type {
  ReglaAlertaDto,
  ListaPaginada,
  ListReglasAlertaParams,
  CreateReglaAlertaCommand,
  UpdateReglaAlertaCommand,
} from '../types';

const BASE = 'cerebro/reglas';

export const alertRulesApi = {
  list: async (params?: ListReglasAlertaParams): Promise<ListaPaginada<ReglaAlertaDto>> => {
    const response = await apiClient.get<ListaPaginada<ReglaAlertaDto>>(BASE, { params });
    return response.data;
  },

  getById: async (id: string): Promise<ReglaAlertaDto> => {
    const response = await apiClient.get<ReglaAlertaDto>(`${BASE}/${id}`);
    return response.data;
  },

  create: async (command: CreateReglaAlertaCommand): Promise<ReglaAlertaDto> => {
    const response = await apiClient.post<ReglaAlertaDto>(BASE, command);
    return response.data;
  },

  update: async (id: string, command: UpdateReglaAlertaCommand): Promise<ReglaAlertaDto> => {
    const response = await apiClient.put<ReglaAlertaDto>(`${BASE}/${id}`, command);
    return response.data;
  },

  toggle: async (id: string): Promise<boolean> => {
    const response = await apiClient.post<boolean>(`${BASE}/${id}/toggle`);
    return response.data;
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await apiClient.delete<boolean>(`${BASE}/${id}`);
    return response.data;
  },
};
