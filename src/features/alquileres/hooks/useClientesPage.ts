import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientesAlquilerApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters } from '@/hooks';
import type { ClienteAlquilerDto } from '../types/cliente';

const QUERY_KEY = 'alquiler-clientes';

export function useClientesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    return params;
  }, [filters]);

  // Paginación
  const [totalPaginas, setTotalPaginas] = useState<number>();
  const { setNumeroPagina, setTamanoPagina, params: paginationParams } = usePaginationParams({
    initialPageSize: 10,
    totalPaginas,
  });

  // Query: lista paginada
  const {
    data: listData,
    isLoading,
    error: listError,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, 'list', listParams, paginationParams],
    queryFn: () => clientesAlquilerApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof clientesAlquilerApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteAlquilerDto | null>(null);

  const openEdit = useCallback((cliente: ClienteAlquilerDto) => {
    setClienteSeleccionado(cliente);
    setIsEditOpen(true);
  }, []);

  const openDetail = useCallback((cliente: ClienteAlquilerDto) => {
    setClienteSeleccionado(cliente);
    setIsDetailOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  return {
    clientesData: listData ?? null,
    clientes: listData?.items ?? [],
    isLoading,
    error,
    loadData: refetch,

    setNumeroPagina,
    setTamanoPagina,

    filters,
    setFilter,
    clearFilters,

    isCreateOpen,
    setIsCreateOpen,

    isEditOpen,
    setIsEditOpen,
    clienteSeleccionado,
    openEdit,

    isDetailOpen,
    setIsDetailOpen,
    openDetail,

    handleSuccess,
  };
}
