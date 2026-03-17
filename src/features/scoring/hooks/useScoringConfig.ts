import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scoringApi } from '@/services/endpoints/scoring.api';
import type { ConfigurarScoringRequest } from '@/features/scoring/types';

const QUERY_KEY = 'scoring';

export function useScoringConfig() {
  const queryClient = useQueryClient();

  const {
    data: configuracion,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY, 'configuracion'],
    queryFn: () => scoringApi.obtenerConfiguracion(),
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (data: ConfigurarScoringRequest) => scoringApi.configurar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  return {
    configuracion,
    isLoading,
    error,
    guardar: mutation.mutateAsync,
    isGuardando: mutation.isPending,
    errorGuardar: mutation.error,
  };
}
