import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { obdApi } from '../api/obd.api';
import type { VehiculoTelemetriaParams } from '../types';

const KEYS = {
  dashboard: ['obd', 'dashboard'] as const,
  latest: ['obd', 'latest'] as const,
  vehiculos: ['obd', 'vehiculos'] as const,
};

export function useOBDDashboard() {
  const dashboardQuery = useQuery({
    queryKey: KEYS.dashboard,
    queryFn: () => obdApi.getDashboardKpis(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    kpis: dashboardQuery.data ?? null,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  };
}

export function useOBDLatest(vehiculoId?: string) {
  const snapshotQuery = useQuery({
    queryKey: [...KEYS.latest, vehiculoId],
    queryFn: () => obdApi.getLatestSnapshot(vehiculoId ? { vehiculoId } : undefined),
    staleTime: 30 * 1000,
    enabled: !!vehiculoId,
  });

  return {
    snapshot: snapshotQuery.data ?? null,
    isLoading: snapshotQuery.isLoading,
    error: snapshotQuery.error,
  };
}

export function useVehiculosTelemetria(pageSize = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const params: VehiculoTelemetriaParams = {
    numeroPagina: currentPage,
    tamanoPagina: pageSize,
    descendente: true,
    soloConTelemetria: true,
  };

  const query = useQuery({
    queryKey: [...KEYS.vehiculos, params],
    queryFn: () => obdApi.getVehiculosTelemetria(params),
    staleTime: 5 * 60 * 1000,
  });

  return {
    vehiculos: query.data?.items ?? [],
    totalRegistros: query.data?.totalRegistros ?? 0,
    totalPaginas: query.data?.totalPaginas ?? 0,
    paginaActual: query.data?.paginaActual ?? 1,
    isLoading: query.isLoading,
    error: query.error,
    setPage: setCurrentPage,
  };
}
