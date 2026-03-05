import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { SpinnerPantalla, EstadoError, Button } from '@/shared/ui';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useVehiculoPublico } from '../hooks/useVehiculoPublico';
import { useSucursalesPublicas } from '../hooks/useSucursalesPublicas';
import { alquilerPublicoApi } from '@/services/endpoints/alquiler-publico.api';
import { useAuthClienteStore, selectIsAuthenticated } from '@/store/authCliente.store';
import { StepIndicatorPublico } from '../components/wizard/StepIndicatorPublico';
import { PasoDatosPersonales } from '../components/wizard/PasoDatosPersonales';
import { PasoResumenReserva } from '../components/wizard/PasoResumenReserva';
import { PasoPago } from '../components/wizard/PasoPago';
import { DATOS_PERSONALES_INITIAL } from '../types/reserva-publica';
import type { DatosPersonalesForm, CreateReservaPublicaRequest } from '../types/reserva-publica';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';
import type { ValidacionPromocionDto } from '@/features/alquileres/types/promocion';
import type { ReservaAlquilerDetalleDto } from '@/features/alquileres/types/reserva';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReservaFlowPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleApiError, parseError } = useErrorHandler();

  // URL params
  const sucursalRecogidaId = searchParams.get('sucursalRecogidaId') ?? '';
  const sucursalDevolucionId = searchParams.get('sucursalDevolucionId') ?? sucursalRecogidaId;
  const fechaHoraRecogida = searchParams.get('fechaHoraRecogida') ?? '';
  const fechaHoraDevolucion = searchParams.get('fechaHoraDevolucion') ?? '';
  const codigoPromocionUrl = searchParams.get('codigoPromocion') ?? '';

  // Data hooks
  const { vehiculo, isLoading, isError, error, refetch } = useVehiculoPublico(id);
  const { sucursales } = useSucursalesPublicas();

  // Auth B2C — pre-fill email si autenticado
  const isClienteAuth = useAuthClienteStore(selectIsAuthenticated);
  const clienteEmail = useAuthClienteStore(s => s.email);

  // Wizard state
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [datosPersonales, setDatosPersonales] = useState<DatosPersonalesForm>(DATOS_PERSONALES_INITIAL);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Promo state
  const [codigoPromo, setCodigoPromo] = useState(codigoPromocionUrl);
  const [promoValidada, setPromoValidada] = useState<ValidacionPromocionDto | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Cotizacion state
  const [cotizacion, setCotizacion] = useState<ResultadoCotizacionDto | null>(null);
  const [cotizacionLoading, setCotizacionLoading] = useState(false);
  const [cotizacionError, setCotizacionError] = useState<string | null>(null);

  // Reserva state
  const [reservaCreada, setReservaCreada] = useState<ReservaAlquilerDetalleDto | null>(null);
  const [creando, setCreando] = useState(false);

  // Idempotencia — generada una sola vez al montar
  const claveIdempotencia = useRef(crypto.randomUUID());

  // Pre-fill email del cliente autenticado
  useEffect(() => {
    if (isClienteAuth && clienteEmail) {
      setDatosPersonales(prev => ({ ...prev, email: clienteEmail }));
    }
  }, [isClienteAuth, clienteEmail]);

  // Cotizar
  const cotizar = useCallback(async (codigoPromocion?: string) => {
    if (!id || !sucursalRecogidaId || !fechaHoraRecogida || !fechaHoraDevolucion) return;

    setCotizacionLoading(true);
    setCotizacionError(null);
    try {
      const resultado = await alquilerPublicoApi.cotizar({
        vehiculoAlquilerId: id,
        sucursalRecogidaId,
        sucursalDevolucionId: sucursalDevolucionId || sucursalRecogidaId,
        fechaHoraRecogida,
        fechaHoraDevolucion,
        recargosSeleccionadosIds: [],
        coberturasSeleccionadasIds: [],
        codigoPromocion,
      });
      setCotizacion(resultado);
    } catch (err) {
      const parsed = parseError(err);
      setCotizacionError(parsed.message);
    } finally {
      setCotizacionLoading(false);
    }
  }, [id, sucursalRecogidaId, sucursalDevolucionId, fechaHoraRecogida, fechaHoraDevolucion, parseError]);

  // Ref estable para cotizar
  const cotizarRef = useRef(cotizar);
  cotizarRef.current = cotizar;

  // Cotizar automaticamente al entrar al paso 2
  const prevPaso = useRef(paso);
  useEffect(() => {
    if (paso === 2 && prevPaso.current !== 2) {
      cotizarRef.current(codigoPromo.trim() || undefined);
    }
    prevPaso.current = paso;
  }, [paso, codigoPromo]);

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

  // Cambiar promo
  const handleCambiarPromo = useCallback((codigo: string) => {
    setCodigoPromo(codigo);
    setPromoValidada(null);
    setPromoError(null);
  }, []);

  // Validar paso 1
  const validarDatosPersonales = useCallback((): boolean => {
    const e: Record<string, string> = {};

    if (!datosPersonales.nombre.trim()) {
      e.nombre = t('alquilerPublico.reserva.errores.nombreRequerido');
    }
    if (!datosPersonales.apellido.trim()) {
      e.apellido = t('alquilerPublico.reserva.errores.apellidoRequerido');
    }
    if (!datosPersonales.email.trim()) {
      e.email = t('alquilerPublico.reserva.errores.emailRequerido');
    } else if (!EMAIL_REGEX.test(datosPersonales.email.trim())) {
      e.email = t('alquilerPublico.reserva.errores.emailInvalido');
    }
    if (!datosPersonales.tipoDocumento) {
      e.tipoDocumento = t('alquilerPublico.reserva.errores.tipoDocRequerido');
    }
    if (!datosPersonales.numeroDocumento.trim()) {
      e.numeroDocumento = t('alquilerPublico.reserva.errores.numDocRequerido');
    }

    setErrores(e);
    return Object.keys(e).length === 0;
  }, [datosPersonales, t]);

  // Cambiar datos personales (limpia errores del campo modificado)
  const handleDatosChange = useCallback((partial: Partial<DatosPersonalesForm>) => {
    setDatosPersonales(prev => ({ ...prev, ...partial }));
    const keys = Object.keys(partial);
    setErrores(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });
  }, []);

  // Avanzar paso
  const avanzar = useCallback(() => {
    if (paso === 1) {
      if (validarDatosPersonales()) {
        setPaso(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [paso, validarDatosPersonales]);

  // Retroceder paso
  const retroceder = useCallback(() => {
    if (paso === 2) {
      setPaso(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [paso]);

  // Crear reserva
  const crearReserva = useCallback(async () => {
    if (!id || creando) return;

    setCreando(true);
    try {
      const body: CreateReservaPublicaRequest = {
        nombre: datosPersonales.nombre.trim(),
        apellido: datosPersonales.apellido.trim(),
        email: datosPersonales.email.trim(),
        telefono: datosPersonales.telefono.trim() || undefined,
        tipoDocumento: datosPersonales.tipoDocumento as number,
        numeroDocumento: datosPersonales.numeroDocumento.trim(),
        fechaNacimiento: datosPersonales.fechaNacimiento || undefined,
        numeroLicenciaConducir: datosPersonales.numeroLicenciaConducir.trim() || undefined,
        vencimientoLicencia: datosPersonales.vencimientoLicencia || undefined,
        vehiculoAlquilerId: id,
        sucursalRecogidaId,
        sucursalDevolucionId: sucursalDevolucionId || sucursalRecogidaId,
        fechaHoraRecogida,
        fechaHoraDevolucion,
        recargosSeleccionadosIds: [],
        coberturasSeleccionadasIds: [],
        codigoPromocion: promoValidada?.esValida ? codigoPromo.trim() : undefined,
        claveIdempotencia: claveIdempotencia.current,
      };

      const reserva = await alquilerPublicoApi.crearReserva(body);
      setReservaCreada(reserva);
      setPaso(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      handleApiError(err);
    } finally {
      setCreando(false);
    }
  }, [
    id, creando, datosPersonales, sucursalRecogidaId, sucursalDevolucionId,
    fechaHoraRecogida, fechaHoraDevolucion, promoValidada, codigoPromo,
    handleApiError,
  ]);

  // URL de retorno al detalle
  const urlDetalle = useMemo(() => {
    if (!id) return '/';
    return `/vehiculo/${id}?${searchParams.toString()}`;
  }, [id, searchParams]);

  // Loading
  if (isLoading) return <SpinnerPantalla />;

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

  return (
    <>
    <Helmet>
      <title>{t('alquilerPublico.seo.reserva.titulo')}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="container-app py-6 sm:py-8 max-w-3xl mx-auto">
      {/* Volver */}
      {paso < 3 && (
        <button
          onClick={() => navigate(urlDetalle)}
          className="flex items-center gap-2 text-text-muted hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('alquilerPublico.detalle.volver')}
        </button>
      )}

      {/* Step indicator */}
      <StepIndicatorPublico pasoActual={paso} />

      {/* Contenido del paso */}
      <div className="mt-6">
        {paso === 1 && (
          <PasoDatosPersonales
            data={datosPersonales}
            errors={errores}
            onChange={handleDatosChange}
          />
        )}

        {paso === 2 && (
          <PasoResumenReserva
            vehiculo={vehiculo}
            sucursales={sucursales}
            sucursalRecogidaId={sucursalRecogidaId}
            sucursalDevolucionId={sucursalDevolucionId}
            fechaHoraRecogida={fechaHoraRecogida}
            fechaHoraDevolucion={fechaHoraDevolucion}
            cotizacion={cotizacion}
            cotizacionLoading={cotizacionLoading}
            cotizacionError={cotizacionError}
            codigoPromo={codigoPromo}
            promoValidada={promoValidada}
            promoError={promoError}
            promoLoading={promoLoading}
            onCambiarPromo={handleCambiarPromo}
            onValidarPromo={validarPromo}
          />
        )}

        {paso === 3 && (
          <PasoPago
            reserva={reservaCreada}
            isProcessing={creando}
          />
        )}
      </div>

      {/* Footer con botones */}
      <div className="mt-8 flex items-center justify-between gap-4">
        {/* Anterior */}
        {paso === 2 && (
          <Button variant="ghost" onClick={retroceder}>
            {t('alquilerPublico.reserva.acciones.anterior')}
          </Button>
        )}

        {/* Spacer */}
        {paso !== 2 && <div />}

        {/* Siguiente / Confirmar */}
        {paso === 1 && (
          <Button variant="primary" onClick={avanzar}>
            {t('alquilerPublico.reserva.acciones.siguiente')}
          </Button>
        )}

        {paso === 2 && (
          <Button
            variant="primary"
            onClick={crearReserva}
            disabled={creando || cotizacionLoading}
          >
            {creando
              ? t('alquilerPublico.reserva.acciones.creando')
              : t('alquilerPublico.reserva.acciones.confirmar')}
          </Button>
        )}

        {paso === 3 && (
          <div className="flex gap-3 ml-auto">
            <Button variant="ghost" onClick={() => navigate('/')}>
              {t('alquilerPublico.reserva.confirmacion.volverInicio')}
            </Button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
