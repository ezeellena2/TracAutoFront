import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promocionesApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { PromocionAlquilerDto } from '../types/promocion';

const QUERY_KEY = 'alquiler-promociones';

export function usePromocionesPage() {
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
    if (filters.soloVigentes !== undefined && filters.soloVigentes !== '') {
      params.soloVigentes = filters.soloVigentes === 'true';
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
    queryFn: () => promocionesApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof promocionesApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionAlquilerDto | null>(null);

  const openCreate = useCallback(() => {
    setPromocionSeleccionada(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((promocion: PromocionAlquilerDto) => {
    setPromocionSeleccionada(promocion);
    setIsFormOpen(true);
  }, []);

  const openDelete = useCallback((promocion: PromocionAlquilerDto) => {
    setPromocionSeleccionada(promocion);
    setIsDeleteOpen(true);
  }, []);

  // Mutation: eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => promocionesApi.delete(id),
    onSuccess: () => {
      toast.success(t('alquileres.promociones.eliminado'));
      setIsDeleteOpen(false);
      setPromocionSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  const handleDelete = useCallback(() => {
    if (!promocionSeleccionada) return;
    deleteMutation.mutate(promocionSeleccionada.id);
  }, [promocionSeleccionada, deleteMutation]);

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
    promocionSeleccionada,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
