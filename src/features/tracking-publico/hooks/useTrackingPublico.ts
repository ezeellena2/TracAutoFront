import { useEffect, useState, useCallback, useRef } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { env } from '@/config/env';
import { trackingPublicoApi } from '@/features/tracking-links/api';
import type { PosicionPublicaDto } from '@/features/tracking-links/types';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'polling';

function getHubBaseUrl(): string {
  return env.apiBaseUrl.replace(/\/api\/?$/, '');
}

interface UseTrackingPublicoResult {
  posicion: PosicionPublicaDto | null;
  error: string | null;
  isLoading: boolean;
  connectionState: ConnectionState;
}

export function useTrackingPublico(token: string | undefined): UseTrackingPublicoResult {
  const [posicion, setPosicion] = useState<PosicionPublicaDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');

  const connectionRef = useRef<HubConnection | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disposedRef = useRef(false);

  const fetchPosicion = useCallback(async () => {
    if (!token) return;
    try {
      const data = await trackingPublicoApi.obtenerPosicion(token);
      if (!disposedRef.current) {
        setPosicion(data);
        setError(null);
      }
    } catch {
      if (!disposedRef.current) {
        setError('invalid');
      }
    } finally {
      if (!disposedRef.current) {
        setIsLoading(false);
      }
    }
  }, [token]);

  const startPollingFallback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setConnectionState('polling');
    intervalRef.current = setInterval(fetchPosicion, 15_000);
  }, [fetchPosicion]);

  useEffect(() => {
    if (!token) return;
    disposedRef.current = false;

    const initSignalR = async () => {
      // Fetch inicial via REST
      await fetchPosicion();

      try {
        setConnectionState('connecting');

        const connection = new HubConnectionBuilder()
          .withUrl(`${getHubBaseUrl()}/hubs/tracking-publico`)
          .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(LogLevel.Warning)
          .build();

        connection.on('ActualizarPosicion', (data: PosicionPublicaDto) => {
          if (!disposedRef.current) {
            setPosicion(data);
            setError(null);
          }
        });

        connection.on('SuscripcionConfirmada', () => {
          if (!disposedRef.current) {
            setConnectionState('connected');
            // SignalR activo → detener polling
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        });

        connection.on('Error', () => {
          // Token inválido en hub → fallback a polling
          if (!disposedRef.current) {
            startPollingFallback();
          }
        });

        connection.onreconnecting(() => {
          if (!disposedRef.current) setConnectionState('reconnecting');
        });

        connection.onreconnected(async () => {
          if (!disposedRef.current) {
            setConnectionState('connecting');
            await connection.invoke('SuscribirseATracking', token);
          }
        });

        connection.onclose(() => {
          if (!disposedRef.current) {
            startPollingFallback();
          }
        });

        await connection.start();
        connectionRef.current = connection;

        // Suscribirse al token
        await connection.invoke('SuscribirseATracking', token);
      } catch {
        // SignalR falló → fallback a polling
        if (!disposedRef.current) {
          startPollingFallback();
        }
      }
    };

    void initSignalR();

    return () => {
      disposedRef.current = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (connectionRef.current) {
        if (connectionRef.current.state !== HubConnectionState.Disconnected) {
          void connectionRef.current.stop();
        }
        connectionRef.current = null;
      }
    };
  }, [token, fetchPosicion, startPollingFallback]);

  return { posicion, error, isLoading, connectionState };
}
