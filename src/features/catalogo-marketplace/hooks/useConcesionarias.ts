import { useQuery } from '@tanstack/react-query';
import { marketplacePublicoApi } from '@/services/endpoints/marketplace-publico.api';

export function useConcesionarias() {
  return useQuery({
    queryKey: ['catalogo-marketplace', 'concesionarias'],
    queryFn: () => marketplacePublicoApi.obtenerConcesionarias(),
  });
}
