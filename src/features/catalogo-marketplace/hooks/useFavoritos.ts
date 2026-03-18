import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { marketplacePublicoApi } from '@/services/endpoints/marketplace-publico.api';

const FAVORITOS_KEY = ['catalogo-marketplace', 'favoritos'] as const;

export function useFavoritos(pageSize = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const query = useQuery({
    queryKey: [...FAVORITOS_KEY, currentPage, pageSize],
    queryFn: () => marketplacePublicoApi.getMisFavoritos(currentPage, pageSize),
    staleTime: 5 * 60 * 1000,
  });

  return {
    favoritos: query.data?.items ?? [],
    totalRegistros: query.data?.totalRegistros ?? 0,
    totalPaginas: query.data?.totalPaginas ?? 0,
    paginaActual: query.data?.paginaActual ?? 1,
    isLoading: query.isLoading,
    error: query.error,
    setPage: setCurrentPage,
  };
}

export function useToggleFavorito() {
  const queryClient = useQueryClient();
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());

  const mutation = useMutation({
    mutationFn: (publicacionId: string) => marketplacePublicoApi.toggleFavorito(publicacionId),
    onMutate: (publicacionId) => {
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        if (next.has(publicacionId)) {
          next.delete(publicacionId);
        } else {
          next.add(publicacionId);
        }
        return next;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITOS_KEY });
    },
    onError: (_err, publicacionId) => {
      // Revert optimistic update
      setOptimisticIds((prev) => {
        const next = new Set(prev);
        if (next.has(publicacionId)) {
          next.delete(publicacionId);
        } else {
          next.add(publicacionId);
        }
        return next;
      });
    },
  });

  const isFavorite = useCallback(
    (publicacionId: string) => optimisticIds.has(publicacionId),
    [optimisticIds],
  );

  return {
    toggle: mutation.mutate,
    isFavorite,
    isPending: mutation.isPending,
  };
}
