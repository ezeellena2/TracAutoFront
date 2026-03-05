import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';

export function useCategoriasPublicas() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['alquiler-publico-categorias'],
    queryFn: () => alquilerPublicoApi.getCategoriasPublicas(),
    staleTime: 10 * 60 * 1000, // 10 min — alineado con cache backend
  });

  return {
    categorias: data ?? [],
    isLoading,
    error,
  };
}
