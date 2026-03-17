import { useQuery } from '@tanstack/react-query';
import { feriadosApi, type FeriadosResumenDto } from '../services/endpoints/feriados.api';

const FERIADOS_QUERY_KEY = ['feriados', 'resumen'] as const;

/**
 * Hook para obtener el resumen de feriados (hoy + próximo) para el header.
 * staleTime: 1 hora — los feriados no cambian frecuentemente.
 * Degrada silenciosamente: devuelve null si el servicio no está disponible.
 */
export function useFeriadosResumen() {
    const { data, isLoading, isError } = useQuery<FeriadosResumenDto | null>({
        queryKey: FERIADOS_QUERY_KEY,
        queryFn: async () => {
            try {
                return await feriadosApi.getFeriadosResumen();
            } catch {
                return null;
            }
        },
        staleTime: 60 * 60 * 1000, // 1 hora
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        resumen: data ?? null,
        isLoading,
        isError,
    };
}
