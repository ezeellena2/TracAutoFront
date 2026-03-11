import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tarifasApi, sucursalesApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { TarifaAlquilerDto } from '../types/tarifa';

const QUERY_KEY = 'alquiler-tarifas';

export function useTarifasPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.categoriaAlquiler) params.categoriaAlquiler = Number(filters.categoriaAlquiler);
    if (filters.sucursalId) params.sucursalId = filters.sucursalId;
    if (filters.unidadTiempo) params.unidadTiempo = Number(filters.unidadTiempo);
    if (filters.soloActivas !== undefined && filters.soloActivas !== '') {
      params.soloActivas = filters.soloActivas === 'true';
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
  } = useQuery({
    queryKey: [QUERY_KEY, 'list', listParams, paginationParams],
    queryFn: () => tarifasApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof tarifasApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  // Query: sucursales para filtro y form
  const { data: sucursalesData } = useQuery({
    queryKey: ['alquiler-sucursales', 'filter-list'],
    queryFn: () => sucursalesApi.list({ soloActivas: true, tamanoPagina: 100 }),
  });
  const sucursales = sucursalesData?.items ?? [];

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState<TarifaAlquilerDto | null>(null);

  const openCreate = useCallback(() => {
    setTarifaSeleccionada(null);
    setIsFormOpen(true);
  }, []);

  const openEdit = useCallback((tarifa: TarifaAlquilerDto) => {
    setTarifaSeleccionada(tarifa);
    setIsFormOpen(true);
  }, []);

  const openDelete = useCallback((tarifa: TarifaAlquilerDto) => {
    setTarifaSeleccionada(tarifa);
    setIsDeleteOpen(true);
  }, []);

  // Mutation: eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => tarifasApi.delete(id),
    onSuccess: () => {
      toast.success(t('alquileres.tarifas.eliminado'));
      setIsDeleteOpen(false);
      setTarifaSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  const handleDelete = useCallback(() => {
    if (!tarifaSeleccionada) return;
    deleteMutation.mutate(tarifaSeleccionada.id);
  }, [tarifaSeleccionada, deleteMutation]);

  return {
    data: listData ?? null,
    items: listData?.items ?? [],
    isLoading,
    error,
    loadData: useCallback(() => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }, [queryClient]),
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    sucursales,
    isFormOpen,
    setIsFormOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    tarifaSeleccionada,
    openCreate,
    openEdit,
    openDelete,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
