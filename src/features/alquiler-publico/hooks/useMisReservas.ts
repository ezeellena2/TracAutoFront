import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints';

export const MIS_RESERVAS_QUERY_KEY = 'mis-reservas-b2c';

/**
 * Hook para obtener el listado de reservas del cliente B2C autenticado.
 */
export function useMisReservas() {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [MIS_RESERVAS_QUERY_KEY],
    queryFn: () => alquilerPublicoApi.getMisReservas(),
    staleTime: 2 * 60 * 1000, // 2 min — datos personales, refetch frecuente pero no en cada mount
  });

  return {
    reservas: data ?? [],
    isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
