import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { scoringApi } from '@/services/endpoints/scoring.api';

const QUERY_KEY = 'scoring';

type Periodo = '7d' | '30d' | '90d';

export function useScoringConductorDetalle(conductorId: string) {
  const [periodo, setPeriodo] = useState<Periodo>('30d');

  const { fechaInicio, fechaFin } = useMemo(() => {
    const hoy = new Date();
    const dias = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - dias);

    return {
      fechaInicio: inicio.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0],
    };
  }, [periodo]);

  const {
    data: historial,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY, 'historial', conductorId, periodo],
    queryFn: () =>
      scoringApi.obtenerHistorialConductor({
        conductorId,
        fechaInicio,
        fechaFin,
      }),
    enabled: !!conductorId,
    staleTime: 5 * 60 * 1000,
  });

  const ultimoScore = historial && historial.length > 0
    ? historial[historial.length - 1]
    : null;

  const scorePromedio = historial && historial.length > 0
    ? Math.round(historial.reduce((sum, s) => sum + s.scoreGeneral, 0) / historial.length)
    : 0;

  return {
    historial,
    ultimoScore,
    scorePromedio,
    isLoading,
    error,
    periodo,
    setPeriodo,
  };
}
