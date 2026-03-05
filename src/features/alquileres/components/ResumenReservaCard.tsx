import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { Card, CardHeader, Badge } from '@/shared/ui';
import type { ReservaAlquilerDetalleDto } from '../types/reserva';

interface ResumenReservaCardProps {
  reserva: ReservaAlquilerDetalleDto;
}

export function ResumenReservaCard({ reserva }: ResumenReservaCardProps) {
  const { t } = useTranslation();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Card>
      <CardHeader title={t('alquileres.reservaDetalle.resumen.titulo')} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.resumen.sucursalRecogida')}</p>
            <p className="text-sm text-text font-medium">{reserva.sucursalRecogida}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.resumen.sucursalDevolucion')}</p>
            <p className="text-sm text-text font-medium">{reserva.sucursalDevolucion}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.resumen.fechaRecogida')}</p>
            <p className="text-sm text-text font-medium">{formatDate(reserva.fechaHoraRecogida)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.resumen.fechaDevolucion')}</p>
            <p className="text-sm text-text font-medium">{formatDate(reserva.fechaHoraDevolucion)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Tag size={16} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.resumen.categoria')}</p>
            <p className="text-sm text-text font-medium">{t(`alquileres.flota.categorias.${reserva.categoriaAlquiler}`)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Tag size={16} className="text-text-muted mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-text-muted">{t('alquileres.reservaDetalle.resumen.origen')}</p>
            <Badge variant="default">{t(`alquileres.reservas.origenes.${reserva.origenReserva}`)}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
