import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiculosAlquilerApi, sucursalesApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { VehiculoAlquilerDto } from '../types/vehiculoAlquiler';

const QUERY_KEY = 'alquiler-flota';

export function useFlotaAlquilerPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.categoria) params.categoria = Number(filters.categoria);
    if (filters.estado) params.estado = Number(filters.estado);
    if (filters.sucursalId) params.sucursalId = filters.sucursalId;
    if (filters.soloActivos !== undefined && filters.soloActivos !== '') {
      params.soloActivos = filters.soloActivos === 'true';
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
    queryFn: () => vehiculosAlquilerApi.list({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof vehiculosAlquilerApi.list>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  // Query: sucursales para filtro select
  const { data: sucursalesData } = useQuery({
    queryKey: ['alquiler-sucursales', 'filter-list'],
    queryFn: () => sucursalesApi.list({ soloActivas: true, tamanoPagina: 100 }),
  });
  const sucursalesFiltro = sucursalesData?.items ?? [];

  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEstadoOpen, setIsEstadoOpen] = useState(false);
  const [isDisponibilidadOpen, setIsDisponibilidadOpen] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<VehiculoAlquilerDto | null>(null);

  const openEdit = useCallback((v: VehiculoAlquilerDto) => {
    setVehiculoSeleccionado(v);
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((v: VehiculoAlquilerDto) => {
    setVehiculoSeleccionado(v);
    setIsDeleteOpen(true);
  }, []);

  const openEstado = useCallback((v: VehiculoAlquilerDto) => {
    setVehiculoSeleccionado(v);
    setIsEstadoOpen(true);
  }, []);

  const openDisponibilidad = useCallback((v: VehiculoAlquilerDto) => {
    setVehiculoSeleccionado(v);
    setIsDisponibilidadOpen(true);
  }, []);

  // Mutation: eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiculosAlquilerApi.remove(id),
    onSuccess: () => {
      toast.success(t('alquileres.flota.eliminado'));
      setIsDeleteOpen(false);
      setVehiculoSeleccionado(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  const handleDelete = useCallback(() => {
    if (!vehiculoSeleccionado) return;
    deleteMutation.mutate(vehiculoSeleccionado.id);
  }, [vehiculoSeleccionado, deleteMutation]);

  return {
    flotaData: listData ?? null,
    vehiculos: listData?.items ?? [],
    isLoading,
    error,
    loadData: refetch,
    setNumeroPagina,
    setTamanoPagina,
    filters,
    setFilter,
    clearFilters,
    sucursalesFiltro,
    isCreateOpen,
    setIsCreateOpen,
    isEditOpen,
    setIsEditOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    isEstadoOpen,
    setIsEstadoOpen,
    isDisponibilidadOpen,
    setIsDisponibilidadOpen,
    vehiculoSeleccionado,
    openEdit,
    openDelete,
    openEstado,
    openDisponibilidad,
    handleDelete,
    isDeleting: deleteMutation.isPending,
  };
}
