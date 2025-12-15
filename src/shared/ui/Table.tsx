import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({ 
  columns, 
  data, 
  keyExtractor, 
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos para mostrar',
  containerClassName = ''
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

  return (
    <div className={`overflow-x-auto ${containerClassName}`}>
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
                  {col.render 
                    ? col.render(item) 
                    : String((item as Record<string, unknown>)[col.key] ?? '-')
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
