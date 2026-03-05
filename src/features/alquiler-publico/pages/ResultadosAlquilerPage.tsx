import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Button, EstadoVacio, EstadoError } from '@/shared/ui';
import { SkeletonTarjetaVehiculo } from '../components/skeletons/SkeletonTarjetaVehiculo';
import { CategoriaAlquiler } from '@/features/alquileres/types/vehiculoAlquiler';
import { formatDateShort } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import { BuscadorAlquiler } from '../components/BuscadorAlquiler';
import { TarjetaVehiculoAlquiler } from '../components/TarjetaVehiculoAlquiler';
import { useSucursalesPublicas } from '../hooks/useSucursalesPublicas';
import { useVehiculosDisponibles } from '../hooks/useVehiculosDisponibles';
import type { BusquedaParams } from '../types/busqueda';

type Ordenamiento = 'default' | 'precioAsc' | 'precioDesc' | 'categoria';

// Valores numéricos del enum para iterar
const CATEGORIA_VALUES = Object.values(CategoriaAlquiler).filter(
  (v): v is number => typeof v === 'number',
);

export default function ResultadosAlquilerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { culture, timeZoneId } = useLocalization();

  // Parsear params de URL
  const busquedaParams = useMemo<BusquedaParams | null>(() => {
    const sucursalRecogidaId = searchParams.get('sucursalRecogidaId');
    const fechaHoraRecogida = searchParams.get('fechaHoraRecogida');
    const fechaHoraDevolucion = searchParams.get('fechaHoraDevolucion');

    if (!sucursalRecogidaId || !fechaHoraRecogida || !fechaHoraDevolucion) return null;

    const params: BusquedaParams = {
      sucursalRecogidaId,
      fechaHoraRecogida,
      fechaHoraDevolucion,
    };

    const sucursalDevolucionId = searchParams.get('sucursalDevolucionId');
    if (sucursalDevolucionId) params.sucursalDevolucionId = sucursalDevolucionId;

    const categoriaAlquiler = searchParams.get('categoriaAlquiler');
    if (categoriaAlquiler) params.categoriaAlquiler = Number(categoriaAlquiler);

    return params;
  }, [searchParams]);

  // Data hooks
  const { sucursales } = useSucursalesPublicas();
  const { vehiculos, isLoading, error, refetch } = useVehiculosDisponibles(busquedaParams);

  // Resolver nombres de sucursales
  const sucursalRecogidaNombre = useMemo(() => {
    if (!busquedaParams) return '';
    return sucursales.find(s => s.id === busquedaParams.sucursalRecogidaId)?.nombre ?? '';
  }, [sucursales, busquedaParams]);

  const sucursalDevolucionNombre = useMemo(() => {
    if (!busquedaParams?.sucursalDevolucionId) return '';
    return sucursales.find(s => s.id === busquedaParams.sucursalDevolucionId)?.nombre ?? '';
  }, [sucursales, busquedaParams]);

  // Opciones de categoría con i18n
  const categoriaOptions = useMemo(
    () => CATEGORIA_VALUES.map(v => ({ value: v, label: t(`alquileres.flota.categorias.${v}`) })),
    [t],
  );

  // UI states
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filtros locales
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(
    busquedaParams?.categoriaAlquiler ?? null,
  );
  const [precioMin, setPrecioMin] = useState<number | ''>('');
  const [precioMax, setPrecioMax] = useState<number | ''>('');
  const [transmisionFiltro, setTransmisionFiltro] = useState<number | null>(null);
  const [pasajerosMinimo, setPasajerosMinimo] = useState<number | ''>('');
  const [ordenamiento, setOrdenamiento] = useState<Ordenamiento>('default');

  const hayFiltrosActivos = categoriaFiltro !== null || precioMin !== '' || precioMax !== '' || transmisionFiltro !== null || pasajerosMinimo !== '';

  const limpiarFiltros = useCallback(() => {
    setCategoriaFiltro(null);
    setPrecioMin('');
    setPrecioMax('');
    setTransmisionFiltro(null);
    setPasajerosMinimo('');
    setOrdenamiento('default');
  }, []);

  // Filtrado + ordenamiento local
  const vehiculosFiltrados = useMemo(() => {
    let resultado = [...vehiculos];

    // Filtrar por categoría
    if (categoriaFiltro !== null) {
      resultado = resultado.filter(v => v.categoriaAlquiler === categoriaFiltro);
    }

    // Filtrar por precio
    if (precioMin !== '') {
      resultado = resultado.filter(v => v.precioIndicativo >= precioMin);
    }
    if (precioMax !== '') {
      resultado = resultado.filter(v => v.precioIndicativo <= precioMax);
    }

    // Filtrar por transmisión
    if (transmisionFiltro !== null) {
      resultado = resultado.filter(v => v.transmision === transmisionFiltro);
    }

    // Filtrar por pasajeros mínimo
    if (pasajerosMinimo !== '') {
      resultado = resultado.filter(v => v.cantidadPasajeros != null && v.cantidadPasajeros >= pasajerosMinimo);
    }

    // Ordenar
    switch (ordenamiento) {
      case 'precioAsc':
        resultado.sort((a, b) => a.precioIndicativo - b.precioIndicativo);
        break;
      case 'precioDesc':
        resultado.sort((a, b) => b.precioIndicativo - a.precioIndicativo);
        break;
      case 'categoria':
        resultado.sort((a, b) => a.categoriaAlquiler - b.categoriaAlquiler);
        break;
    }

    return resultado;
  }, [vehiculos, categoriaFiltro, precioMin, precioMax, transmisionFiltro, pasajerosMinimo, ordenamiento]);

  // Params inválidos → volver a buscar
  if (!busquedaParams) {
    return (
      <div className="container-app py-12">
        <EstadoVacio
          titulo={t('alquilerPublico.resultados.parametrosInvalidos')}
          descripcion={t('alquilerPublico.resultados.sinResultadosHint')}
        />
        <div className="flex justify-center mt-6">
          <Button variant="primary" onClick={() => navigate('/')}>
            {t('alquilerPublico.resultados.volverABuscar')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-6 space-y-6">
      <Helmet>
        <title>{t('alquilerPublico.resultados.titulo')} — {sucursalRecogidaNombre}</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Resumen de búsqueda */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm text-text flex-wrap">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-primary" />
              {sucursalRecogidaNombre}
              {sucursalDevolucionNombre && ` → ${sucursalDevolucionNombre}`}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              {formatDateShort(busquedaParams.fechaHoraRecogida, culture, timeZoneId)}
              {' - '}
              {formatDateShort(busquedaParams.fechaHoraDevolucion, culture, timeZoneId)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarBuscador(!mostrarBuscador)}
          >
            {mostrarBuscador ? (
              <><ChevronUp size={14} className="mr-1.5" />{t('alquilerPublico.resultados.ocultarBusqueda')}</>
            ) : (
              <><ChevronDown size={14} className="mr-1.5" />{t('alquilerPublico.resultados.modificarBusqueda')}</>
            )}
          </Button>
        </div>

        {/* Buscador expandible */}
        {mostrarBuscador && (
          <div className="mt-4 pt-4 border-t border-border">
            <BuscadorAlquiler
              sucursales={sucursales}
              initialParams={busquedaParams}
            />
          </div>
        )}
      </div>

      {/* Contenido principal: sidebar + grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Botón filtros mobile */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="w-full"
          >
            <SlidersHorizontal size={14} className="mr-1.5" />
            {mostrarFiltros
              ? t('alquilerPublico.filtros.ocultar')
              : t('alquilerPublico.filtros.mostrar')}
          </Button>
        </div>

        {/* Sidebar filtros */}
        <aside className={`lg:w-60 shrink-0 space-y-4 ${mostrarFiltros ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-semibold text-text text-sm">{t('alquilerPublico.filtros.titulo')}</h3>

            {/* Categoría */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                {t('alquilerPublico.filtros.categoria')}
              </label>
              <select
                value={categoriaFiltro ?? ''}
                onChange={(e) => setCategoriaFiltro(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">{t('alquilerPublico.filtros.todasCategorias')}</option>
                {categoriaOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Precio mínimo */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                {t('alquilerPublico.filtros.precioMinimo')}
              </label>
              <input
                type="number"
                min={0}
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Precio máximo */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                {t('alquilerPublico.filtros.precioMaximo')}
              </label>
              <input
                type="number"
                min={0}
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value ? Number(e.target.value) : '')}
                placeholder="999999"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Transmisión */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                {t('alquilerPublico.filtros.transmision')}
              </label>
              <select
                value={transmisionFiltro ?? ''}
                onChange={(e) => setTransmisionFiltro(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">{t('alquilerPublico.filtros.todasTransmisiones')}</option>
                <option value="0">{t('alquilerPublico.filtros.manual')}</option>
                <option value="1">{t('alquilerPublico.filtros.automatica')}</option>
              </select>
            </div>

            {/* Pasajeros mínimo */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                {t('alquilerPublico.filtros.pasajerosMinimo')}
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={pasajerosMinimo}
                onChange={(e) => setPasajerosMinimo(e.target.value ? Number(e.target.value) : '')}
                placeholder="2"
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>

            {/* Ordenamiento */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">
                {t('alquilerPublico.filtros.ordenar')}
              </label>
              <select
                value={ordenamiento}
                onChange={(e) => setOrdenamiento(e.target.value as Ordenamiento)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="default">{t('alquilerPublico.filtros.relevancia')}</option>
                <option value="precioAsc">{t('alquilerPublico.filtros.precioMenor')}</option>
                <option value="precioDesc">{t('alquilerPublico.filtros.precioMayor')}</option>
                <option value="categoria">{t('alquilerPublico.filtros.porCategoria')}</option>
              </select>
            </div>

            {/* Limpiar filtros */}
            {hayFiltrosActivos && (
              <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="w-full">
                <X size={14} className="mr-1.5" />
                {t('alquilerPublico.filtros.limpiar')}
              </Button>
            )}
          </div>
        </aside>

        {/* Grid de resultados */}
        <main className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTarjetaVehiculo key={i} />
              ))}
            </div>
          ) : error ? (
            <EstadoError onReintentar={refetch} />
          ) : vehiculosFiltrados.length === 0 ? (
            vehiculos.length > 0 ? (
              // Hay vehículos del API pero los filtros los eliminaron
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <EstadoVacio
                  titulo={t('alquilerPublico.resultados.sinResultadosFiltros')}
                  descripcion={t('alquilerPublico.resultados.sinResultadosFiltrosHint')}
                />
                <Button variant="outline" size="sm" onClick={limpiarFiltros} className="mt-4">
                  <X size={14} className="mr-1.5" />
                  {t('alquilerPublico.filtros.limpiar')}
                </Button>
              </div>
            ) : (
              <EstadoVacio
                titulo={t('alquilerPublico.resultados.sinResultados')}
                descripcion={t('alquilerPublico.resultados.sinResultadosHint')}
              />
            )
          ) : (
            <>
              {/* Conteo */}
              <p className="text-sm text-text-muted mb-4">
                {t('alquilerPublico.resultados.conteo', { count: vehiculosFiltrados.length })}
              </p>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {vehiculosFiltrados.map(v => (
                  <TarjetaVehiculoAlquiler key={v.id} vehiculo={v} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
