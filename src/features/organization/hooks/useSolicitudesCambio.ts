import { useQuery } from '@tanstack/react-query';
import { solicitudesCambioApi } from '@/services/endpoints';

interface UseSolicitudesCambioParams {
  numeroPagina?: number;
  tamanoPagina?: number;
  ordenarPor?: string;
  descendente?: boolean;
}

/**
 * Hook para obtener la lista de solicitudes de cambio con paginación.
 * Usa React Query para manejo de cache, deduplicación y revalidación automática.
 * 
 * @param params - Parámetros de paginación y ordenamiento
 * @returns Objeto con data, isLoading, error y refetch
 */
export function useSolicitudesCambio(params: UseSolicitudesCambioParams = {}) {
  const queryResult = useQuery({
    queryKey: ['solicitudes-cambio', 'list', params],
    queryFn: () =>
      solicitudesCambioApi.listar({
        numeroPagina: params.numeroPagina ?? 1,
        tamanoPagina: params.tamanoPagina ?? 10,
        ordenarPor: params.ordenarPor ?? 'FechaCreacion',
        descendente: params.descendente ?? true,
      }),
  });

  return {
    data: queryResult.data ?? null,
    isLoading: queryResult.isLoading,
    error: queryResult.error ?? null,
    refetch: queryResult.refetch,
  };
}
