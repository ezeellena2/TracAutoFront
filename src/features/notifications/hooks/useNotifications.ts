import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks';
import { notificacionesApi } from '@/services/endpoints';
import { toast, useNotificationsStore } from '@/store';

export function useNotifications() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
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
        const parsed = handleApiError(error, { showToast: false });
        toast.error(parsed.message || t('common.notifications.errorMarcarLeida'));
      }
    },
    [markAsReadOptimistic, syncFromServer, handleApiError]
  );

  const markAllAsRead = useCallback(async () => {
    markAllAsReadOptimistic();
    try {
      await notificacionesApi.markAllAsRead();
    } catch (error) {
      await syncFromServer();
      const parsed = handleApiError(error, { showToast: false });
        toast.error(parsed.message || t('common.notifications.errorMarcarTodas'));
    }
  }, [markAllAsReadOptimistic, syncFromServer, handleApiError]);

  const archivar = useCallback(
    async (id: string) => {
      archivarOptimistic(id);
      try {
        await notificacionesApi.archivar(id);
      } catch (error) {
        await syncFromServer();
        const parsed = handleApiError(error, { showToast: false });
        toast.error(parsed.message || t('common.notifications.errorArchivar'));
      }
    },
    [archivarOptimistic, syncFromServer, handleApiError]
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
