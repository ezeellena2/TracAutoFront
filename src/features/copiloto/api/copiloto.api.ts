import { apiClient } from '@/services/http/apiClient';
import type {
  RespuestaCopilotoDto,
  ConversacionCopilotoDto,
  MensajeCopilotoDto,
  UsoDiarioCopilotoDto,
  EnviarMensajeRequest,
} from '../types';

const BASE = 'copiloto';

export const copilotoApi = {
  enviarMensaje: async (request: EnviarMensajeRequest): Promise<RespuestaCopilotoDto> => {
    const response = await apiClient.post<RespuestaCopilotoDto>(`${BASE}/mensajes`, request);
    return response.data;
  },

  obtenerConversaciones: async (): Promise<ConversacionCopilotoDto[]> => {
    const response = await apiClient.get<ConversacionCopilotoDto[]>(`${BASE}/conversaciones`);
    return response.data;
  },

  obtenerMensajes: async (conversacionId: string): Promise<MensajeCopilotoDto[]> => {
    const response = await apiClient.get<MensajeCopilotoDto[]>(
      `${BASE}/conversaciones/${conversacionId}/mensajes`
    );
    return response.data;
  },

  eliminarConversacion: async (conversacionId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/conversaciones/${conversacionId}`);
  },

  obtenerUsoDiario: async (): Promise<UsoDiarioCopilotoDto> => {
    const response = await apiClient.get<UsoDiarioCopilotoDto>(`${BASE}/uso-diario`);
    return response.data;
  },
};
