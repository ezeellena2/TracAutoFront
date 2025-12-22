import { useState, useCallback, useMemo } from 'react';

/**
 * Opciones de tamaño de página permitidas
 */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export type PageSizeOption = (typeof DEFAULT_PAGE_SIZE_OPTIONS)[number];

/**
 * Estado de paginación
 */
export interface PaginationState {
  numeroPagina: number;
  tamanoPagina: number;
}

/**
 * Resultado del hook usePaginationParams
 */
export interface UsePaginationParamsResult extends PaginationState {
  /** Cambia la página actual */
  setNumeroPagina: (page: number) => void;
  /** Cambia el tamaño de página (resetea a página 1) */
  setTamanoPagina: (size: number) => void;
  /** Parámetros listos para enviar a la API */
  params: { numeroPagina: number; tamanoPagina: number };
  /** Resetea a página 1 */
  resetPagina: () => void;
}

/**
 * Opciones para el hook
 */
export interface UsePaginationParamsOptions {
  /** Página inicial (default: 1) */
  initialPage?: number;
  /** Tamaño de página inicial (default: 10) */
  initialPageSize?: number;
  /** Opciones de tamaño permitidas (default: [10, 25, 50]) */
  pageSizeOptions?: readonly number[];
}

/**
 * Hook reutilizable para manejar estado de paginación.
 * 
 * Características:
 * - Clamp defensivo: page >= 1
 * - Al cambiar pageSize, resetea a página 1
 * - Normaliza pageSize a opciones permitidas
 * 
 * @example
 * ```tsx
 * const { numeroPagina, tamanoPagina, setNumeroPagina, setTamanoPagina, params } = usePaginationParams();
 * 
 * // Usar en llamada API
 * const data = await getUsuarios(params);
 * 
 * // Renderizar controles
 * <PaginationControls 
 *   paginaActual={data.paginaActual}
 *   totalPaginas={data.totalPaginas}
 *   tamanoPagina={data.tamanoPagina}
 *   totalRegistros={data.totalRegistros}
 *   onPageChange={setNumeroPagina}
 *   onPageSizeChange={setTamanoPagina}
 * />
 * ```
 */
export function usePaginationParams(
  options: UsePaginationParamsOptions = {}
): UsePaginationParamsResult {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  } = options;

  // Normalizar tamaño inicial a una opción válida
  const normalizePageSize = useCallback((size: number): number => {
    // Si el tamaño está en las opciones, usarlo
    if (pageSizeOptions.includes(size)) {
      return size;
    }
    // Si no, encontrar la opción más cercana sin exceder
    const validOptions = [...pageSizeOptions].sort((a, b) => a - b);
    const closest = validOptions.reduce((prev, curr) => 
      curr <= size ? curr : prev
    , validOptions[0]);
    return closest;
  }, [pageSizeOptions]);

  const [numeroPagina, setNumeroPaginaState] = useState(() => Math.max(1, initialPage));
  const [tamanoPagina, setTamanoPaginaState] = useState(() => normalizePageSize(initialPageSize));

  const setNumeroPagina = useCallback((page: number) => {
    // Clamp defensivo: mínimo 1
    setNumeroPaginaState(Math.max(1, Math.floor(page)));
  }, []);

  const setTamanoPagina = useCallback((size: number) => {
    const normalizedSize = normalizePageSize(size);
    setTamanoPaginaState(normalizedSize);
    // Al cambiar tamaño, resetear a página 1
    setNumeroPaginaState(1);
  }, [normalizePageSize]);

  const resetPagina = useCallback(() => {
    setNumeroPaginaState(1);
  }, []);

  // Memoizar params para evitar re-renders innecesarios
  const params = useMemo(() => ({
    numeroPagina,
    tamanoPagina,
  }), [numeroPagina, tamanoPagina]);

  return {
    numeroPagina,
    tamanoPagina,
    setNumeroPagina,
    setTamanoPagina,
    resetPagina,
    params,
  };
}
