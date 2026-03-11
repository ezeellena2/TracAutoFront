import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contratosApi } from '@/services/endpoints';
import { usePaginationParams, useTableFilters } from '@/hooks';
import type { PlantillaContratoDto } from '../types/contrato';

const QUERY_KEY = 'alquiler-plantillas';

export function useContratosPage() {
  // Filtros
  const { filters, setFilter, clearFilters } = useTableFilters();
  const queryClient = useQueryClient();

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    if (filters.buscar) params.buscar = filters.buscar;
    if (filters.soloActivas) params.soloActivas = filters.soloActivas === 'true';
    return params;
  }, [filters]);

  // Paginacion
  const [totalPaginas, setTotalPaginas] = useState<number>();
  const { setNumeroPagina, setTamanoPagina, params: paginationParams } = usePaginationParams({
    initialPageSize: 10,
    totalPaginas,
  });

  // Query: lista paginada
  const {
    data: listData,
    isLoading,
    error: listError,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEY, 'list', listParams, paginationParams],
    queryFn: () => contratosApi.getPlantillas({
      ...listParams,
      numeroPagina: paginationParams.numeroPagina,
      tamanoPagina: paginationParams.tamanoPagina,
    } as Parameters<typeof contratosApi.getPlantillas>[0]),
  });

  useEffect(() => {
    setTotalPaginas(listData?.totalPaginas);
  }, [listData?.totalPaginas]);

  const error = listError ? (listError as Error).message ?? 'Error' : null;

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaContratoDto | null>(null);

  const openEdit = useCallback((plantilla: PlantillaContratoDto) => {
    setPlantillaSeleccionada(plantilla);
    setIsEditOpen(true);
  }, []);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }, [queryClient]);

  return {
    plantillasData: listData ?? null,
    plantillas: listData?.items ?? [],
    isLoading,
    error,
    loadData: refetch,

    setNumeroPagina,
    setTamanoPagina,

    filters,
    setFilter,
    clearFilters,

    isCreateOpen,
    setIsCreateOpen,

    isEditOpen,
    setIsEditOpen,
    plantillaSeleccionada,
    openEdit,

    handleSuccess,
  };
}
