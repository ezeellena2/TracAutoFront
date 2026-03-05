import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservasApi, sucursalesApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters, useErrorHandler } from '@/hooks';
import { toast } from '@/store/toast.store';
import type { SucursalDto } from '../types/sucursal';
import type { ReservaAlquilerResumenDto } from '../types/reserva';
import type { VistaReservas } from '../types';

const QUERY_KEY = 'reservas';

export function useReservasPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const queryClient = useQueryClient();

  // Vista
  const [vista, setVista] = useState<VistaReservas>('tabla');

  // Sucursales para filtro select
  const [sucursales, setSucursales] = useState<SucursalDto[]>([]);

  // Filtros y paginación
  const { filters, setFilter, clearFilters } = useTableFilters();

  // Calendario mes/anio
  const [calMes, setCalMes] = useState(() => new Date().getMonth() + 1);
  const [calAnio, setCalAnio] = useState(() => new Date().getFullYear());

  // Construir params para la query de lista
  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.estado) params.estado = Number(filters.estado);
    if (filters.sucursalId) params.sucursalId = filters.sucursalId;
    if (filters.origenReserva) params.origenReserva = Number(filters.origenReserva);
    if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
    if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
    return params;
  }, [filters]);

  // Paginación (declarar antes de la query para incluir en queryKey)
  const [totalPaginas, setTotalPaginas] = useState<number>();
  const { params: paginationParams, setNumeroPagina, setTamanoPagina } = usePaginationParams({
    initialPageSize: 10,
    totalPaginas,
  });

  // Query: lista paginada
  const {
    data: listData,
    isLoading: isListLoading,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: [QUERY_KEY, 'list', listParams, paginationParams],
    queryFn: () => reservasApi.list({
      ...listParams as Parameters<typeof reservasApi.list>[0],
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    }),
  });

  // Sincronizar totalPaginas cuando llega data
  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  // Construir params para la query de calendario
  const calendarioParams = useMemo(() => {
    const lastDay = new Date(calAnio, calMes, 0).getDate();
    return {
      fechaDesde: `${calAnio}-${String(calMes).padStart(2, '0')}-01`,
      fechaHasta: `${calAnio}-${String(calMes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      sucursalId: filters.sucursalId || undefined,
    };
  }, [calMes, calAnio, filters.sucursalId]);

  // Query: calendario
  const {
    data: calendarioData,
    isLoading: isCalendarioLoading,
  } = useQuery({
    queryKey: [QUERY_KEY, 'calendario', calendarioParams],
    queryFn: () => reservasApi.getCalendario(calendarioParams),
    enabled: vista === 'calendario',
  });

  // Cargar sucursales una vez
  useEffect(() => {
    sucursalesApi.list({ soloActivas: true, tamanoPagina: 100 })
      .then(data => setSucursales(data.items))
      .catch(() => setSucursales([]));
  }, []);

  // Modales
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaAlquilerResumenDto | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isNoShowOpen, setIsNoShowOpen] = useState(false);

  const openConfirm = useCallback((r: ReservaAlquilerResumenDto) => {
    setReservaSeleccionada(r);
    setIsConfirmOpen(true);
  }, []);

  const openCancel = useCallback((r: ReservaAlquilerResumenDto) => {
    setReservaSeleccionada(r);
    setIsCancelOpen(true);
  }, []);

  const openNoShow = useCallback((r: ReservaAlquilerResumenDto) => {
    setReservaSeleccionada(r);
    setIsNoShowOpen(true);
  }, []);

  // Mutation: confirmar
  const confirmarMutation = useMutation({
    mutationFn: (id: string) => reservasApi.confirmar(id),
    onSuccess: () => {
      toast.success(t('alquileres.reservas.toast.confirmada'));
      setIsConfirmOpen(false);
      setReservaSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  // Mutation: cancelar
  const cancelarMutation = useMutation({
    mutationFn: ({ id, motivoCancelacion }: { id: string; motivoCancelacion: string }) =>
      reservasApi.cancelar(id, { reservaId: id, motivoCancelacion }),
    onSuccess: () => {
      toast.success(t('alquileres.reservas.toast.cancelada'));
      setIsCancelOpen(false);
      setReservaSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  // Mutation: no-show
  const noShowMutation = useMutation({
    mutationFn: (id: string) => reservasApi.marcarNoShow(id, { reservaId: id }),
    onSuccess: () => {
      toast.success(t('alquileres.reservas.toast.noShow'));
      setIsNoShowOpen(false);
      setReservaSeleccionada(null);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      handleApiError(error);
    },
  });

  // Handlers
  const handleConfirm = useCallback(() => {
    if (!reservaSeleccionada) return;
    confirmarMutation.mutate(reservaSeleccionada.id);
  }, [reservaSeleccionada, confirmarMutation]);

  const handleCancel = useCallback((motivoCancelacion: string) => {
    if (!reservaSeleccionada) return;
    cancelarMutation.mutate({ id: reservaSeleccionada.id, motivoCancelacion });
  }, [reservaSeleccionada, cancelarMutation]);

  const handleNoShow = useCallback(() => {
    if (!reservaSeleccionada) return;
    noShowMutation.mutate(reservaSeleccionada.id);
  }, [reservaSeleccionada, noShowMutation]);

  // Calendario: navegación de mes
  const handlePrevMonth = useCallback(() => {
    if (calMes === 1) {
      setCalMes(12);
      setCalAnio(y => y - 1);
    } else {
      setCalMes(m => m - 1);
    }
  }, [calMes]);

  const handleNextMonth = useCallback(() => {
    if (calMes === 12) {
      setCalMes(1);
      setCalAnio(y => y + 1);
    } else {
      setCalMes(m => m + 1);
    }
  }, [calMes]);

  // Error como string (para consistencia con D2-D4 pattern)
  const error = listError ? (listError as Error).message ?? t('common.error') : null;

  return {
    // Lista
    data: listData ?? null,
    items: listData?.items ?? [],
    isLoading: isListLoading,
    error,
    loadData: refetchList,
    setNumeroPagina,
    setTamanoPagina,

    // Filtros
    filters,
    setFilter,
    clearFilters,
    sucursales,

    // Vista
    vista,
    setVista,

    // Calendario
    calendarioData: calendarioData ?? [],
    isCalendarioLoading,
    calMes,
    calAnio,
    handlePrevMonth,
    handleNextMonth,

    // Modales
    reservaSeleccionada,
    isConfirmOpen,
    setIsConfirmOpen,
    isCancelOpen,
    setIsCancelOpen,
    isNoShowOpen,
    setIsNoShowOpen,
    openConfirm,
    openCancel,
    openNoShow,

    // Actions
    handleConfirm,
    handleCancel,
    handleNoShow,
    isConfirming: confirmarMutation.isPending,
    isCancelling: cancelarMutation.isPending,
    isMarkingNoShow: noShowMutation.isPending,
  };
}
