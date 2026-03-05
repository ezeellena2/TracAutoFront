import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Fuel,
  Shield,
  UserCheck,
  FileText,
  MapPin,
  Tag,
  Cog,
  Users,
  DoorOpen,
  Briefcase,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { EstadoError, Card, CardContent, Button } from '@/shared/ui';
import { SkeletonDetalleVehiculo } from '../components/skeletons/SkeletonDetalleVehiculo';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { CATEGORIA_ICONS } from '../constants/categorias';
import { useVehiculoPublico } from '../hooks/useVehiculoPublico';
import { useSucursalesPublicas } from '../hooks/useSucursalesPublicas';
import { useOpcionesPublicas } from '../hooks/useOpcionesPublicas';
import { ResumenPrecio } from '../components/ResumenPrecio';
import { SelectorOpciones } from '../components/SelectorOpciones';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';
import type { ValidacionPromocionDto } from '@/features/alquileres/types/promocion';

export default function DetalleAlquilerPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleApiError, parseError } = useErrorHandler();

  // Leer params de busqueda desde URL (vienen de /resultados)
  const sucursalRecogidaId = searchParams.get('sucursalRecogidaId');
  const sucursalDevolucionId = searchParams.get('sucursalDevolucionId');
  const fechaHoraRecogida = searchParams.get('fechaHoraRecogida');
  const fechaHoraDevolucion = searchParams.get('fechaHoraDevolucion');
  const tieneFechas = !!sucursalRecogidaId && !!fechaHoraRecogida && !!fechaHoraDevolucion;

  // Data hooks
  const { vehiculo, isLoading, isError, error, refetch } = useVehiculoPublico(id);
  const { sucursales } = useSucursalesPublicas();
  const { coberturas, recargos, isLoading: opcionesLoading } = useOpcionesPublicas(
    sucursalRecogidaId,
    vehiculo?.categoriaAlquiler,
  );

  // Opciones seleccionadas
  const [coberturasSeleccionadasIds, setCoberturasSeleccionadasIds] = useState<string[]>([]);
  const [recargosSeleccionadosIds, setRecargosSeleccionadosIds] = useState<string[]>([]);

  // Resolver nombre de sucursal de recogida para mostrar
  const sucursalRecogidaNombre = useMemo(() => {
    if (!sucursalRecogidaId) return '';
    return sucursales.find(s => s.id === sucursalRecogidaId)?.nombre ?? '';
  }, [sucursales, sucursalRecogidaId]);

  // State cotizacion
  const [cotizacion, setCotizacion] = useState<ResultadoCotizacionDto | null>(null);
  const [cotizacionLoading, setCotizacionLoading] = useState(false);
  const [cotizacionError, setCotizacionError] = useState<string | null>(null);

  // State promo
  const [codigoPromo, setCodigoPromo] = useState('');
  const [promoValidada, setPromoValidada] = useState<ValidacionPromocionDto | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Cotizar
  const cotizar = useCallback(async (codigoPromocion?: string) => {
    if (!id || !sucursalRecogidaId || !fechaHoraRecogida || !fechaHoraDevolucion) return;

    setCotizacionLoading(true);
    setCotizacionError(null);
    try {
      const resultado = await alquilerPublicoApi.cotizar({
        vehiculoAlquilerId: id,
        sucursalRecogidaId,
        sucursalDevolucionId: sucursalDevolucionId ?? sucursalRecogidaId,
        fechaHoraRecogida,
        fechaHoraDevolucion,
        recargosSeleccionadosIds,
        coberturasSeleccionadasIds: coberturasSeleccionadasIds,
        codigoPromocion,
      });
      setCotizacion(resultado);
    } catch (err) {
      const parsed = parseError(err);
      setCotizacionError(parsed.message);
    } finally {
      setCotizacionLoading(false);
    }
  }, [id, sucursalRecogidaId, sucursalDevolucionId, fechaHoraRecogida, fechaHoraDevolucion, coberturasSeleccionadasIds, recargosSeleccionadosIds, parseError]);

  // Ref estable para cotizar (evita re-trigger del efecto cuando cambia la referencia del callback)
  const cotizarRef = useRef(cotizar);
  cotizarRef.current = cotizar;

  // Cotizar automaticamente al cargar con fechas
  useEffect(() => {
    if (tieneFechas && vehiculo) {
      cotizarRef.current();
    }
  }, [tieneFechas, vehiculo]);

  // Re-cotizar con debounce cuando cambian las opciones seleccionadas
  useEffect(() => {
    if (!tieneFechas || !vehiculo) return;
    const timer = setTimeout(() => cotizarRef.current(), 300);
    return () => clearTimeout(timer);
  }, [coberturasSeleccionadasIds, recargosSeleccionadosIds, tieneFechas, vehiculo]);

  // Validar promo
  const validarPromo = useCallback(async () => {
    if (!codigoPromo.trim() || !sucursalRecogidaId) return;

    setPromoLoading(true);
    setPromoError(null);
    setPromoValidada(null);
    try {
      const resultado = await alquilerPublicoApi.validarPromocion({
        codigo: codigoPromo.trim(),
        montoReserva: cotizacion?.subtotal ?? 0,
        sucursalId: sucursalRecogidaId,
      });

      if (resultado.esValida) {
        setPromoValidada(resultado);
        // Re-cotizar con el codigo
        await cotizar(codigoPromo.trim());
      } else {
        const razonKey = resultado.razonInvalidez
          ? `alquilerPublico.promocion.razon.${resultado.razonInvalidez}`
          : '';
        setPromoError(razonKey ? t(razonKey) : t('alquilerPublico.promocion.invalida'));
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setPromoLoading(false);
    }
  }, [codigoPromo, sucursalRecogidaId, cotizacion?.subtotal, cotizar, t, handleApiError]);

  // Reservar
  const handleReservar = useCallback(() => {
    if (!id) return;
    const params = new URLSearchParams(searchParams);
    if (promoValidada?.esValida && codigoPromo.trim()) {
      params.set('codigoPromocion', codigoPromo.trim());
    }
    navigate(`/reservar/${id}?${params.toString()}`);
  }, [id, searchParams, navigate, promoValidada, codigoPromo]);

  // Loading
  if (isLoading) return <SkeletonDetalleVehiculo />;

  // Error
  if (isError || !vehiculo) {
    return (
      <div className="container-app py-8">
        <EstadoError
          mensaje={error instanceof Error ? error.message : undefined}
          onReintentar={() => refetch()}
        />
      </div>
    );
  }

  const Icon = CATEGORIA_ICONS[vehiculo.categoriaAlquiler] ?? Car;
  const categoriaNombre = t(`alquileres.flota.categorias.${vehiculo.categoriaAlquiler}`);
  const titulo = vehiculo.marca && vehiculo.modelo
    ? `${vehiculo.marca} ${vehiculo.modelo}`
    : vehiculo.patente;

  return (
    <div className="container-app py-6 sm:py-8">
      <Helmet>
        <title>{titulo} — {categoriaNombre}</title>
        <meta name="description" content={`${titulo} ${vehiculo.anio ?? ''} — ${categoriaNombre}. ${formatCurrency(vehiculo.precioBaseDiario)}/día`} />
        <meta property="og:title" content={`${titulo} — ${categoriaNombre}`} />
        <meta property="og:description" content={`Alquilá ${titulo} desde ${formatCurrency(vehiculo.precioBaseDiario)}/día`} />
        <meta property="og:type" content="product" />
        {vehiculo.imagenPrincipalUrl && <meta property="og:image" content={vehiculo.imagenPrincipalUrl} />}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: titulo,
            description: `${titulo} ${vehiculo.anio ?? ''} — ${categoriaNombre}`,
            ...(vehiculo.marca ? { brand: { '@type': 'Brand', name: vehiculo.marca } } : {}),
            ...(vehiculo.imagenPrincipalUrl ? { image: vehiculo.imagenPrincipalUrl } : {}),
            offers: {
              '@type': 'Offer',
              price: vehiculo.precioBaseDiario,
              priceCurrency: 'ARS',
              availability: 'https://schema.org/InStock',
            },
          })}
        </script>
      </Helmet>

      {/* Volver */}
      <button
        onClick={() => navigate(tieneFechas ? `/resultados?${searchParams.toString()}` : '/')}
        className="flex items-center gap-2 text-text-muted hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('alquilerPublico.detalle.volver')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hero — foto o icono de categoria */}
          <Card padding="none">
            <div className="relative bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
              {vehiculo.imagenPrincipalUrl ? (
                <img
                  src={vehiculo.imagenPrincipalUrl}
                  alt={titulo}
                  className="w-full h-64 sm:h-80 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="py-16">
                  <Icon className="w-28 h-28 text-primary/50" />
                </div>
              )}
              <span className="absolute top-4 right-4 text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {categoriaNombre}
              </span>
            </div>
            <CardContent>
              <h1 className="text-2xl font-bold text-text">{titulo}</h1>
              {vehiculo.anio && (
                <p className="text-sm text-text-muted mt-1">{vehiculo.anio}</p>
              )}
              {sucursalRecogidaNombre && (
                <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary" />
                  {sucursalRecogidaNombre}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Especificaciones */}
          <Card padding="none">
            <CardContent>
              <h2 className="font-semibold text-lg text-text mb-4">
                {t('alquilerPublico.detalle.especificaciones')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Anio */}
                {vehiculo.anio && (
                  <SpecItem
                    icon={Calendar}
                    label={t('alquilerPublico.detalle.anio')}
                    value={String(vehiculo.anio)}
                  />
                )}
                {/* Categoria */}
                <SpecItem
                  icon={Tag}
                  label={t('alquilerPublico.detalle.categoria')}
                  value={categoriaNombre}
                />
                {/* Transmision */}
                {vehiculo.transmision != null && (
                  <SpecItem
                    icon={Cog}
                    label={t('alquilerPublico.detalle.transmision')}
                    value={t(`alquileres.flota.transmision.${vehiculo.transmision}`)}
                  />
                )}
                {/* Pasajeros */}
                {vehiculo.cantidadPasajeros != null && (
                  <SpecItem
                    icon={Users}
                    label={t('alquilerPublico.detalle.pasajeros')}
                    value={String(vehiculo.cantidadPasajeros)}
                  />
                )}
                {/* Puertas */}
                {vehiculo.cantidadPuertas != null && (
                  <SpecItem
                    icon={DoorOpen}
                    label={t('alquilerPublico.detalle.puertas')}
                    value={String(vehiculo.cantidadPuertas)}
                  />
                )}
                {/* Equipaje */}
                {vehiculo.capacidadEquipaje && (
                  <SpecItem
                    icon={Briefcase}
                    label={t('alquilerPublico.detalle.equipaje')}
                    value={vehiculo.capacidadEquipaje}
                  />
                )}
                {/* Km diario */}
                <SpecItem
                  icon={Gauge}
                  label={t('alquilerPublico.detalle.kmDiario')}
                  value={
                    vehiculo.kilometrajeLimiteDiario != null
                      ? `${vehiculo.kilometrajeLimiteDiario} km`
                      : t('alquilerPublico.detalle.kmIlimitado')
                  }
                />
                {/* Precio por km excedente */}
                <SpecItem
                  icon={Gauge}
                  label={t('alquilerPublico.detalle.precioPorKm')}
                  value={formatCurrency(vehiculo.precioPorKmExcedente)}
                />
                {/* Politica combustible */}
                <SpecItem
                  icon={Fuel}
                  label={t('alquilerPublico.detalle.politicaCombustible')}
                  value={t(`alquileres.flota.politicas.${vehiculo.politicaCombustible}`)}
                />
                {/* Deposito minimo */}
                <SpecItem
                  icon={Shield}
                  label={t('alquilerPublico.detalle.deposito')}
                  value={formatCurrency(vehiculo.depositoMinimo)}
                />
                {/* Edad minima */}
                <SpecItem
                  icon={UserCheck}
                  label={t('alquilerPublico.detalle.edadMinima')}
                  value={t('alquilerPublico.detalle.edadAnios', { edad: vehiculo.edadMinimaConductor })}
                />
                {/* Licencia */}
                <SpecItem
                  icon={FileText}
                  label={t('alquilerPublico.detalle.licencia')}
                  value={vehiculo.licenciaRequerida}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sucursales disponibles */}
          {vehiculo.sucursales.length > 0 && (
            <Card padding="none">
              <CardContent>
                <h2 className="font-semibold text-lg text-text mb-4">
                  {t('alquilerPublico.detalle.disponibleEn')}
                </h2>
                <div className="space-y-2">
                  {vehiculo.sucursales.map(s => (
                    <div key={s.sucursalId} className="flex items-center gap-2 text-sm text-text">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span>{s.nombre}</span>
                      <span className="text-text-muted">— {s.ciudad}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opciones adicionales (coberturas/recargos) */}
          {tieneFechas && (
            <SelectorOpciones
              coberturas={coberturas}
              recargos={recargos}
              isLoading={opcionesLoading}
              coberturasSeleccionadasIds={coberturasSeleccionadasIds}
              recargosSeleccionadosIds={recargosSeleccionadosIds}
              onCoberturasChange={setCoberturasSeleccionadasIds}
              onRecargosChange={setRecargosSeleccionadosIds}
            />
          )}

          {/* Codigo promocional */}
          {tieneFechas && (
            <Card padding="none">
              <CardContent>
                <h2 className="font-semibold text-lg text-text mb-4">
                  {t('alquilerPublico.promocion.titulo')}
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codigoPromo}
                    onChange={(e) => {
                      setCodigoPromo(e.target.value);
                      setPromoValidada(null);
                      setPromoError(null);
                    }}
                    placeholder={t('alquilerPublico.promocion.placeholder')}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validarPromo}
                    disabled={!codigoPromo.trim() || promoLoading}
                  >
                    {promoLoading ? t('common.loading') : t('alquilerPublico.promocion.aplicar')}
                  </Button>
                </div>
                {/* Resultado validacion */}
                {promoValidada?.esValida && (
                  <div className="mt-3 p-3 bg-success/10 text-success rounded-lg text-sm">
                    <p className="font-medium">{t('alquilerPublico.promocion.valida')}</p>
                    <p className="text-xs mt-0.5">
                      {t('alquilerPublico.promocion.descuentoFijo', { monto: formatCurrency(promoValidada.descuentoCalculado) })}
                    </p>
                  </div>
                )}
                {promoError && (
                  <p className="mt-2 text-sm text-error">{promoError}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar — ResumenPrecio sticky */}
        <aside className="lg:sticky lg:top-6 space-y-6 self-start">
          <ResumenPrecio
            cotizacion={cotizacion}
            isLoading={cotizacionLoading}
            error={cotizacionError}
            onReservar={handleReservar}
          />
        </aside>
      </div>
    </div>
  );
}

// Componente interno para spec items
function SpecItem({ icon: IconComp, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <IconComp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-medium text-text">{value}</p>
      </div>
    </div>
  );
}
