import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';

export function useVehiculoPublico(id: string | undefined) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['alquiler-publico-vehiculo', id],
    queryFn: () => alquilerPublicoApi.getVehiculo(id!),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 min — alineado con cache backend
  });

  return {
    vehiculo: data ?? null,
    isLoading,
    isError,
    error,
    refetch,
  };
}
