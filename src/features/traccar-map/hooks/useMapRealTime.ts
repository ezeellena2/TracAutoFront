import { useEffect, useRef, useCallback } from 'react';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { env } from '@/config/env';
import { useAuthStore } from '@/store';
import { useTraccarMapStore } from '../store/traccarMap.store';
import { getVehiclePositions } from '@/services/traccar/traccarMap.api';
import type { VehiclePosition } from '../types';

interface PosicionVehiculoRealTime {
  vehiculoId: string;
  patente: string | null;
  latitud: number;
  longitud: number;
  velocidad: number;
  rumbo: number;
  timestamp: string;
}

function getHubBaseUrl(): string {
  return env.apiBaseUrl.replace(/\/api\/?$/, '');
}

const POLLING_INTERVAL_MS = 15_000;

export function useMapRealTime() {
  const { isAuthenticated } = useAuthStore();
  const { setVehicles, vehicles } = useTraccarMapStore();

  const connectionRef = useRef<HubConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disposedRef = useRef(false);
  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;

  const updateVehiclePosition = useCallback((data: PosicionVehiculoRealTime) => {
    const current = vehiclesRef.current;
    const updated = current.map((v: VehiclePosition) => {
      if (v.id === data.vehiculoId) {
        return {
          ...v,
          latitud: data.latitud,
          longitud: data.longitud,
          velocidad: data.velocidad,
          lastUpdate: new Date(data.timestamp),
          estado: 'online' as const,
        };
      }
      return v;
    });

    if (updated !== current) {
      setVehicles(updated);
    }
  }, [setVehicles]);

  const fetchAll = useCallback(async () => {
    try {
      const data = await getVehiclePositions();
      if (!disposedRef.current) {
        setVehicles(data);
      }
    } catch {
      // Silenciar errores de polling — la carga inicial ya manejar errores
    }
  }, [setVehicles]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(fetchAll, POLLING_INTERVAL_MS);
  }, [fetchAll]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    // FIX H-F5: Verificar token desde store; no usar `token` como dependencia
    // para evitar reconexiones innecesarias tras refresh silencioso
    if (!isAuthenticated || !useAuthStore.getState().token) return;
    disposedRef.current = false;

    const init = async () => {
      try {
        // FIX H-F5: Leer token fresco del store en cada reconexion.
        // Capturar `token` por closure causaba que tras un refresh silencioso
        // el accessTokenFactory enviara el token viejo (expirado).
        const connection = new HubConnectionBuilder()
          .withUrl(`${getHubBaseUrl()}/hubs/vehiculos-posicion`, {
            accessTokenFactory: () => useAuthStore.getState().token ?? '',
          })
          .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
          .configureLogging(LogLevel.Warning)
          .build();

        connection.on('ActualizarPosicionVehiculo', (data: PosicionVehiculoRealTime) => {
          if (!disposedRef.current) {
            updateVehiclePosition(data);
          }
        });

        connection.onreconnecting(() => {
          if (!disposedRef.current) startPolling();
        });

        connection.onreconnected(() => {
          if (!disposedRef.current) {
            stopPolling();
            void fetchAll();
          }
        });

        connection.onclose(() => {
          if (!disposedRef.current) startPolling();
        });

        await connection.start();
        connectionRef.current = connection;
        stopPolling();
      } catch {
        if (!disposedRef.current) {
          startPolling();
        }
      }
    };

    void init();

    return () => {
      disposedRef.current = true;
      stopPolling();
      if (connectionRef.current && connectionRef.current.state !== HubConnectionState.Disconnected) {
        void connectionRef.current.stop();
      }
      connectionRef.current = null;
    };
  // NOTA: `token` eliminado del array de dependencias intencionalmente.
  // El accessTokenFactory lee el token fresco del store, asi que no es
  // necesario reconectar cuando cambia (ej. tras un refresh silencioso).
  }, [isAuthenticated, updateVehiclePosition, fetchAll, startPolling, stopPolling]);
}
