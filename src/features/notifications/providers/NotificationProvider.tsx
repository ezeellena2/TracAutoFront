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
      } catch {
        if (!disposed) {
          setConnectionState('disconnected');
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    // Intervalos de reintento para conexión inicial (backoff progresivo)
    const INITIAL_RETRY_DELAYS = [0, 2000, 5000, 10000, 20000];

    const startConnection = async () => {
      if (connectionRef.current && connectionRef.current.state !== HubConnectionState.Disconnected) {
        return;
      }

      setConnectionState('connecting');
      const connection = new HubConnectionBuilder()
        .withUrl(`${getHubBaseUrl()}/hubs/notifications`, {
          // SEGURIDAD: Leer token fresco del store en cada reconexion.
          // Capturar `token` por closure causa que tras un refresh el
          // accessTokenFactory envie el token viejo (expirado).
          accessTokenFactory: () => useAuthStore.getState().token ?? '',
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

      // Reintento de conexión inicial con backoff progresivo.
      // withAutomaticReconnect solo cubre reconexiones tras una conexión exitosa;
      // si la conexión inicial falla, no reintenta automáticamente.
      // Si falla por CORS/red (TypeError: failed to fetch), no insistir para no saturar la consola.
      for (let attempt = 0; attempt < INITIAL_RETRY_DELAYS.length; attempt++) {
        if (disposed) return;
        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, INITIAL_RETRY_DELAYS[attempt]));
            if (disposed) return;
          }
          await connection.start();
          connectionRef.current = connection;
          setConnectionState('connected');
          return; // Conexión exitosa, salir del loop
        } catch (err) {
          const isCorsOrNetwork =
            err instanceof TypeError ||
            (err instanceof Error && (err.message.includes('fetch') || err.message.includes('Failed to fetch')));
          if (isCorsOrNetwork && attempt >= 1) {
            // CORS o red: no seguir reintentando (el backend debe permitir X-SignalR-User-Agent en CORS)
            setConnectionState('disconnected');
            return;
          }
          if (attempt === INITIAL_RETRY_DELAYS.length - 1) {
            setConnectionState('disconnected');
          }
        }
      }
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
  // NOTA: `token` eliminado del array de dependencias intencionalmente.
  // El accessTokenFactory lee el token fresco del store, asi que no es
  // necesario reconectar cuando cambia (ej. tras un refresh silencioso).
  // Reconectar por cambio de token causaba desconexiones innecesarias.
  }, [
    isAuthenticated,
    setConnectionState,
    setUnreadCount,
    setRecent,
    appendNotification,
    setLoading,
    reset,
  ]);

  return <>{children}</>;
}
