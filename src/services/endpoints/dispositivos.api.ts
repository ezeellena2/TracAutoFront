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
import { DispositivoDto, ListaPaginada, PaginacionParams } from '@/shared/types/api';

const DISPOSITIVOS_BASE = 'dispositivos';

/**
 * Parámetros para obtener dispositivos
 */
export interface GetDispositivosParams extends PaginacionParams {
  soloActivos?: boolean;
  /** Si es true, solo retorna dispositivos propios (excluye compartidos/asociados) */
  soloPropios?: boolean;
}

/**
 * Obtiene la lista paginada de dispositivos de la organización actual
 * El backend filtra automáticamente por organizationId desde el token
 *
 * @returns ListaPaginada con dispositivos y metadata
 */
export async function getDispositivos(
  params: GetDispositivosParams = {}
): Promise<ListaPaginada<DispositivoDto>> {
  const { numeroPagina = 1, tamanoPagina = 10, soloActivos, soloPropios } = params;

  const queryParams: Record<string, string | number | boolean> = {
    numeroPagina,
    tamanoPagina,
  };

  if (soloActivos !== undefined) {
    queryParams.soloActivos = soloActivos;
  }

  if (soloPropios !== undefined) {
    queryParams.soloPropios = soloPropios;
  }

  const response = await apiClient.get<ListaPaginada<DispositivoDto>>(DISPOSITIVOS_BASE, {
    params: queryParams
  });
  return response.data;
}

/**
 * Crea un nuevo dispositivo vinculado a la organización actual
 * 
 * @param traccarDeviceId ID del dispositivo en Traccar (requerido)
 * @param alias Alias opcional para mostrar en TracAuto
 * @returns Dispositivo creado
 */
export async function createDispositivo(
  traccarDeviceId: number,
  alias?: string
): Promise<DispositivoDto> {
  const response = await apiClient.post<DispositivoDto>(
    DISPOSITIVOS_BASE,
    { traccarDeviceId, alias }
  );
  return response.data;
}

/**
 * Actualiza un dispositivo existente
 * 
 * @param id ID del dispositivo en TracAuto
 * @param alias Nuevo alias (opcional)
 * @param activo Estado activo/inactivo
 * @returns Dispositivo actualizado
 */
export async function updateDispositivo(
  id: string,
  alias: string | undefined,
  activo: boolean
): Promise<DispositivoDto> {
  const response = await apiClient.put<DispositivoDto>(
    `${DISPOSITIVOS_BASE}/${id}`,
    { alias, activo }
  );
  return response.data;
}

/**
 * Elimina un dispositivo (soft delete: marca Activo = false)
 * 
 * @param id ID del dispositivo en TracAuto
 */
export async function deleteDispositivo(id: string): Promise<void> {
  await apiClient.delete(`${DISPOSITIVOS_BASE}/${id}`);
}

/**
 * Objeto API exportado (patrón consistente con otros endpoints)
 */
export const dispositivosApi = {
  getDispositivos,
  createDispositivo,
  updateDispositivo,
  deleteDispositivo,
};
