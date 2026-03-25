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
  dispositivoId?: string;
  nombre?: string;
  patente: string | null;
  latitud: number;
  longitud: number;
  velocidad: number;
  rumbo: number;
  timestamp: string;
  estado?: VehiclePosition['estado'];
}

function getHubBaseUrl(): string {
  return env.apiBaseUrl.replace(/\/api\/?$/, '');
}

const POLLING_INTERVAL_MS = 15_000;

export function useMapRealTime() {
  const { isAuthenticated, user } = useAuthStore();
  const { setVehicles, vehicles } = useTraccarMapStore();
  const contextKey = user
    ? `${user.id}:${user.contextoActivo.tipo}:${user.contextoActivo.id ?? 'personal'}`
    : 'anon';

  const connectionRef = useRef<HubConnection | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disposedRef = useRef(false);
  const vehiclesRef = useRef(vehicles);
  vehiclesRef.current = vehicles;

  const updateVehiclePosition = useCallback((data: PosicionVehiculoRealTime) => {
    const current = vehiclesRef.current;
    const resourceId = data.dispositivoId ?? data.vehiculoId;
    const updated = current.map((v: VehiclePosition) => {
      if (v.id === resourceId) {
        return {
          ...v,
          nombre: data.nombre ?? v.nombre,
          patente: data.patente ?? v.patente,
          latitud: data.latitud,
          longitud: data.longitud,
          velocidad: data.velocidad,
          lastUpdate: new Date(data.timestamp),
          estado: data.estado ?? 'online',
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
    if (!isAuthenticated || !useAuthStore.getState().token) return;
    disposedRef.current = false;
    void fetchAll();

    const init = async () => {
      try {
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
  }, [contextKey, isAuthenticated, updateVehiclePosition, fetchAll, startPolling, stopPolling]);
}
