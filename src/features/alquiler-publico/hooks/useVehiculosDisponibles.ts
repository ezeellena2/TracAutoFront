import { useQuery } from '@tanstack/react-query';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';
import type { BusquedaParams } from '../types/busqueda';

export function useVehiculosDisponibles(params: BusquedaParams | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alquiler-publico-vehiculos', params],
    queryFn: () => alquilerPublicoApi.buscarVehiculosDisponibles(params!),
    enabled: !!params?.sucursalRecogidaId && !!params?.fechaHoraRecogida && !!params?.fechaHoraDevolucion,
    staleTime: 5 * 60 * 1000, // 5 min — alineado con cache backend
  });

  return {
    vehiculos: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
