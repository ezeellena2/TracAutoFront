import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
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
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
  containerClassName = '',
  mobileCardView = false
}: TableProps<T> & { containerClassName?: string }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted">
        {emptyMessage}
      </div>
    );
  }

  // Helper to render cell content
  const renderCell = (col: Column<T>, item: T) => {
    return col.render
      ? col.render(item)
      : String((item as Record<string, unknown>)[col.key] ?? '-');
  };

  // Mobile card view rendering
  if (mobileCardView) {
    // Sort columns by priority for card view
    const sortedColumns = [...columns].sort((a, b) =>
      (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99)
    );
    const primaryCol = sortedColumns[0];
    const secondaryCol = sortedColumns[1];
    const detailCols = sortedColumns.slice(2);

    return (
      <>
        {/* Mobile cards - visible only on small screens */}
        <div className={`sm:hidden space-y-3 p-2 ${containerClassName}`}>
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider"
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp size={12} className="text-text-muted" />
                          <ChevronDown size={12} className="-mt-1 text-text-muted" />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
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
                    <td key={col.key} className="px-4 py-4 text-sm text-text">
                      {renderCell(col, item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // Default table view with optional column hiding on mobile
  return (
    <div className={`overflow-x-auto ${containerClassName}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase tracking-wider ${col.mobileHidden ? 'hidden sm:table-cell' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <div className="flex flex-col">
                      <ChevronUp size={12} className="text-text-muted" />
                      <ChevronDown size={12} className="-mt-1 text-text-muted" />
                    </div>
                  )}
                </div>
              </th>
            ))}
          </tr>
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
    </div>
  );
}

