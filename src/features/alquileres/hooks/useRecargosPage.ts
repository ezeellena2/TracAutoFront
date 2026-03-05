import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recargosApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { RecargoAlquilerDto } from '../types/recargo';

const QUERY_KEY = 'alquiler-recargos';

export function useRecargosPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.tipoRecargo) params.tipoRecargo = Number(filters.tipoRecargo);
    if (filters.categoriaAlquiler) params.categoriaAlquiler = Number(filters.categoriaAlquiler);
    if (filters.soloActivos !== undefined && filters.soloActivos !== '') {
      params.soloActivos = filters.soloActivos === 'true';
    }
    if (filters.soloObligatorios !== undefined && filters.soloObligatorios !== '') {
      params.soloObligatorios = filters.soloObligatorios === 'true';
    }
    return params;
  }, [filters]);

  // Paginación
  const [totalPaginas, setTotalPaginas] = useState<number>();
  const { params: paginationParams, setNumeroPagina, setTamanoPagina } = usePaginationParams({
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
    queryFn: () => recargosApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof recargosApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recargoSeleccionado, setRecargoSeleccionado] = useState<RecargoAlquilerDto | null>(null);

  const openCreate = useCallback(() => {
    setRecargoSeleccionado(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((recargo: RecargoAlquilerDto) => {
    setRecargoSeleccionado(recargo);
    setIsFormOpen(true);
  }, []);

  const openDelete = useCallback((recargo: RecargoAlquilerDto) => {
    setRecargoSeleccionado(recargo);
    setIsDeleteOpen(true);
  }, []);

  // Mutation: eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => recargosApi.delete(id),
    onSuccess: () => {
      toast.success(t('alquileres.recargos.eliminado'));
      setIsDeleteOpen(false);
      setRecargoSeleccionado(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  const handleDelete = useCallback(() => {
    if (!recargoSeleccionado) return;
    deleteMutation.mutate(recargoSeleccionado.id);
  }, [recargoSeleccionado, deleteMutation]);

  return {
    data: listData ?? null,
    items: listData?.items ?? [],
    isLoading,
    error,
    loadData: refetch,
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    isFormOpen,
    setIsFormOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    recargoSeleccionado,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
