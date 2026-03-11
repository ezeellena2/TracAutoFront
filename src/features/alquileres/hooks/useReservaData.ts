import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { reservasApi, contratosApi, sucursalesApi } from '@/services/endpoints';
import { EstadoReserva } from '../types/reserva';
import type { TimelineEntry } from '../types/reserva';

export const RESERVA_QUERY_KEY = 'reserva-detalle';

export function useReservaData(id: string) {
  const { t } = useTranslation();

  const {
    data: reserva,
    isLoading: isReservaLoading,
    error: reservaError,
    refetch: refetchReserva,
  } = useQuery({
    queryKey: [RESERVA_QUERY_KEY, id],
    queryFn: () => reservasApi.getById(id),
    enabled: !!id,
  });

  const estado = reserva?.estado;

  const { data: checkOut, isLoading: isCheckOutLoading } = useQuery({
    queryKey: [RESERVA_QUERY_KEY, id, 'checkout'],
    queryFn: () => reservasApi.getCheckOut(id),
    enabled: !!id && estado != null && estado >= EstadoReserva.EnCurso,
    retry: false,
  });

  const { data: checkIn, isLoading: isCheckInLoading } = useQuery({
    queryKey: [RESERVA_QUERY_KEY, id, 'checkin'],
    queryFn: () => reservasApi.getCheckIn(id),
    enabled: !!id && estado != null && estado >= EstadoReserva.Completada,
    retry: false,
  });

  const { data: fotos, isLoading: isFotosLoading } = useQuery({
    queryKey: [RESERVA_QUERY_KEY, id, 'fotos'],
    queryFn: () => reservasApi.getFotos(id),
    enabled: !!id && estado != null && estado >= EstadoReserva.EnCurso,
    retry: false,
  });

  const { data: contrato, isLoading: isContratoLoading } = useQuery({
    queryKey: [RESERVA_QUERY_KEY, id, 'contrato'],
    queryFn: () => contratosApi.getByReserva(id),
    enabled: !!id && estado != null && estado >= EstadoReserva.Confirmada,
    retry: false,
  });

  const { data: sucursalesData } = useQuery({
    queryKey: ['alquiler-sucursales', 'filter-list'],
    queryFn: () => sucursalesApi.list({ soloActivas: true, tamanoPagina: 100 }),
  });

  const sucursalOptions = useMemo(
    () => (sucursalesData?.items ?? []).map(s => ({ value: s.id, label: s.nombre })),
    [sucursalesData],
  );

  // Timeline computado
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
        fecha: checkOut?.fechaHoraReal ?? null,
        esActual: reserva.estado === EstadoReserva.EnCurso,
      });
    }

    if (reserva.estado === EstadoReserva.Completada) {
      entries.push({
        estado: EstadoReserva.Completada,
        fecha: checkIn?.fechaHoraReal ?? null,
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
  }, [reserva, checkOut, checkIn]);

  const error = reservaError ? (reservaError as Error).message ?? t('common.error') : null;

  return {
    reserva: reserva ?? null,
    checkOut: checkOut ?? null,
    checkIn: checkIn ?? null,
    fotos: fotos ?? [],
    contrato: contrato ?? null,
    timeline,
    sucursalOptions,
    isLoading: isReservaLoading,
    isCheckOutLoading,
    isCheckInLoading,
    isFotosLoading,
    isContratoLoading,
    error,
    refetch: refetchReserva,
  };
}
