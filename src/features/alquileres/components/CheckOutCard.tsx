import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Button } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import type { CheckOutAlquilerDto } from '../types/reserva';

interface CheckOutCardProps {
  checkOut: CheckOutAlquilerDto | null;
  onRealizar: () => void;
  puedeEditar: boolean;
  mostrarBoton: boolean;
}

export function CheckOutCard({ checkOut, onRealizar, puedeEditar, mostrarBoton }: CheckOutCardProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  return (
    <Card>
      <CardHeader
        title={t('alquileres.reservaDetalle.checkOut.titulo')}
        action={mostrarBoton && puedeEditar && !checkOut ? (
          <Button variant="primary" onClick={onRealizar} className="text-xs">
            {t('alquileres.reservaDetalle.checkOut.realizar')}
          </Button>
        ) : undefined}
      />

      {!checkOut ? (
        <p className="text-sm text-text-muted">{t('alquileres.reservaDetalle.checkOut.sinCheckOut')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Field label={t('alquileres.reservaDetalle.checkOut.fecha')} value={formatDateTime(checkOut.fechaHoraReal, culture, timeZoneId)} />
          <Field label={t('alquileres.reservaDetalle.checkOut.kilometraje')} value={`${checkOut.kilometrajeInicial.toLocaleString()} km`} />
          <Field label={t('alquileres.reservaDetalle.checkOut.combustible')} value={`${checkOut.nivelCombustible}%`} />
          <Field label={t('alquileres.reservaDetalle.checkOut.sucursal')} value={checkOut.sucursalNombre} />
          <Field label={t('alquileres.reservaDetalle.checkOut.exterior')} value={checkOut.estadoExterior} fullWidth />
          <Field label={t('alquileres.reservaDetalle.checkOut.interior')} value={checkOut.estadoInterior} fullWidth />
          {checkOut.observaciones && (
            <Field label={t('alquileres.reservaDetalle.checkOut.observaciones')} value={checkOut.observaciones} fullWidth />
          )}
        </div>
      )}
    </Card>
  );
}

function Field({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-text-muted text-xs">{label}</p>
      <p className="text-text">{value}</p>
    </div>
  );
}
