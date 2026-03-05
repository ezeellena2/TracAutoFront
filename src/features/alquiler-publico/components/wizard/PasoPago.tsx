import { useTranslation } from 'react-i18next';
import { Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, Badge } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import type { ReservaAlquilerDetalleDto } from '@/features/alquileres/types/reserva';

interface PasoPagoProps {
  reserva: ReservaAlquilerDetalleDto | null;
  isProcessing: boolean;
}

export function PasoPago({ reserva, isProcessing }: PasoPagoProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  // Mientras se crea la reserva
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-text-muted mt-4 text-sm">{t('alquilerPublico.reserva.acciones.creando')}</p>
      </div>
    );
  }

  // Reserva creada — confirmacion
  if (reserva) {
    return (
      <div className="space-y-6">
        {/* Header confirmacion */}
        <div className="text-center">
          <CheckCircle2 size={48} className="text-success mx-auto mb-3" />
          <h3 className="text-xl font-bold text-text">
            {t('alquilerPublico.reserva.confirmacion.titulo')}
          </h3>
          <p className="text-text-muted mt-1 text-sm">
            {t('alquilerPublico.reserva.confirmacion.mensaje')}
          </p>
        </div>

        {/* Datos de reserva */}
        <Card padding="none">
          <CardContent>
            <div className="space-y-4">
              {/* Numero + Estado */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted">{t('alquilerPublico.reserva.confirmacion.numero')}</p>
                  <p className="text-lg font-bold text-primary">{reserva.numeroReserva}</p>
                </div>
                <Badge variant="warning">
                  {t('alquilerPublico.reserva.confirmacion.tentativa')}
                </Badge>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-muted">{t('alquilerPublico.reserva.resumen.recogida')}</p>
                  <p className="text-text">
                    {formatDateTime(reserva.fechaHoraRecogida, culture, timeZoneId)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">{t('alquilerPublico.reserva.resumen.devolucion')}</p>
                  <p className="text-text">
                    {formatDateTime(reserva.fechaHoraDevolucion, culture, timeZoneId)}
                  </p>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-baseline pt-3 border-t border-border">
                <span className="font-semibold text-text">{t('alquilerPublico.cotizacion.total')}</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(reserva.precioTotal, reserva.moneda)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
          <Info size={20} className="text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-text">
            <p className="font-medium">{t('alquilerPublico.reserva.pago.fallback')}</p>
            <p className="text-text-muted mt-1">{t('alquilerPublico.reserva.pago.fallbackDetalle')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback — pre-confirmación (antes de crear reserva)
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
        <Info size={20} className="text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-text">
          <p className="font-medium">{t('alquilerPublico.reserva.pago.fallback')}</p>
          <p className="text-text-muted mt-1">{t('alquilerPublico.reserva.pago.fallbackDetalle')}</p>
        </div>
      </div>
    </div>
  );
}
