import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coberturasApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { CoberturaAlquilerDto } from '../types/cobertura';

const QUERY_KEY = 'alquiler-coberturas';

export function useCoberturasPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.soloActivas !== undefined && filters.soloActivas !== '') {
      params.soloActivas = filters.soloActivas === 'true';
    }
    if (filters.soloObligatorias !== undefined && filters.soloObligatorias !== '') {
      params.soloObligatorias = filters.soloObligatorias === 'true';
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
    queryFn: () => coberturasApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof coberturasApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [coberturaSeleccionada, setCoberturaSeleccionada] = useState<CoberturaAlquilerDto | null>(null);

  const openCreate = useCallback(() => {
    setCoberturaSeleccionada(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((cobertura: CoberturaAlquilerDto) => {
    setCoberturaSeleccionada(cobertura);
    setIsFormOpen(true);
  }, []);

  const openDelete = useCallback((cobertura: CoberturaAlquilerDto) => {
    setCoberturaSeleccionada(cobertura);
    setIsDeleteOpen(true);
  }, []);

  // Mutation: eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => coberturasApi.delete(id),
    onSuccess: () => {
      toast.success(t('alquileres.coberturas.eliminado'));
      setIsDeleteOpen(false);
      setCoberturaSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  const handleDelete = useCallback(() => {
    if (!coberturaSeleccionada) return;
    deleteMutation.mutate(coberturaSeleccionada.id);
  }, [coberturaSeleccionada, deleteMutation]);

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
    coberturaSeleccionada,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
