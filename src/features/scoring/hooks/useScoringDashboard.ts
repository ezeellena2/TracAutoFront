import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { scoringApi } from '@/services/endpoints/scoring.api';

const QUERY_KEY = 'scoring';

export function useScoringDashboard() {
  const queryClient = useQueryClient();

  const {
    data: resumen,
    isLoading: isLoadingResumen,
    error: errorResumen,
  } = useQuery({
    queryKey: [QUERY_KEY, 'resumen'],
    queryFn: () => scoringApi.obtenerResumenFlota(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: conductores,
    isLoading: isLoadingConductores,
    error: errorConductores,
  } = useQuery({
    queryKey: [QUERY_KEY, 'conductores', { numeroPagina: 1, tamanoPagina: 10 }],
    queryFn: () => scoringApi.obtenerScoresConductores({ numeroPagina: 1, tamanoPagina: 10 }),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingResumen || isLoadingConductores;
  const error = errorResumen || errorConductores;

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  return {
    resumen,
    conductores,
    isLoading,
    error,
    refetch,
  };
}
