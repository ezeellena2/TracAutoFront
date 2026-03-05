import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints';
import { EstadoReserva } from '@/features/alquileres/types/reserva';
import type { TimelineEntry } from '@/features/alquileres/types/reserva';
import { MIS_RESERVAS_QUERY_KEY } from './useMisReservas';

const DETALLE_QUERY_KEY = 'mi-reserva-b2c';

/**
 * Hook para obtener el detalle de una reserva B2C, timeline computado,
 * y accion de cancelacion.
 */
export function useMiReservaDetalle(id: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const {
    data: reserva,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [DETALLE_QUERY_KEY, id],
    queryFn: () => alquilerPublicoApi.getMisReservaDetalle(id),
    enabled: !!id,
  });

  // Timeline computado (simplificado: sin checkOut/checkIn queries)
  const timeline = useMemo((): TimelineEntry[] => {
    if (!reserva) return [];

    const entries: TimelineEntry[] = [];

    entries.push({
      estado: EstadoReserva.Tentativa,
      fecha: reserva.fechaCreacion,
      esActual: reserva.estado === EstadoReserva.Tentativa,
    });

    if (reserva.estado >= EstadoReserva.Confirmada && reserva.estado !== EstadoReserva.Cancelada && reserva.estado !== EstadoReserva.NoShow) {
      entries.push({
        estado: EstadoReserva.Confirmada,
        fecha: null,
        esActual: reserva.estado === EstadoReserva.Confirmada,
      });
    }

    if (reserva.estado >= EstadoReserva.EnCurso && reserva.estado !== EstadoReserva.Cancelada && reserva.estado !== EstadoReserva.NoShow) {
      entries.push({
        estado: EstadoReserva.EnCurso,
        fecha: null,
        esActual: reserva.estado === EstadoReserva.EnCurso,
      });
    }

    if (reserva.estado === EstadoReserva.Completada) {
      entries.push({
        estado: EstadoReserva.Completada,
        fecha: null,
        esActual: true,
      });
    }

    if (reserva.estado === EstadoReserva.Cancelada) {
      entries.push({
        estado: EstadoReserva.Cancelada,
        fecha: reserva.fechaCancelacion,
        esActual: true,
        descripcion: reserva.motivoCancelacion ?? undefined,
      });
    }

    if (reserva.estado === EstadoReserva.NoShow) {
      entries.push({
        estado: EstadoReserva.NoShow,
        fecha: null,
        esActual: true,
      });
    }

    return entries;
  }, [reserva]);

  // Mutacion de cancelacion
  const cancelMutation = useMutation({
    mutationFn: (motivo?: string) =>
      alquilerPublicoApi.cancelarMiReserva(id, { motivoCancelacion: motivo }),
    onSuccess: () => {
      setIsCancelOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: [MIS_RESERVAS_QUERY_KEY] });
    },
  });

  const error = queryError ? (queryError as Error).message ?? t('common.error') : null;

  return {
    reserva: reserva ?? null,
    timeline,
    isLoading,
    error,
    refetch,
    cancelar: (motivo?: string) => cancelMutation.mutate(motivo),
    isCancelling: cancelMutation.isPending,
    cancelError: cancelMutation.error ?? null,
    isCancelOpen,
    setIsCancelOpen,
  };
}
