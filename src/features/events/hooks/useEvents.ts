import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { eventsApi } from '../api/events.api';
import type { AlertasParams, EstadoAlertaCerebro } from '@/features/dashboard/types';

interface UseEventsParams {
  estado?: EstadoAlertaCerebro;
  pagina?: number;
  tamanoPagina?: number;
}

export function useEvents({ estado, pagina = 1, tamanoPagina = 20 }: UseEventsParams = {}) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(pagina);

  const params: AlertasParams = {
    numeroPagina: currentPage,
    tamanoPagina,
    descendente: true,
    ...(estado != null && { estado }),
  };

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['events', 'alertas', params],
    queryFn: () => eventsApi.getAlertas(params),
    staleTime: 30 * 1000,
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => eventsApi.resolverAlerta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => eventsApi.marcarLeida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
  }, [queryClient]);

  return {
    alertas: data?.items ?? [],
    totalRegistros: data?.totalRegistros ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
    paginaActual: data?.paginaActual ?? 1,
    isLoading,
    error,
    refetch,
    resolveAlerta: resolveMutation.mutate,
    isResolving: resolveMutation.isPending,
    markRead: markReadMutation.mutate,
    setPage: setCurrentPage,
  };
}
