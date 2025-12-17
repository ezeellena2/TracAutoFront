/**
 * Servicio de endpoints de dispositivos
 * Conecta con DispositivosController del backend
 *
 * IMPORTANTE:
 * - El backend ya filtra por organizationId (desde el JWT)
 * - El frontend NO envía organizationId
 * - Solo renderiza lo que el backend devuelve
 */

import { apiClient } from '../http/apiClient';
import { DispositivoDto } from '@/shared/types/api';

const DISPOSITIVOS_BASE = 'dispositivos';

/**
 * Obtiene la lista de dispositivos de la organización actual
 * El backend filtra automáticamente por organizationId desde el token
 *
 * @returns Lista de dispositivos (solo los de la organización del usuario)
 */
export async function getDispositivos(): Promise<DispositivoDto[]> {
  const response = await apiClient.get<DispositivoDto[]>(DISPOSITIVOS_BASE);
  return response.data;
}

/**
 * Objeto API exportado (patrón consistente con otros endpoints)
 */
export const dispositivosApi = {
  getDispositivos,
};
