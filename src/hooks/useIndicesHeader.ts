import { useQuery } from '@tanstack/react-query';
import { indicesApi } from '@/services/endpoints';
import type { IndicesAgregadoDto } from '@/services/endpoints/indices.api';

const STALE_TIME_MS = 3 * 60 * 1000; // 3 min

/**
 * Datos de índices (dólar blue, riesgo país) para el header.
 * No rompe la UI en error: data puede ser undefined y cada indicador puede ser null.
 */
export function useIndicesHeader() {
  const { data, isLoading, isError } = useQuery<IndicesAgregadoDto>({
    queryKey: ['indices', 'header'],
    queryFn: () => indicesApi.getIndices(),
    staleTime: STALE_TIME_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    data: data ?? ({ dolar: null, riesgoPais: null } as IndicesAgregadoDto),
    isLoading,
    isError,
  };
}
