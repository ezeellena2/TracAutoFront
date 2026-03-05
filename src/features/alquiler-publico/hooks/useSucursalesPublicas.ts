import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';

export function useSucursalesPublicas() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alquiler-publico-sucursales'],
    queryFn: () => alquilerPublicoApi.getSucursalesPublicas(),
    staleTime: 10 * 60 * 1000, // 10 min — alineado con cache backend
  });

  return {
    sucursales: data ?? [],
    isLoading,
    error,
  };
}
