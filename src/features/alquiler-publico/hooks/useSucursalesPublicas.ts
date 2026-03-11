import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';

export function useSucursalesPublicas(slug?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alquiler-publico-sucursales', slug],
    queryFn: () => alquilerPublicoApi.getSucursalesPublicas(undefined, slug),
    staleTime: 10 * 60 * 1000, // 10 min — alineado con cache backend
  });

  return {
    sucursales: data ?? [],
    isLoading,
    error,
  };
}
