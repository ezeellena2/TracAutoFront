import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Badge, Button, Card, CardHeader, SpinnerPantalla, EstadoError, ConfirmationModal } from '@/shared/ui';
import { usePermissions } from '@/hooks';
import { useReservaDetalle } from '../hooks/useReservaDetalle';
import { EstadoReserva, OrigenReserva } from '../types/reserva';
import { ResumenReservaCard } from '../components/ResumenReservaCard';
import { TimelineReserva } from '../components/TimelineReserva';
import { ClienteReservaCard } from '../components/ClienteReservaCard';
import { VehiculoReservaCard } from '../components/VehiculoReservaCard';
import { CheckOutCard } from '../components/CheckOutCard';
import { CheckInCard } from '../components/CheckInCard';
import { GaleriaFotosReserva } from '../components/GaleriaFotosReserva';
import { EstadoAccionesCard } from '../components/EstadoAccionesCard';
import { PrecioDetalleCard } from '../components/PrecioDetalleCard';
import { PagosReservaCard } from '../components/PagosReservaCard';
import { ContratoReservaCard } from '../components/ContratoReservaCard';
import { PreviewContratoModal } from '../components/PreviewContratoModal';
import { CancelarReservaModal } from '../components/CancelarReservaModal';
import { CheckOutModal } from '../components/CheckOutModal';
import { CheckInModal } from '../components/CheckInModal';
import { RegistrarPagoModal } from '../components/RegistrarPagoModal';

const ESTADO_BADGE_VARIANT: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [EstadoReserva.Tentativa]: 'warning',
  [EstadoReserva.Confirmada]: 'info',
  [EstadoReserva.EnCurso]: 'success',
  [EstadoReserva.Completada]: 'default',
  [EstadoReserva.Cancelada]: 'error',
  [EstadoReserva.NoShow]: 'error',
};

const ORIGEN_BADGE_VARIANT: Record<number, 'default' | 'info'> = {
  [OrigenReserva.Web]: 'info',
  [OrigenReserva.Telefono]: 'default',
  [OrigenReserva.Presencial]: 'default',
  [OrigenReserva.App]: 'info',
};

export function ReservaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();

  const puedeEditar = can('alquileres:editar');
  const puedeConfigurar = can('alquileres:configurar');

  const {
    reserva,
    checkOut,
    checkIn,
    fotos,
    contrato,
    timeline,
    sucursalOptions,
    isLoading,
    isFotosLoading,
    isContratoLoading,
    error,
    refetch,
    // Modales
    isConfirmOpen,
    setIsConfirmOpen,
    isNoShowOpen,
    setIsNoShowOpen,
    isCancelOpen,
    setIsCancelOpen,
    isCheckOutOpen,
    setIsCheckOutOpen,
    isCheckInOpen,
    setIsCheckInOpen,
    isPagoOpen,
    setIsPagoOpen,
    // Acciones
    confirmar,
    cancelar,
    marcarNoShow,
    registrarPago,
    descargarPdf,
    // Mutation states
    isConfirming,
    isCancelling,
    isMarkingNoShow,
    isGenerandoContrato,
  } = useReservaDetalle(id ?? '');

  if (!id) {
    navigate('/alquileres/reservas', { replace: true });
    return null;
  }

  const [isPreviewContratoOpen, setIsPreviewContratoOpen] = useState(false);

  if (isLoading) return <SpinnerPantalla />;
  if (error || !reserva) {
    return <EstadoError mensaje={error ?? undefined} onReintentar={() => refetch()} />;
  }

  const mostrarCheckOut = reserva.estado >= EstadoReserva.EnCurso;
  const mostrarCheckIn = reserva.estado >= EstadoReserva.Completada ||
    (reserva.estado === EstadoReserva.EnCurso && checkIn != null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/alquileres/reservas')} className="p-2">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-text">
              {t('alquileres.reservaDetalle.titulo')} #{reserva.numeroReserva}
            </h1>
            <Badge variant={ESTADO_BADGE_VARIANT[reserva.estado] ?? 'default'}>
              {t(`alquileres.reservas.estados.${reserva.estado}`)}
            </Badge>
            <Badge variant={ORIGEN_BADGE_VARIANT[reserva.origenReserva] ?? 'default'}>
              {t(`alquileres.reservaDetalle.resumen.origenes.${reserva.origenReserva}`)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <ResumenReservaCard reserva={reserva} />
          <TimelineReserva entries={timeline} />
          <ClienteReservaCard
            nombreCompleto={reserva.clienteNombreCompleto}
            clienteId={reserva.clienteAlquilerId}
          />
          <VehiculoReservaCard
            vehiculoDescripcion={reserva.vehiculoDescripcion}
            categoriaAlquiler={reserva.categoriaAlquiler}
          />

          {mostrarCheckOut && (
            <CheckOutCard
              checkOut={checkOut}
              onRealizar={() => setIsCheckOutOpen(true)}
              puedeEditar={puedeEditar}
              mostrarBoton={reserva.estado === EstadoReserva.Confirmada}
            />
          )}

          {mostrarCheckIn && (
            <CheckInCard
              checkIn={checkIn}
              moneda={reserva.moneda}
              onRealizar={() => setIsCheckInOpen(true)}
              puedeEditar={puedeEditar}
              mostrarBoton={reserva.estado === EstadoReserva.EnCurso}
            />
          )}

          {fotos.length > 0 && (
            <GaleriaFotosReserva fotos={fotos} isLoading={isFotosLoading} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EstadoAccionesCard
            estado={reserva.estado}
            onConfirmar={() => setIsConfirmOpen(true)}
            onCancelar={() => setIsCancelOpen(true)}
            onNoShow={() => setIsNoShowOpen(true)}
            onCheckOut={() => setIsCheckOutOpen(true)}
            onCheckIn={() => setIsCheckInOpen(true)}
            isConfirming={isConfirming}
            isCancelling={isCancelling}
            isMarkingNoShow={isMarkingNoShow}
            puedeEditar={puedeEditar}
          />

          <PrecioDetalleCard reserva={reserva} />

          <PagosReservaCard
            pagos={reserva.pagos}
            moneda={reserva.moneda}
            precioTotal={reserva.precioTotal}
            onRegistrarPago={() => setIsPagoOpen(true)}
            puedeEditar={puedeEditar}
          />

          <ContratoReservaCard
            contrato={contrato}
            isLoading={isContratoLoading}
            onPreviewGenerar={() => setIsPreviewContratoOpen(true)}
            onDescargarPdf={descargarPdf}
            isGenerando={isGenerandoContrato}
            puedeConfigurar={puedeConfigurar}
          />

          {/* Notas internas */}
          <Card>
            <CardHeader title={t('alquileres.reservaDetalle.notas.titulo')} />
            {reserva.notas ? (
              <p className="text-sm text-text whitespace-pre-wrap">{reserva.notas}</p>
            ) : (
              <p className="text-sm text-text-muted">{t('alquileres.reservaDetalle.notas.sinNotas')}</p>
            )}
          </Card>
        </div>
      </div>

      {/* ──── Modales ──── */}

      {/* Confirmar reserva */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmar}
        title={t('alquileres.reservaDetalle.confirmarModal.titulo')}
        description={t('alquileres.reservaDetalle.confirmarModal.mensaje', { numero: reserva.numeroReserva })}
        variant="info"
        isLoading={isConfirming}
      />

      {/* No Show */}
      <ConfirmationModal
        isOpen={isNoShowOpen}
        onClose={() => setIsNoShowOpen(false)}
        onConfirm={marcarNoShow}
        title={t('alquileres.reservaDetalle.noShowModal.titulo')}
        description={t('alquileres.reservaDetalle.noShowModal.mensaje', { numero: reserva.numeroReserva })}
        variant="danger"
        isLoading={isMarkingNoShow}
      />

      {/* Cancelar reserva */}
      <CancelarReservaModal
        isOpen={isCancelOpen}
        reserva={reserva}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={cancelar}
        isLoading={isCancelling}
      />

      {/* Check-Out */}
      <CheckOutModal
        isOpen={isCheckOutOpen}
        reservaId={reserva.id}
        sucursalIdPorDefecto={reserva.sucursalRecogidaId}
        sucursales={sucursalOptions}
        onClose={() => setIsCheckOutOpen(false)}
      />

      {/* Check-In */}
      <CheckInModal
        isOpen={isCheckInOpen}
        reservaId={reserva.id}
        sucursalIdPorDefecto={reserva.sucursalDevolucionId}
        sucursales={sucursalOptions}
        checkOutData={checkOut}
        checkInData={checkIn}
        onClose={() => setIsCheckInOpen(false)}
      />

      {/* Registrar pago */}
      <RegistrarPagoModal
        isOpen={isPagoOpen}
        reservaId={reserva.id}
        moneda={reserva.moneda}
        onClose={() => setIsPagoOpen(false)}
        onSubmit={registrarPago}
      />

      {/* Preview contrato antes de generar */}
      <PreviewContratoModal
        isOpen={isPreviewContratoOpen}
        reservaId={reserva.id}
        reserva={reserva}
        onClose={() => setIsPreviewContratoOpen(false)}
      />
    </div>
  );
}
