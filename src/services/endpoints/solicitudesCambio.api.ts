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

export async function crearSolicitud(data: CrearSolicitudRequest): Promise<SolicitudCambioDto> {
  const res = await apiClient.post<SolicitudCambioDto>(BASE, data);
  return res.data;
}

export async function obtenerSolicitud(id: string): Promise<SolicitudCambioDto> {
  const res = await apiClient.get<SolicitudCambioDto>(`${BASE}/${id}`);
  return res.data;
}

export async function listarSolicitudes(params?: {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
}): Promise<ListaPaginada<SolicitudCambioDto>> {
  const res = await apiClient.get<ListaPaginada<SolicitudCambioDto>>(BASE, { params: params ?? {} });
  return res.data;
}

export async function agregarMensaje(
  solicitudId: string,
  data: AgregarMensajeRequest
): Promise<SolicitudCambioDto> {
  const res = await apiClient.post<SolicitudCambioDto>(`${BASE}/${solicitudId}/mensajes`, data);
  return res.data;
}

export async function enviarSolicitud(solicitudId: string): Promise<SolicitudCambioDto> {
  const res = await apiClient.post<SolicitudCambioDto>(`${BASE}/${solicitudId}/enviar`);
  return res.data;
}

export const solicitudesCambioApi = {
  crear: crearSolicitud,
  obtener: obtenerSolicitud,
  listar: listarSolicitudes,
  agregarMensaje,
  enviar: enviarSolicitud,
};
