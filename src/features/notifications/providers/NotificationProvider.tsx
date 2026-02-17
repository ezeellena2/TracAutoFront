import { useEffect, useRef } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { env } from '@/config/env';
import { notificacionesApi } from '@/services/endpoints';
import { useAuthStore, useNotificationsStore } from '@/store';
import { toast } from '@/store/toast.store';
import type { NotificacionDto } from '@/shared/types/notifications';

function getHubBaseUrl(): string {
  return env.apiBaseUrl.replace(/\/api\/?$/, '');
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuthStore();
  const {
    setConnectionState,
    setUnreadCount,
    setRecent,
    appendNotification,
    setLoading,
    reset,
  } = useNotificationsStore();

  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      reset();
      return;
    }

    let disposed = false;

    const hydrate = async () => {
      try {
        setLoading(true);
        const [count, recentPage] = await Promise.all([
          notificacionesApi.getUnreadCount(),
          notificacionesApi.getNotificaciones({ numeroPagina: 1, tamanoPagina: 20, archivadas: false }),
        ]);
        if (disposed) return;
        setUnreadCount(count);
        setRecent(recentPage.items);
      } catch (error) {
        console.error('Error hydrating notifications:', error);
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    const startConnection = async () => {
      if (connectionRef.current && connectionRef.current.state !== HubConnectionState.Disconnected) {
        return;
      }

      setConnectionState('connecting');
      const connection = new HubConnectionBuilder()
        .withUrl(`${getHubBaseUrl()}/hubs/notifications`, {
          accessTokenFactory: () => token ?? '',
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
        .configureLogging(LogLevel.Warning)
        .build();

      connection.on('RecibirNotificacion', (payload: NotificacionDto) => {
        appendNotification(payload);
        toast.info(payload.titulo);
      });

      connection.on('ActualizarContadorUnread', (count: number) => {
        setUnreadCount(count);
      });

      connection.onreconnecting(() => setConnectionState('reconnecting'));
      connection.onreconnected(async () => {
        setConnectionState('connected');
        try {
          const count = await notificacionesApi.getUnreadCount();
          if (!disposed) setUnreadCount(count);
        } catch {
          // no-op
        }
      });
      connection.onclose(() => setConnectionState('disconnected'));

      await connection.start();
      connectionRef.current = connection;
      setConnectionState('connected');
    };

    (async () => {
      await hydrate();
      await startConnection();
    })().catch(() => {
      setConnectionState('disconnected');
    });

    return () => {
      disposed = true;
      if (connectionRef.current) {
        void connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [
    isAuthenticated,
    token,
    setConnectionState,
    setUnreadCount,
    setRecent,
    appendNotification,
    setLoading,
    reset,
  ]);

  return <>{children}</>;
}
