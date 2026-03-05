import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Car, XCircle } from 'lucide-react';
import { Button, Badge } from '@/shared/ui';
import { formatDate } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import { SpinnerPantalla } from '@/shared/ui/Spinner';
import { EstadoReserva } from '@/features/alquileres/types/reserva';
import { TimelineReserva } from '@/features/alquileres/components/TimelineReserva';
import { ResumenReservaCard } from '@/features/alquileres/components/ResumenReservaCard';
import { PrecioDetalleCard } from '@/features/alquileres/components/PrecioDetalleCard';
import { PagosReservaCard } from '@/features/alquileres/components/PagosReservaCard';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useMiReservaDetalle } from '../hooks/useMiReservaDetalle';
import { CancelarReservaClienteModal } from '../components/CancelarReservaClienteModal';
import { ESTADO_BADGE_VARIANT, ESTADO_LABEL_KEY } from '../constants/estadoReserva';

const puedeCancelar = (estado: number) =>
  estado === EstadoReserva.Tentativa || estado === EstadoReserva.Confirmada;

export default function ReservaEstadoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { parseError } = useErrorHandler();
  const { culture, timeZoneId } = useLocalization();

  const {
    reserva,
    timeline,
    isLoading,
    error,
    refetch,
    cancelar,
    isCancelling,
    cancelError,
    isCancelOpen,
    setIsCancelOpen,
  } = useMiReservaDetalle(id ?? '');

  const cancelErrorMsg = cancelError ? parseError(cancelError).message : null;

  if (isLoading) return <SpinnerPantalla />;

  if (error || !reserva) {
    return (
      <div className="container-app py-12 text-center">
        <p className="text-error mb-4">
          {t('alquilerPublico.misReservas.error.cargarDetalle')}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          {t('alquilerPublico.misReservas.error.reintentar')}
        </Button>
      </div>
    );
  }

  return (
    <>
    <Helmet>
      <title>{t('alquilerPublico.seo.misReservas.detalleTitulo')}</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <div className="container-app py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/mis-reservas')}
          className="shrink-0"
        >
          <ArrowLeft size={16} className="mr-1" />
          {t('alquilerPublico.misReservas.detalle.volver')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {t('alquilerPublico.misReservas.detalle.titulo')} #{reserva.numeroReserva}
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('alquilerPublico.misReservas.detalle.fechaCreacion')}{' '}
            {formatDate(reserva.fechaCreacion, culture, timeZoneId)}
          </p>
        </div>
        <Badge variant={ESTADO_BADGE_VARIANT[reserva.estado] ?? 'default'}>
          {t(ESTADO_LABEL_KEY[reserva.estado] ?? '')}
        </Badge>
      </div>

      {/* Vehiculo */}
      <div className="flex items-center gap-2 mb-6 p-4 bg-surface rounded-xl border border-border">
        <Car size={20} className="text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-text">
            {reserva.vehiculoDescripcion ?? t('alquilerPublico.misReservas.detalle.informacion')}
          </p>
          <p className="text-xs text-text-muted">
            {t(`alquileres.flota.categorias.${reserva.categoriaAlquiler}`)}
          </p>
        </div>
      </div>

      {/* Info cancelacion */}
      {reserva.estado === EstadoReserva.Cancelada && reserva.fechaCancelacion && (
        <div className="p-4 rounded-xl bg-error/5 border border-error/20 mb-6">
          <div className="flex items-start gap-2">
            <XCircle size={16} className="text-error mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-text font-medium">
                {t('alquilerPublico.misReservas.detalle.canceladaEl')}{' '}
                {formatDate(reserva.fechaCancelacion, culture, timeZoneId)}
              </p>
              {reserva.motivoCancelacion && (
                <p className="text-text-muted mt-1">
                  {t('alquilerPublico.misReservas.detalle.motivoCancelacion')}: {reserva.motivoCancelacion}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Layout 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <ResumenReservaCard reserva={reserva} />
          <TimelineReserva entries={timeline} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PrecioDetalleCard reserva={reserva} />
          <PagosReservaCard
            pagos={reserva.pagos}
            moneda={reserva.moneda}
            precioTotal={reserva.precioTotal}
            onRegistrarPago={() => {}}
            puedeEditar={false}
          />

          {/* TODO E7.4: Seccion contrato B2C cuando existan endpoints */}

          {/* Boton cancelar */}
          {puedeCancelar(reserva.estado) && (
            <div>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setIsCancelOpen(true)}
              >
                {t('alquilerPublico.misReservas.cancelar.titulo')}
              </Button>
              {cancelErrorMsg && (
                <p className="text-error text-xs mt-2">{cancelErrorMsg}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal cancelacion */}
      <CancelarReservaClienteModal
        isOpen={isCancelOpen}
        numeroReserva={reserva.numeroReserva}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={cancelar}
        isLoading={isCancelling}
      />
    </div>
    </>
  );
}
