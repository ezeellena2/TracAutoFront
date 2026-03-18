import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calendar, MapPin } from 'lucide-react';
import { Card, Badge } from '@/shared/ui';
import { formatPrecio } from '@/features/alquileres/utils/formatters';
import { formatDate, formatTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import type { ReservaAlquilerResumenDto } from '@/features/alquileres/types/reserva';
import { ESTADO_BADGE_VARIANT, ESTADO_LABEL_KEY } from '../constants/estadoReserva';

interface TarjetaReservaClienteProps {
  reserva: ReservaAlquilerResumenDto;
  onClick: () => void;
}

export const TarjetaReservaCliente = memo(function TarjetaReservaCliente({ reserva, onClick }: TarjetaReservaClienteProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  return (
    <Card hover onClick={onClick} className="cursor-pointer">
      {/* Header: numero + estado */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-text">
          {t('alquilerPublico.misReservas.tarjeta.reserva', { numero: reserva.numeroReserva })}
        </p>
        <Badge variant={ESTADO_BADGE_VARIANT[reserva.estado] ?? 'default'} size="sm">
          {t(ESTADO_LABEL_KEY[reserva.estado] ?? '')}
        </Badge>
      </div>

      {/* Vehiculo */}
      <div className="flex items-center gap-2 mb-3">
        <Car size={16} className="text-text-muted shrink-0" />
        <p className="text-sm text-text truncate">
          {reserva.vehiculoDescripcion ?? t('alquilerPublico.misReservas.tarjeta.sinVehiculo')}
        </p>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-text-muted">
        <div className="flex items-start gap-1.5">
          <Calendar size={12} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-text-muted">{t('alquilerPublico.misReservas.tarjeta.recogida')}</p>
            <p className="text-text">{formatDate(reserva.fechaHoraRecogida, culture, timeZoneId)}</p>
            <p>{formatTime(reserva.fechaHoraRecogida, culture, timeZoneId)}</p>
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <Calendar size={12} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-text-muted">{t('alquilerPublico.misReservas.tarjeta.devolucion')}</p>
            <p className="text-text">{formatDate(reserva.fechaHoraDevolucion, culture, timeZoneId)}</p>
            <p>{formatTime(reserva.fechaHoraDevolucion, culture, timeZoneId)}</p>
          </div>
        </div>
      </div>

      {/* Sucursal + precio */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <MapPin size={12} />
          <span className="truncate max-w-[150px]">{reserva.sucursalRecogida}</span>
        </div>
        <p className="text-sm font-bold text-primary">
          {formatPrecio(reserva.precioTotal, reserva.moneda)}
        </p>
      </div>
    </Card>
  );
});
