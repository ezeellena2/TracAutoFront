import { useCallback } from 'react';
import { notificacionesApi } from '@/services/endpoints';
import { toast, useNotificationsStore } from '@/store';

export function useNotifications() {
  const {
    recent,
    unreadCount,
    connectionState,
    isLoading,
    markAsReadOptimistic,
    markAllAsReadOptimistic,
    archivarOptimistic,
    setRecent,
    setUnreadCount,
  } = useNotificationsStore();

  const syncFromServer = useCallback(async () => {
    const [count, recentPage] = await Promise.all([
      notificacionesApi.getUnreadCount(),
      notificacionesApi.getNotificaciones({ numeroPagina: 1, tamanoPagina: 20, archivadas: false }),
    ]);
    setUnreadCount(count);
    setRecent(recentPage.items);
  }, [setRecent, setUnreadCount]);

  const markAsRead = useCallback(
    async (id: string) => {
      markAsReadOptimistic(id);
      try {
        await notificacionesApi.markAsRead(id);
      } catch (error) {
        await syncFromServer();
        toast.error(error instanceof Error ? error.message : 'No se pudo marcar como leída');
      }
    },
    [markAsReadOptimistic, syncFromServer]
  );

  const markAllAsRead = useCallback(async () => {
    markAllAsReadOptimistic();
    try {
      await notificacionesApi.markAllAsRead();
    } catch (error) {
      await syncFromServer();
      toast.error(error instanceof Error ? error.message : 'No se pudieron marcar como leídas');
    }
  }, [markAllAsReadOptimistic, syncFromServer]);

  const archivar = useCallback(
    async (id: string) => {
      archivarOptimistic(id);
      try {
        await notificacionesApi.archivar(id);
      } catch (error) {
        await syncFromServer();
        toast.error(error instanceof Error ? error.message : 'No se pudo archivar');
      }
    },
    [archivarOptimistic, syncFromServer]
  );

  return {
    recent,
    unreadCount,
    connectionState,
    isLoading,
    markAsRead,
    markAllAsRead,
    archivar,
    syncFromServer,
  };
}
