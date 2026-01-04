import React from 'react';
import { ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ColumnFilterConfig {
  type: 'text' | 'select' | 'boolean' | 'date-range';
  field?: string;
  options?: { label: string; value: any }[];
  placeholder?: string;
}

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filter?: ColumnFilterConfig;
  /** Hide this column on mobile when using table view (not affects card view) */
  mobileHidden?: boolean;
  /** Priority for mobile card view: 1=primary (title), 2=secondary, 3+=detail */
  mobilePriority?: number;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Enable card-based rendering on mobile (< 640px) instead of table */
  mobileCardView?: boolean;

  // Filter props
  enableFilters?: boolean;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  filters?: Record<string, string>;
  onFilterChange?: (field: string, value: string) => void;
  onClearFilters?: () => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
  containerClassName = '',
  mobileCardView = false,
  enableFilters = false,
  showFilters = false,
  onToggleFilters,
  filters = {},
  onFilterChange,
  onClearFilters
}: TableProps<T> & { containerClassName?: string }) {
  const { t } = useTranslation();

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange?.(key, value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0 && !isLoading && !showFilters) { // Show empty state only if no filters active (or handle differently?)
    // Actually, if filtering yields 0 results, we still want to see the table headers/filters to clear them.
    // But original logic hid everything.
    // Improved logic: If data is 0 but filters are active, show table empty. 
    // For now, keep original behavior partially but allow headers if filters enabled?
    // Complicated to change structure significantly. Let's return empty message but maybe with "Clear filters" button if filters active?
  }

  // If data empty and no filters, return default empty (or if loading). 
  // If data empty BUT filters active, we should render table structure to allow clearing?
  // For MVP let's maintain simple behavior: if data 0, show message. 
  // User can define "emptyMessage" or we can inject a "Clear filters" button there if needed outside.
  if (data.length === 0) {
    // Small adjustment: if filters are active, we might want to show a "Clear Filters" button in the empty state
    // This is outside the Table's responsibility usually, but helpful.
    // For now, stick to standard return.
    return (
      <div className="flex flex-col items-center justify-center py-12 text-text-muted gap-2">
        <span>{emptyMessage}</span>
        {enableFilters && Object.keys(filters).length > 0 && onClearFilters && (
          <button onClick={onClearFilters} className="text-primary hover:underline text-sm flex items-center gap-1">
            <X size={14} /> {t('filters.clear')}
          </button>
        )}
      </div>
    );
  }

  // Helper to render cell content
  const renderCell = (col: Column<T>, item: T) => {
    return col.render
      ? col.render(item)
      : String((item as Record<string, unknown>)[col.key] ?? '-');
  };

  // Helper to render filter input
  const renderFilterInput = (col: Column<T>) => {
    if (!col.filter) return null;

    const fieldKey = col.filter.field || col.key;
    const value = filters[fieldKey] || '';

    switch (col.filter.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(fieldKey, e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-border bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{col.filter.placeholder || t('filters.placeholder.select') || 'All'}</option>
            {col.filter.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleFilterChange(fieldKey, e.target.value)}
            className="w-full text-xs px-2 py-1 rounded border border-border bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">{t('common.all') || 'Todos'}</option>
            <option value="true">{t('common.active') || 'Si'}</option>
            <option value="false">{t('common.inactive') || 'No'}</option>
          </select>
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFilterChange(fieldKey, e.target.value)}
            placeholder={col.filter.placeholder || t('filters.placeholder.text') || 'Search...'}
            className="w-full text-xs px-2 py-1 rounded border border-border bg-background text-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        );
    }
  };

  const TableContent = () => (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          {columns.map((col, idx) => (
            <th
              key={col.key}
              className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider ${col.mobileHidden ? 'hidden sm:table-cell' : ''}`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp size={12} className="text-text-muted" />
                      <ChevronDown size={12} className="-mt-1 text-text-muted" />
                    </div>
                  )}
                </div>
                {/* Toggle Button only on last column or specific place? No, usually in a toolbar. 
                      Here we inject it in the header if it's the last column? 
                      Or better, allow passing a "Actions" column that has it.
                      User requested: "agregá un toggle “mostrar filtros” (icono de funnel)"
                      Ideally this is outside the table, but if we want it self-contained:
                      Put it in the last header cell?
                   */}
                {enableFilters && idx === columns.length - 1 && onToggleFilters && (
                  <button
                    onClick={onToggleFilters}
                    className={`p-1 rounded hover:bg-surface-hover ${showFilters ? 'text-primary' : 'text-text-muted'}`}
                    title={showFilters ? t('filters.hide') : t('filters.show')}
                  >
                    <Filter size={16} />
                  </button>
                )}
              </div>
            </th>
          ))}
        </tr>
        {/* Filter Row */}
        {enableFilters && showFilters && (
          <tr className="bg-surface/50 border-b border-border">
            {columns.map((col) => (
              <th key={`${col.key}-filter`} className={`px-4 py-2 ${col.mobileHidden ? 'hidden sm:table-cell' : ''}`}>
                {renderFilterInput(col)}
              </th>
            ))}
          </tr>
        )}
      </thead>
      <tbody className="divide-y divide-border">
        {data.map((item) => (
          <tr
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`
                hover:bg-background/50 transition-colors
                ${onRowClick ? 'cursor-pointer' : ''}
              `}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`px-4 py-4 text-sm text-text ${col.mobileHidden ? 'hidden sm:table-cell' : ''}`}
              >
                {renderCell(col, item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Mobile card view rendering
  if (mobileCardView) {
    // ... (Rest of mobile card view logic - reused)
    // Note: Filters on mobile? 
    // User says "Responsive". Filter row in Query String works, but UI?
    // For MVP, if mobileCardView is active, we validly typically show a different Filter UI (Sheet/Drawer).
    // Here, keeping the Table component simple: Filters only appear in Desktop Table mode for now?
    // Or we render the filter toggle somewhere?
    // Let's assume Filters are primarily for the Desktop Table view in Phase 1 MVP.
    // Mobile users might need a separate filter panel implementation.
    // However, the requested plan didn't specify strict mobile filter UI.

    // Sort columns by priority for card view
    const sortedColumns = [...columns].sort((a, b) =>
      (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99)
    );
    const primaryCol = sortedColumns[0];
    const secondaryCol = sortedColumns[1];
    const detailCols = sortedColumns.slice(2);

    return (
      <>
        {/* Toggle Filters Button for Mobile? Maybe stick to top right action in page. */}

        {/* Mobile cards - visible only on small screens */}
        <div className={`sm:hidden space-y-3 p-2 ${containerClassName}`}>
          {/* If filters enabled, maybe show a summary or clear button? */}
          {enableFilters && showFilters && (
            <div className="p-2 mb-2 bg-surface rounded border border-border text-xs">
              {/* Simplified mobile filter renderer could go here but it's complex */}
              <div className="flex justify-between items-center text-text-muted">
                <span>Filtros activos: {Object.keys(filters).length}</span>
                {onToggleFilters && <button onClick={onToggleFilters}><Filter size={14} /></button>}
              </div>
              {/* Inputs stack? */}
              <div className="grid gap-2 mt-2">
                {columns.filter(c => c.filter).map(col => (
                  <div key={col.key}>
                    <label className="block text-xxs uppercase text-text-muted mb-1">{col.header}</label>
                    {renderFilterInput(col)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`
                bg-surface border border-border rounded-lg p-4 space-y-2
                ${onRowClick ? 'cursor-pointer hover:bg-background/50 active:bg-background transition-colors' : ''}
              `}
            >
              {/* Primary row (first column, larger) */}
              {primaryCol && (
                <div className="font-medium text-text">
                  {renderCell(primaryCol, item)}
                </div>
              )}
              {/* Secondary row */}
              {secondaryCol && (
                <div className="text-sm text-text-muted">
                  {renderCell(secondaryCol, item)}
                </div>
              )}
              {/* Detail rows */}
              {detailCols.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-border">
                  {detailCols.map((col) => (
                    <div key={col.key} className="text-xs">
                      <span className="text-text-muted">{col.header}: </span>
                      <span className="text-text">{renderCell(col, item)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table - hidden on small screens */}
        <div className={`hidden sm:block overflow-x-auto ${containerClassName}`}>
          <TableContent />
        </div>
      </>
    );
  }

  // Default table view with optional column hiding on mobile
  return (
    <div className={`overflow-x-auto ${containerClassName}`}>
      <TableContent />
    </div>
  );
}

