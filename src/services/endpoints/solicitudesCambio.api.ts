/**
 * Solicitudes de Cambio API
 * Endpoints para crear, obtener, listar y agregar mensajes al chat.
 */

import { apiClient } from '../http/apiClient';
import type {
  SolicitudCambioDto,
  CrearSolicitudRequest,
  AgregarMensajeRequest,
  ListaPaginada,
} from '@/shared/types/api';

const BASE = 'solicitudes-cambio';

/**
 * Crea una nueva solicitud de cambio.
 * @param data - Datos de la solicitud a crear (route, crKey, label, entityType, entityId, mensajeInicial)
 * @returns Promise que resuelve con la solicitud creada
 * @throws Error si la creación falla
 */
export async function crearSolicitud(data: CrearSolicitudRequest): Promise<SolicitudCambioDto> {
  const res = await apiClient.post<SolicitudCambioDto>(BASE, data);
  return res.data;
}

/**
 * Obtiene una solicitud de cambio por ID.
 * @param id - ID de la solicitud a obtener
 * @returns Promise que resuelve con la solicitud encontrada
 * @throws Error si la solicitud no existe o no se tiene acceso
 */
export async function obtenerSolicitud(id: string): Promise<SolicitudCambioDto> {
  const res = await apiClient.get<SolicitudCambioDto>(`${BASE}/${id}`);
  return res.data;
}

/**
 * Lista solicitudes de cambio con paginación.
 * @param params - Parámetros de paginación y filtrado (opcional)
 * @param params.numeroPagina - Número de página (por defecto: 1)
 * @param params.tamanoPagina - Tamaño de página (por defecto: 10)
 * @param params.ordenarPor - Campo por el cual ordenar (por defecto: 'FechaCreacion')
 * @param params.descendente - Si el orden es descendente (por defecto: true)
 * @returns Promise que resuelve con la lista paginada de solicitudes
 * @throws Error si la consulta falla
 */
export async function listarSolicitudes(params?: {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
}): Promise<ListaPaginada<SolicitudCambioDto>> {
  const res = await apiClient.get<ListaPaginada<SolicitudCambioDto>>(BASE, { params: params ?? {} });
  return res.data;
}

/**
 * Agrega un mensaje al chat de una solicitud de cambio.
 * El backend procesará el mensaje con OpenAI y generará una respuesta del assistant.
 * @param solicitudId - ID de la solicitud a la que se agregará el mensaje
 * @param data - Contenido del mensaje a agregar
 * @returns Promise que resuelve con la solicitud actualizada (incluye la respuesta del assistant)
 * @throws Error si la solicitud no existe, no está en estado válido, o falla el procesamiento
 */
export async function agregarMensaje(
  solicitudId: string,
  data: AgregarMensajeRequest
): Promise<SolicitudCambioDto> {
  const res = await apiClient.post<SolicitudCambioDto>(`${BASE}/${solicitudId}/mensajes`, data);
  return res.data;
}

/**
 * Envía una solicitud de cambio a Jira.
 * La solicitud debe estar en estado Ready. Se marca como Submitted y se encola un job para crear el issue.
 * @param solicitudId - ID de la solicitud a enviar
 * @returns Promise que resuelve con la solicitud actualizada (con estado Submitted)
 * @throws Error si la solicitud no existe, no está en estado Ready, o ya fue enviada
 */
export async function enviarSolicitud(solicitudId: string): Promise<SolicitudCambioDto> {
  const res = await apiClient.post<SolicitudCambioDto>(`${BASE}/${solicitudId}/enviar`);
  return res.data;
}

/**
 * Borra una solicitud de cambio.
 * Si tiene ticket de Jira asociado, también lo borra (requiere forceDelete=true para solicitudes exportadas).
 * @param solicitudId - ID de la solicitud a borrar
 * @param forceDelete - Si es true, permite borrar solicitudes en estado Exported (por defecto: false)
 * @returns Promise que se resuelve cuando la solicitud es borrada
 * @throws Error si la solicitud no existe, no se tiene permiso, o requiere forceDelete para estado Exported
 */
export async function borrarSolicitud(solicitudId: string, forceDelete: boolean = false): Promise<void> {
  await apiClient.delete(`${BASE}/${solicitudId}`, { params: { forceDelete } });
}

export const solicitudesCambioApi = {
  crear: crearSolicitud,
  obtener: obtenerSolicitud,
  listar: listarSolicitudes,
  agregarMensaje,
  enviar: enviarSolicitud,
  borrar: borrarSolicitud,
};
