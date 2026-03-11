import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { clientesAlquilerApi } from '@/services/endpoints';
import type { ClienteAlquilerDto } from '../../types/cliente';

interface BuscadorClienteProps {
  clienteSeleccionado: ClienteAlquilerDto | null;
  onSelect: (cliente: ClienteAlquilerDto) => void;
  onClear: () => void;
  error?: string;
  disabled?: boolean;
}

function formatClienteLabel(c: ClienteAlquilerDto): string {
  return `${c.nombre} ${c.apellido}`;
}

function formatDocumento(c: ClienteAlquilerDto): string {
  return c.numeroDocumento;
}

export function BuscadorCliente({
  clienteSeleccionado,
  onSelect,
  onClear,
  error,
  disabled,
}: BuscadorClienteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClienteAlquilerDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);
    try {
      const data = await clientesAlquilerApi.list({
        buscar: searchQuery,
        tamanoPagina: 10,
      }, controller.signal);
      if (!controller.signal.aborted) {
        setResults(data.items);
        setIsOpen(true);
      }
    } catch {
      if (!controller.signal.aborted) setResults([]);
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const handleSelect = (cliente: ClienteAlquilerDto) => {
    onSelect(cliente);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setResults([]);
  };

  // Si ya hay un cliente seleccionado, mostrar chip
  if (clienteSeleccionado) {
    return (
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.wizard.cliente.buscarExistente')}
        </label>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-text font-medium">
              {formatClienteLabel(clienteSeleccionado)}
            </span>
            <span className="text-xs text-text-muted ml-2">
              {clienteSeleccionado.email} · {formatDocumento(clienteSeleccionado)}
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-text mb-1.5">
        {t('alquileres.wizard.cliente.buscarExistente')} <span className="text-error">*</span>
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('alquileres.wizard.cliente.buscarPlaceholder')}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${error ? 'border-error focus:ring-error' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface border border-border rounded-lg shadow-xl max-h-[200px] overflow-auto animate-fade-in">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">
              {t('alquileres.wizard.cliente.sinResultados')}
            </p>
          ) : (
            <ul className="py-1">
              {results.map(c => (
                <li
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="cursor-pointer px-4 py-2 text-sm text-text hover:bg-border transition-colors"
                >
                  <div>
                    <span className="font-medium">{c.nombre} {c.apellido}</span>
                    <span className="text-text-muted ml-2">· {c.email}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    {formatDocumento(c)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
}
