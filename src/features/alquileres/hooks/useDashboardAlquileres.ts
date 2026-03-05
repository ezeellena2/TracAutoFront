import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportesAlquilerApi } from '@/services/endpoints';
import { primerDiaMesISO, hoyISO } from '@/shared/utils/dateFormatter';
import { AgrupacionPeriodo } from '../types/reportes';

export function useDashboardAlquileres() {
  const fechaInicio = useMemo(() => primerDiaMesISO(), []);
  const fechaFin = useMemo(() => hoyISO(), []);

  const {
    data: estadisticas,
    isLoading: isLoadingEstadisticas,
    error: errorEstadisticas,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'estadisticas', fechaInicio, fechaFin],
    queryFn: () => reportesAlquilerApi.getEstadisticasReservas({ fechaInicio, fechaFin }),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: utilizacion,
    isLoading: isLoadingUtilizacion,
    error: errorUtilizacion,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'utilizacion', fechaInicio, fechaFin],
    queryFn: () => reportesAlquilerApi.getUtilizacionFlota({ fechaInicio, fechaFin }),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: ingresos,
    isLoading: isLoadingIngresos,
    error: errorIngresos,
  } = useQuery({
    queryKey: ['alquiler-reportes', 'ingresos', fechaInicio, fechaFin],
    queryFn: () =>
      reportesAlquilerApi.getIngresos({
        fechaInicio,
        fechaFin,
        agrupacion: AgrupacionPeriodo.Semana,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingEstadisticas || isLoadingUtilizacion || isLoadingIngresos;
  const error = errorEstadisticas || errorUtilizacion || errorIngresos;

  return {
    estadisticas,
    utilizacion,
    ingresos,
    isLoading,
    error,
  };
}
