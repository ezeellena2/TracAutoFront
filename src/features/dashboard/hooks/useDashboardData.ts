import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { dashboardApi } from '../api/dashboard.api';
import { useTenantStore } from '@/store';
import { ModuloSistema } from '@/shared/types/api';

export function useDashboardData() {
  const queryClient = useQueryClient();
  const tieneModulo = useTenantStore((s) => s.tieneModulo);
  const tieneTelematica = tieneModulo(ModuloSistema.Telematica);

  const {
    data: kpis,
    isLoading: isLoadingKpis,
    error: errorKpis,
  } = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => dashboardApi.getKpis(),
    staleTime: 30 * 1000,
    enabled: tieneTelematica,
  });

  const {
    data: alertasRecientes,
    isLoading: isLoadingAlertas,
    error: errorAlertas,
  } = useQuery({
    queryKey: ['dashboard', 'alertas-recientes'],
    queryFn: () => dashboardApi.getAlertasRecientes(),
    staleTime: 30 * 1000,
    enabled: tieneTelematica,
  });

  const {
    data: alertasNoLeidas,
    isLoading: isLoadingNoLeidas,
    error: errorNoLeidas,
  } = useQuery({
    queryKey: ['dashboard', 'alertas-no-leidas-count'],
    queryFn: () => dashboardApi.getContadorAlertasNoLeidas(),
    staleTime: 30 * 1000,
    enabled: tieneTelematica,
  });

  const isLoading = tieneTelematica && (isLoadingKpis || isLoadingAlertas || isLoadingNoLeidas);
  const error = errorKpis || errorAlertas || errorNoLeidas;

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, [queryClient]);

  return {
    kpis,
    alertasRecientes,
    alertasNoLeidas,
    isLoading,
    error,
    refetch,
    tieneTelematica,
  };
}
