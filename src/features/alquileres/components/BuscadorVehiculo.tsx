import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Spinner } from '@/shared/ui';
import { getVehiculos } from '@/services/endpoints/vehiculos.api';
import type { VehiculoDto } from '@/features/vehicles/types';

interface BuscadorVehiculoProps {
  vehiculoId: string;
  vehiculoLabel: string;
  error?: string;
  disabled?: boolean;
  onSelect: (vehiculo: { id: string; label: string }) => void;
  onClear: () => void;
}

function formatVehiculoLabel(v: VehiculoDto): string {
  const parts = [v.patente];
  if (v.marca) parts.push(v.marca);
  if (v.modelo) parts.push(v.modelo);
  if (v.anio) parts.push(String(v.anio));
  return parts.join(' — ');
}

export function BuscadorVehiculo({
  vehiculoId,
  vehiculoLabel,
  error,
  disabled,
  onSelect,
  onClear,
}: BuscadorVehiculoProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VehiculoDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
    setIsSearching(true);
    try {
      const data = await getVehiculos({
        filtroPatente: searchQuery,
        tamanoPagina: 10,
        soloActivos: true,
        soloPropios: true,
      });
      setResults(data.items);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
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
    };
  }, []);

  const handleSelect = (vehiculo: VehiculoDto) => {
    onSelect({ id: vehiculo.id, label: formatVehiculoLabel(vehiculo) });
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setResults([]);
  };

  // Si ya hay un vehículo seleccionado, mostrar chip
  if (vehiculoId) {
    return (
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.flota.form.buscarVehiculo')}
        </label>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border">
          <span className="text-sm text-text flex-1">{vehiculoLabel}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-text"
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
        {t('alquileres.flota.form.buscarVehiculo')} <span className="text-error">*</span>
      </label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('alquileres.flota.form.buscarVehiculoPlaceholder')}
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
              {t('alquileres.flota.form.sinResultados')}
            </p>
          ) : (
            <ul className="py-1">
              {results.map(v => (
                <li
                  key={v.id}
                  onClick={() => handleSelect(v)}
                  className="cursor-pointer px-4 py-2 text-sm text-text hover:bg-border transition-colors"
                >
                  <span className="font-medium">{v.patente}</span>
                  {v.marca && <span className="text-text-muted"> — {v.marca} {v.modelo} {v.anio}</span>}
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
