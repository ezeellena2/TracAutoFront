import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Props para PaginationControls
 */
export interface PaginationControlsProps {
  /** Página actual (1-indexed) */
  paginaActual: number;
  /** Total de páginas */
  totalPaginas: number;
  /** Tamaño de página actual */
  tamanoPagina: number;
  /** Total de registros */
  totalRegistros: number;
  /** Callback al cambiar de página */
  onPageChange: (page: number) => void;
  /** Callback al cambiar tamaño de página */
  onPageSizeChange: (size: number) => void;
  /** Opciones de tamaño de página (default: [10, 25, 50]) */
  pageSizeOptions?: number[];
  /** Mostrar total de registros (default: true) */
  showTotal?: boolean;
  /** Mostrar selector de tamaño (default: true) */
  showPageSize?: boolean;
  /** Clases CSS adicionales */
  className?: string;
  /** Deshabilitar controles durante carga */
  disabled?: boolean;
}

/**
 * Componente reutilizable de controles de paginación.
 * 
 * Características:
 * - Botones Prev/Next con estados disabled correctos
 * - Selector de tamaño de página
 * - Muestra total de resultados y página actual
 * - Totalmente agnóstico a datos (solo recibe metadata)
 * 
 * @example
 * ```tsx
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
export function PaginationControls({
  paginaActual,
  totalPaginas,
  tamanoPagina,
  totalRegistros,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  showTotal = true,
  showPageSize = true,
  className = '',
  disabled = false,
}: PaginationControlsProps) {
  const { t } = useTranslation();
  const hasPrevious = paginaActual > 1;
  const hasNext = paginaActual < totalPaginas;

  const handlePrevious = () => {
    if (hasPrevious && !disabled) {
      onPageChange(paginaActual - 1);
    }
  };

  const handleNext = () => {
    if (hasNext && !disabled) {
      onPageChange(paginaActual + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (!disabled && !isNaN(newSize)) {
      onPageSizeChange(newSize);
    }
  };

  // No mostrar si no hay registros
  if (totalRegistros === 0) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-3 px-4 border-t border-border ${className}`}>
      {/* Info de resultados */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-text-muted">
        {showTotal && (
          <span>
            {totalRegistros} {totalRegistros === 1 ? t('common.results') : t('common.results_plural')}
          </span>
        )}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span>{t('common.show')}</span>
            <select
              value={tamanoPagina}
              onChange={handlePageSizeChange}
              disabled={disabled}
              className="px-2 py-1 rounded border border-border bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>{t('common.perPage')}</span>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-muted">
          {t('common.page')} {paginaActual} {t('common.of')} {totalPaginas}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={!hasPrevious || disabled}
            className="p-1.5 rounded border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('common.page') + ' ' + t('common.previous')}
          >
            <ChevronLeft size={18} className="text-text" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext || disabled}
            className="p-1.5 rounded border border-border hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('common.page') + ' ' + t('common.next')}
          >
            <ChevronRight size={18} className="text-text" />
          </button>
        </div>
      </div>
    </div>
  );
}
