import { apiClient } from '@/services/http/apiClient';
import type {
  PreferenciasNotificacionDto,
  ActualizarPreferenciasRequest,
  EnviarCodigoRequest,
  VerificarTelefonoRequest,
} from '../types';

const BASE = 'preferencias-notificacion';

export const preferenciasNotificacionApi = {
  obtener: async (): Promise<PreferenciasNotificacionDto> => {
    const response = await apiClient.get<PreferenciasNotificacionDto>(BASE);
    return response.data;
  },

  actualizar: async (data: ActualizarPreferenciasRequest): Promise<PreferenciasNotificacionDto> => {
    const response = await apiClient.put<PreferenciasNotificacionDto>(BASE, data);
    return response.data;
  },

  enviarCodigoWhatsApp: async (data: EnviarCodigoRequest): Promise<void> => {
    await apiClient.post(`${BASE}/whatsapp/enviar-codigo`, data);
  },

  verificarTelefono: async (data: VerificarTelefonoRequest): Promise<PreferenciasNotificacionDto> => {
    const response = await apiClient.post<PreferenciasNotificacionDto>(`${BASE}/whatsapp/verificar`, data);
    return response.data;
  },
};
