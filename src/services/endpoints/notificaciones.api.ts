import { apiClient } from '../http/apiClient';
import type { ListaPaginada } from '@/shared/types/api';
import type {
  CategoriaNotificacion,
  NotificacionDto,
} from '@/shared/types/notifications';

const NOTIFICACIONES_BASE = 'notificaciones';

export interface GetNotificacionesParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  leidas?: boolean;
  categoria?: CategoriaNotificacion;
  fechaDesde?: string;
  fechaHasta?: string;
  archivadas?: boolean;
}

export async function getNotificaciones(
  params: GetNotificacionesParams = {}
): Promise<ListaPaginada<NotificacionDto>> {
  const response = await apiClient.get<ListaPaginada<NotificacionDto>>(NOTIFICACIONES_BASE, {
    params: {
      numeroPagina: params.numeroPagina ?? 1,
      tamanoPagina: params.tamanoPagina ?? 10,
      ...(params.leidas !== undefined ? { leidas: params.leidas } : {}),
      ...(params.categoria !== undefined ? { categoria: params.categoria } : {}),
      ...(params.fechaDesde ? { fechaDesde: params.fechaDesde } : {}),
      ...(params.fechaHasta ? { fechaHasta: params.fechaHasta } : {}),
      ...(params.archivadas !== undefined ? { archivadas: params.archivadas } : {}),
    },
  });

  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<number>(`${NOTIFICACIONES_BASE}/unread-count`);
  return response.data;
}

export async function markAsRead(id: string): Promise<void> {
  await apiClient.put(`${NOTIFICACIONES_BASE}/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.put(`${NOTIFICACIONES_BASE}/read-all`);
}

export async function archivar(id: string): Promise<void> {
  await apiClient.delete(`${NOTIFICACIONES_BASE}/${id}`);
}

export const notificacionesApi = {
  getNotificaciones,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archivar,
};
