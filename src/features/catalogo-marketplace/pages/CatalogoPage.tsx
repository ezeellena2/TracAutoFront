import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { SpinnerPantalla, EstadoVacio, EstadoError } from '@/shared/ui';
import { useVehiculos } from '../hooks/useVehiculos';
import { useConcesionarias } from '../hooks/useConcesionarias';
import { GrillaVehiculos } from '../components/GrillaVehiculos';
import type { FiltrosVehiculoPublico } from '../types';
import { useTranslation } from 'react-i18next';

export function CatalogoPage() {
  const { t } = useTranslation();
  const [filtros, setFiltros] = useState<FiltrosVehiculoPublico>({
    numeroPagina: 1,
    tamanoPagina: 12,
  });
  const [busqueda, setBusqueda] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setFiltros((prev) => ({
        ...prev,
        marca: busqueda || undefined,
        numeroPagina: 1,
      }));
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [busqueda]);

  const { data, isLoading, isError, error, refetch } = useVehiculos(filtros);
  const { data: concesionarias, isLoading: isLoadingConcesionarias } = useConcesionarias();

  if (isLoading) return <SpinnerPantalla />;

  if (isError) {
    return (
      <div className="container-app py-8">
        <EstadoError
          mensaje={error instanceof Error ? error.message : t('catalogoMarketplace.errorCarga')}
          onReintentar={() => refetch()}
        />
      </div>
    );
  }

  const vehiculos = data?.items || [];
  const totalRegistros = data?.totalRegistros || 0;

  return (
    <div className="container-app py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-2">
          {t('catalogoMarketplace.titulo')}
        </h1>
        <p className="text-text-muted">
          {totalRegistros > 0
            ? t('catalogoMarketplace.disponibles', { count: totalRegistros })
            : t('catalogoMarketplace.subtitulo')}
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder={t('catalogoMarketplace.buscarPlaceholder')}
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-text placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.trim())}
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text focus:border-primary focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"
            value={filtros.concesionariaId || ''}
            onChange={(e) => {
              const valor = e.target.value;
              setFiltros((prev) => ({
                ...prev,
                concesionariaId: valor || undefined,
                numeroPagina: 1,
              }));
            }}
            disabled={isLoadingConcesionarias}
          >
            <option value="">{t('catalogoMarketplace.todasConcesionarias')}</option>
            {concesionarias?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {vehiculos.length > 0 ? (
        <>
          <GrillaVehiculos vehiculos={vehiculos} />

          {data && data.totalPaginas > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setFiltros((prev) => ({
                  ...prev,
                  numeroPagina: Math.max(1, (prev.numeroPagina || 1) - 1),
                }))}
                disabled={filtros.numeroPagina === 1}
                className="px-4 py-2 border border-border rounded-lg text-text-muted hover:text-text hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.previous')}
              </button>
              <span className="px-4 py-2 text-text-muted">
                {t('catalogoMarketplace.paginaIndicador', {
                  current: data.paginaActual,
                  total: data.totalPaginas,
                })}
              </span>
              <button
                onClick={() => setFiltros((prev) => ({
                  ...prev,
                  numeroPagina: Math.min(data.totalPaginas, (prev.numeroPagina || 1) + 1),
                }))}
                disabled={filtros.numeroPagina === data.totalPaginas}
                className="px-4 py-2 border border-border rounded-lg text-text-muted hover:text-text hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      ) : (
        <EstadoVacio
          titulo={t('catalogoMarketplace.sinVehiculos')}
          descripcion={t('catalogoMarketplace.sinVehiculosHint')}
        />
      )}
    </div>
  );
}
