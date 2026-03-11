import { useQuery } from '@tanstack/react-query';
import { marketplacePublicoApi } from '@/services/endpoints/marketplace-publico.api';
import type { FiltrosVehiculoPublico } from '../types';

export function useVehiculos(filtros?: FiltrosVehiculoPublico) {
  return useQuery({
    queryKey: ['catalogo-marketplace', 'vehiculos', filtros],
    queryFn: () => marketplacePublicoApi.obtenerVehiculos(filtros),
  });
}

export function useVehiculoDetalle(publicacionId: string | undefined) {
  return useQuery({
    queryKey: ['catalogo-marketplace', 'vehiculo', publicacionId],
    queryFn: () => marketplacePublicoApi.obtenerVehiculoPorId(publicacionId!),
    enabled: !!publicacionId,
  });
}
