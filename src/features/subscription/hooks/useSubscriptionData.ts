import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { suscripcionesApi } from '../api/subscription.api';

const KEYS = {
  modulosActivos: ['suscripciones', 'modulos-activos'] as const,
  modulosDisponibles: ['suscripciones', 'modulos-disponibles'] as const,
};

export function useSuscripcionesData() {
  const queryClient = useQueryClient();

  const modulosActivosQuery = useQuery({
    queryKey: KEYS.modulosActivos,
    queryFn: suscripcionesApi.getModulosActivos,
    staleTime: 5 * 60 * 1000,
  });

  const modulosDisponiblesQuery = useQuery({
    queryKey: KEYS.modulosDisponibles,
    queryFn: suscripcionesApi.getModulosDisponibles,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['suscripciones'] });
  };

  const activarModulo = useMutation({
    mutationFn: suscripcionesApi.activarModulo,
    onSuccess: invalidateAll,
  });

  const desactivarModulo = useMutation({
    mutationFn: suscripcionesApi.desactivarModulo,
    onSuccess: invalidateAll,
  });

  return {
    modulosActivos: modulosActivosQuery.data ?? [],
    modulosDisponibles: modulosDisponiblesQuery.data ?? [],
    isLoading: modulosActivosQuery.isLoading || modulosDisponiblesQuery.isLoading,
    error: modulosActivosQuery.error || modulosDisponiblesQuery.error,
    activarModulo,
    desactivarModulo,
    refetch: invalidateAll,
  };
}
