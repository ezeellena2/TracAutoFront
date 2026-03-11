import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalesApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { SucursalDto } from '../types/sucursal';

const QUERY_KEY = 'alquiler-sucursales';

export function useSucursalesPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.ciudad) params.ciudad = filters.ciudad;
    if (filters.activa) params.soloActivas = filters.activa === 'true';
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
    queryFn: () => sucursalesApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof sucursalesApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<SucursalDto | null>(null);

  const openEdit = useCallback((sucursal: SucursalDto) => {
    setSucursalSeleccionada(sucursal);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((sucursal: SucursalDto) => {
    setSucursalSeleccionada(sucursal);
    setIsDeleteOpen(true);
  }, []);

  // Mutation: eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => sucursalesApi.delete(id),
    onSuccess: () => {
      toast.success(t('alquileres.sucursales.eliminada'));
      setIsDeleteOpen(false);
      setSucursalSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  const handleDelete = useCallback(() => {
    if (!sucursalSeleccionada) return;
    deleteMutation.mutate(sucursalSeleccionada.id);
  }, [sucursalSeleccionada, deleteMutation]);

  return {
    sucursalesData: listData ?? null,
    sucursales: listData?.items ?? [],
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
    sucursalSeleccionada,
    openEdit,

    isDeleteOpen,
    setIsDeleteOpen,
    openDelete,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
