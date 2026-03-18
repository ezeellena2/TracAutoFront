import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { alertRulesApi } from '../api/alertRules.api';
import type {
  ListReglasAlertaParams,
  CreateReglaAlertaCommand,
  UpdateReglaAlertaCommand,
  TipoReglaAlerta,
} from '../types';

interface UseAlertRulesParams {
  tipo?: TipoReglaAlerta;
  soloActivas?: boolean;
  buscar?: string;
  pagina?: number;
  tamanoPagina?: number;
}

const QUERY_KEY = 'alert-rules';

export function useAlertRules({
  tipo,
  soloActivas,
  buscar,
  pagina = 1,
  tamanoPagina = 20,
}: UseAlertRulesParams = {}) {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(pagina);

  const params: ListReglasAlertaParams = {
    numeroPagina: currentPage,
    tamanoPagina,
    descendente: true,
    ...(tipo != null && { tipo }),
    ...(soloActivas != null && { soloActivas }),
    ...(buscar && { buscar }),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => alertRulesApi.list(params),
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (command: CreateReglaAlertaCommand) => alertRulesApi.create(command),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, command }: { id: string; command: UpdateReglaAlertaCommand }) =>
      alertRulesApi.update(id, command),
    onSuccess: invalidate,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => alertRulesApi.toggle(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertRulesApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    rules: data?.items ?? [],
    totalRegistros: data?.totalRegistros ?? 0,
    totalPaginas: data?.totalPaginas ?? 0,
    paginaActual: data?.paginaActual ?? 1,
    isLoading,
    error,
    refetch: invalidate,
    setPage: setCurrentPage,

    createRule: createMutation,
    updateRule: updateMutation,
    toggleRule: toggleMutation,
    deleteRule: deleteMutation,
  };
}
