import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';
import type { OpcionesPublicasDto } from '../types/detalle';

export function useOpcionesPublicas(sucursalId: string | null, categoriaAlquiler?: number) {
  const { data, isLoading, error } = useQuery<OpcionesPublicasDto>({
    queryKey: ['alquiler-publico', 'opciones', sucursalId, categoriaAlquiler],
    queryFn: () => alquilerPublicoApi.getOpciones(sucursalId!, categoriaAlquiler),
    enabled: !!sucursalId,
    staleTime: 10 * 60 * 1000,
  });

  return {
    coberturas: data?.coberturas ?? [],
    recargos: data?.recargos ?? [],
    isLoading,
    error,
  };
}
