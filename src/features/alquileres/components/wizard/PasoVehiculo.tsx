import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { Input, Select, Spinner } from '@/shared/ui';
import { vehiculosAlquilerApi } from '@/services/endpoints';
import { CategoriaAlquiler } from '../../types/vehiculoAlquiler';
import type { VehiculoAlquilerDto } from '../../types/vehiculoAlquiler';
import type { SucursalDto } from '../../types/sucursal';
import type { WizardVehiculoData, WizardVehiculoErrors } from '../../types/wizard';

interface PasoVehiculoProps {
  data: WizardVehiculoData;
  errors: WizardVehiculoErrors;
  sucursales: SucursalDto[];
  isLoadingSucursales: boolean;
  onChange: (partial: Partial<WizardVehiculoData>) => void;
}

export function PasoVehiculo({ data, errors, sucursales, isLoadingSucursales, onChange }: PasoVehiculoProps) {
  const { t } = useTranslation();

  const categoriaOptions = Object.values(CategoriaAlquiler)
    .filter((v): v is number => typeof v === 'number')
    .map(v => ({ value: v, label: t(`alquileres.flota.categorias.${v}`) }));

  const sucursalOptions = sucursales.map(s => ({
    value: s.id,
    label: s.nombre,
  }));

  // --- Buscador de vehiculo inline ---
  const [vehiculoQuery, setVehiculoQuery] = useState('');
  const [vehiculoResults, setVehiculoResults] = useState<VehiculoAlquilerDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const searchVehiculos = useCallback(async (q: string) => {
    if (q.length < 2) {
      setVehiculoResults([]);
      setIsDropdownOpen(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);
    try {
      const res = await vehiculosAlquilerApi.list({
        buscar: q,
        soloActivos: true,
        tamanoPagina: 10,
        categoria: data.categoriaAlquiler !== '' ? data.categoriaAlquiler : undefined,
      }, controller.signal);
      if (!controller.signal.aborted) {
        setVehiculoResults(res.items);
        setIsDropdownOpen(true);
      }
    } catch {
      if (!controller.signal.aborted) setVehiculoResults([]);
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }, [data.categoriaAlquiler]);

  const handleVehiculoQueryChange = (value: string) => {
    setVehiculoQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchVehiculos(value), 300);
  };

  const handleSelectVehiculo = (v: VehiculoAlquilerDto) => {
    onChange({
      vehiculoAlquilerId: v.id,
      vehiculoSeleccionado: v,
      categoriaAlquiler: v.categoriaAlquiler,
    });
    setVehiculoQuery('');
    setVehiculoResults([]);
    setIsDropdownOpen(false);
  };

  const handleClearVehiculo = () => {
    onChange({
      vehiculoAlquilerId: null,
      vehiculoSeleccionado: null,
    });
    setVehiculoQuery('');
    setVehiculoResults([]);
  };

  const handleMismaSucursalToggle = (checked: boolean) => {
    if (checked) {
      onChange({
        mismaSucursal: true,
        sucursalDevolucionId: data.sucursalRecogidaId,
      });
    } else {
      onChange({ mismaSucursal: false });
    }
  };

  return (
    <div className="px-6 space-y-5">
      <h3 className="text-base font-semibold text-text">
        {t('alquileres.wizard.vehiculo.titulo')}
      </h3>

      {/* Categoria */}
      <Select
        label={t('alquileres.wizard.vehiculo.categoria')}
        value={data.categoriaAlquiler}
        onChange={(v) => onChange({ categoriaAlquiler: Number(v) })}
        options={categoriaOptions}
        placeholder={t('alquileres.wizard.vehiculo.categoriaPlaceholder')}
        error={errors.categoriaAlquiler}
        required={!data.vehiculoAlquilerId}
      />

      {/* Vehiculo opcional */}
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.wizard.vehiculo.vehiculoOpcional')}
        </label>

        {data.vehiculoSeleccionado ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border">
            <span className="text-sm text-text flex-1">
              {data.vehiculoSeleccionado.patente} — {data.vehiculoSeleccionado.marca} {data.vehiculoSeleccionado.modelo} {data.vehiculoSeleccionado.anio}
            </span>
            <button
              type="button"
              onClick={handleClearVehiculo}
              className="text-text-muted hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                role="combobox"
                aria-expanded={isDropdownOpen}
                aria-autocomplete="list"
                value={vehiculoQuery}
                onChange={(e) => handleVehiculoQueryChange(e.target.value)}
                placeholder={t('alquileres.wizard.vehiculo.buscarVehiculo')}
                className="w-full pl-10 pr-10 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Spinner />
                </div>
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 mt-1.5 w-full bg-surface border border-border rounded-lg shadow-xl max-h-[200px] overflow-auto animate-fade-in">
                {vehiculoResults.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-text-muted">
                    {t('alquileres.wizard.vehiculo.sinResultados')}
                  </p>
                ) : (
                  <ul className="py-1">
                    {vehiculoResults.map(v => (
                      <li
                        key={v.id}
                        onClick={() => handleSelectVehiculo(v)}
                        className="cursor-pointer px-4 py-2 text-sm text-text hover:bg-border transition-colors"
                      >
                        <span className="font-medium">{v.patente}</span>
                        <span className="text-text-muted"> — {v.marca} {v.modelo} {v.anio}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sucursales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label={t('alquileres.wizard.vehiculo.sucursalRecogida')}
          value={data.sucursalRecogidaId}
          onChange={(v) => onChange({ sucursalRecogidaId: String(v) })}
          options={sucursalOptions}
          placeholder={t('alquileres.wizard.vehiculo.sucursalRecogidaPlaceholder')}
          error={errors.sucursalRecogidaId}
          required
          disabled={isLoadingSucursales}
        />
        <div>
          <Select
            label={t('alquileres.wizard.vehiculo.sucursalDevolucion')}
            value={data.sucursalDevolucionId}
            onChange={(v) => onChange({ sucursalDevolucionId: String(v), mismaSucursal: false })}
            options={sucursalOptions}
            placeholder={t('alquileres.wizard.vehiculo.sucursalDevolucionPlaceholder')}
            error={errors.sucursalDevolucionId}
            required
            disabled={data.mismaSucursal || isLoadingSucursales}
          />
          <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={data.mismaSucursal}
              onChange={(e) => handleMismaSucursalToggle(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs text-text-muted">
              {t('alquileres.wizard.vehiculo.mismaSucursal')}
            </span>
          </label>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t('alquileres.wizard.vehiculo.fechaHoraRecogida')}
          type="datetime-local"
          value={data.fechaHoraRecogida}
          onChange={(e) => onChange({ fechaHoraRecogida: e.target.value })}
          error={errors.fechaHoraRecogida}
          required
        />
        <Input
          label={t('alquileres.wizard.vehiculo.fechaHoraDevolucion')}
          type="datetime-local"
          value={data.fechaHoraDevolucion}
          onChange={(e) => onChange({ fechaHoraDevolucion: e.target.value })}
          error={errors.fechaHoraDevolucion}
          required
        />
      </div>
      {errors.fechasRango && (
        <p className="text-sm text-error">{errors.fechasRango}</p>
      )}
    </div>
  );
}
