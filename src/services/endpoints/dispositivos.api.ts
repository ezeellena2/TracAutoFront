import { apiClient, publicApiClient } from '../http/apiClient';
import { useAuthStore } from '@/store';
import {
  DispositivoDto,
  ListaPaginada,
  PaginacionParams,
  RecursoSharingStatusDto,
  ActualizarComparticionRequest,
  CambiarEstadoStockRequest,
  HistorialStockDispositivoDto,
  DispositivoQrPublicoDto,
} from '@/shared/types/api';

const DISPOSITIVOS_BASE = 'dispositivos';

function getDispositivosBase() {
  const user = useAuthStore.getState().user;
  const isPersonalContext =
    user?.contextoActivo?.tipo === 'Personal' ||
    (!!user && !user.organizationId);
  return isPersonalContext ? 'personal/dispositivos' : DISPOSITIVOS_BASE;
}

/**
 * Parámetros para obtener dispositivos
 */
export interface GetDispositivosParams extends PaginacionParams {
  soloActivos?: boolean;
  /** Si es true, solo retorna dispositivos propios (excluye compartidos/asociados) */
  soloPropios?: boolean;
  /** Filtrar por ID específico. Útil para navegación directa desde tabla de conductores. */
  filtroId?: string;
}

/**
 * Obtiene la lista paginada de dispositivos de la organización actual
 */
export async function getDispositivos(
  params: GetDispositivosParams = {}
): Promise<ListaPaginada<DispositivoDto>> {
  const { numeroPagina = 1, tamanoPagina = 10, soloActivos, soloPropios, filtroId } = params;

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

  if (filtroId !== undefined) {
    queryParams.filtroId = filtroId;
  }

  const response = await apiClient.get<ListaPaginada<DispositivoDto>>(getDispositivosBase(), {
    params: queryParams
  });
  return response.data;
}

/**
 * Crea un nuevo dispositivo vinculado a la organización actual
 *
 * @param traccarDeviceId ID del dispositivo en Traccar (requerido)
 * @param alias Alias opcional para mostrar en TracAuto
 * @param numeroTelefono Número opcional en E.164 (ej. +5491112345678). El backend normaliza.
 * @returns Dispositivo creado
 */
export async function createDispositivo(
  traccarDeviceId: number,
  alias?: string,
  numeroTelefono?: string | null
): Promise<DispositivoDto> {
  const body = {
    traccarDeviceId: String(traccarDeviceId),
    alias: alias ?? null,
    numeroTelefono: numeroTelefono ?? null,
  };
  const response = await apiClient.post<DispositivoDto>(getDispositivosBase(), body);
  return response.data;
}

/**
 * Actualiza un dispositivo existente
 *
 * @param id ID del dispositivo en TracAuto
 * @param alias Nuevo alias (opcional)
 * @param activo Estado activo/inactivo
 * @param numeroTelefono Número opcional en E.164. El backend normaliza.
 * @returns Dispositivo actualizado
 */
export async function updateDispositivo(
  id: string,
  alias: string | undefined,
  activo: boolean,
  numeroTelefono?: string | null
): Promise<DispositivoDto> {
  const response = await apiClient.put<DispositivoDto>(
    `${getDispositivosBase()}/${id}`,
    { alias, activo, numeroTelefono: numeroTelefono ?? undefined }
  );
  return response.data;
}

/**
 * Elimina un dispositivo (soft delete: marca Activo = false)
 * 
 * @param id ID del dispositivo en TracAuto
 */
export async function deleteDispositivo(id: string): Promise<void> {
  await apiClient.delete(`${getDispositivosBase()}/${id}`);
}

// ========================================
// FUNCIONES DE COMPARTICIÓN
// ========================================

/**
 * Obtiene el estado de compartición de un dispositivo.
 * Muestra todas las relaciones activas y si el dispositivo está compartido/excluido en cada una.
 */
export async function getSharingStatus(dispositivoId: string): Promise<RecursoSharingStatusDto> {
  const response = await apiClient.get<RecursoSharingStatusDto>(
    `${DISPOSITIVOS_BASE}/${dispositivoId}/sharing`
  );
  return response.data;
}

/**
 * Actualiza el estado de compartición de un dispositivo.
 * Permite compartir, descompartir y excluir el dispositivo en múltiples relaciones.
 */
export async function updateSharingStatus(
  dispositivoId: string,
  request: ActualizarComparticionRequest
): Promise<void> {
  await apiClient.put(`${DISPOSITIVOS_BASE}/${dispositivoId}/sharing`, request);
}

// ========================================
// STOCK & QR CODE FUNCTIONS
// ========================================

/**
 * Cambia el estado de stock de un dispositivo y registra el movimiento en el historial.
 */
export async function cambiarEstadoStock(
  dispositivoId: string,
  request: CambiarEstadoStockRequest
): Promise<void> {
  await apiClient.post(`${DISPOSITIVOS_BASE}/${dispositivoId}/stock`, request);
}

/**
 * Obtiene el historial de cambios de estado de stock de un dispositivo.
 */
export async function getHistorialStock(
  dispositivoId: string
): Promise<HistorialStockDispositivoDto[]> {
  const response = await apiClient.get<HistorialStockDispositivoDto[]>(
    `${DISPOSITIVOS_BASE}/${dispositivoId}/stock/historial`
  );
  return response.data;
}

/**
 * Genera la URL para descargar la imagen QR de un dispositivo.
 */
export function getQrImageUrl(dispositivoId: string): string {
  return `${DISPOSITIVOS_BASE}/${dispositivoId}/qr`;
}

/**
 * Descarga la imagen QR de un dispositivo como blob.
 */
export async function downloadQrImage(dispositivoId: string): Promise<Blob> {
  const response = await apiClient.get(`${DISPOSITIVOS_BASE}/${dispositivoId}/qr`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Descarga el PDF de etiqueta QR de un dispositivo.
 */
export async function downloadEtiquetaQrPdf(dispositivoId: string): Promise<Blob> {
  const response = await apiClient.get(`${DISPOSITIVOS_BASE}/${dispositivoId}/qr/etiqueta`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Obtiene información pública de un dispositivo por su código QR (sin autenticación).
 */
export async function getDispositivoPublico(
  codigoQr: string
): Promise<DispositivoQrPublicoDto> {
  const response = await publicApiClient.get<DispositivoQrPublicoDto>(
    `dispositivopublico/${codigoQr}`
  );
  return response.data;
}

/**
 * Objeto API exportado (patrón consistente con otros endpoints)
 */
export const dispositivosApi = {
  getDispositivos,
  createDispositivo,
  updateDispositivo,
  deleteDispositivo,
  getSharingStatus,
  updateSharingStatus,
  cambiarEstadoStock,
  getHistorialStock,
  getQrImageUrl,
  downloadQrImage,
  downloadEtiquetaQrPdf,
  getDispositivoPublico,
};
