import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import { Card, CardHeader, Badge, Button } from '@/shared/ui';
import { formatPrecio } from '../utils/formatters';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import type { CheckInAlquilerDto } from '../types/reserva';

interface CheckInCardProps {
  checkIn: CheckInAlquilerDto | null;
  moneda: string;
  onRealizar: () => void;
  onDescargarPdf: () => void;
  puedeEditar: boolean;
  mostrarBoton: boolean;
}

export const CheckInCard = memo(function CheckInCard({ checkIn, moneda, onRealizar, onDescargarPdf, puedeEditar, mostrarBoton }: CheckInCardProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();

  const fmt = (n: number) => formatPrecio(n, moneda);

  return (
    <Card>
      <CardHeader
        title={t('alquileres.reservaDetalle.checkIn.titulo')}
        action={
          checkIn ? (
            <Button variant="ghost" onClick={onDescargarPdf} className="text-xs">
              <Download size={14} className="mr-1" />
              {t('alquileres.reservaDetalle.contrato.descargarPdf')}
            </Button>
          ) : mostrarBoton && puedeEditar ? (
            <Button variant="primary" onClick={onRealizar} className="text-xs">
              {t('alquileres.reservaDetalle.checkIn.realizar')}
            </Button>
          ) : undefined
        }
      />

      {!checkIn ? (
        <p className="text-sm text-text-muted">{t('alquileres.reservaDetalle.checkIn.sinCheckIn')}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <Field label={t('alquileres.reservaDetalle.checkIn.fecha')} value={formatDateTime(checkIn.fechaHoraReal, culture, timeZoneId)} />
            <Field label={t('alquileres.reservaDetalle.checkIn.kilometraje')} value={`${checkIn.kilometrajeFinal.toLocaleString()} km`} />
            <Field label={t('alquileres.reservaDetalle.checkIn.combustible')} value={`${checkIn.nivelCombustible}%`} />
            <Field label={t('alquileres.reservaDetalle.checkIn.sucursal')} value={checkIn.sucursalNombre} />
            <Field label={t('alquileres.reservaDetalle.checkIn.exterior')} value={checkIn.estadoExterior} fullWidth />
            <Field label={t('alquileres.reservaDetalle.checkIn.interior')} value={checkIn.estadoInterior} fullWidth />
            <div className="sm:col-span-2">
              <p className="text-text-muted text-xs">{t('alquileres.reservaDetalle.checkIn.danos')}</p>
              <Badge variant={checkIn.danosDetectados ? 'error' : 'success'}>
                {checkIn.danosDetectados
                  ? t('alquileres.reservaDetalle.checkIn.si')
                  : t('alquileres.reservaDetalle.checkIn.no')}
              </Badge>
            </div>
            {checkIn.descripcionDanos && (
              <Field label={t('alquileres.reservaDetalle.checkIn.descripcionDanos')} value={checkIn.descripcionDanos} fullWidth />
            )}
            {checkIn.observaciones && (
              <Field label={t('alquileres.reservaDetalle.checkIn.observaciones')} value={checkIn.observaciones} fullWidth />
            )}
          </div>

          {checkIn.totalRecargosCheckIn > 0 && (
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              {checkIn.recargoCombustible > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoCombustible')}</span>
                  <span className="text-text">{fmt(checkIn.recargoCombustible)}</span>
                </div>
              )}
              {checkIn.recargoKmExcedente > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoKm')}</span>
                  <span className="text-text">{fmt(checkIn.recargoKmExcedente)}</span>
                </div>
              )}
              {checkIn.recargoTardanza > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoTardanza')}</span>
                  <span className="text-text">{fmt(checkIn.recargoTardanza)}</span>
                </div>
              )}
              {checkIn.recargoDanos != null && checkIn.recargoDanos > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{t('alquileres.reservaDetalle.checkIn.recargoDanos')}</span>
                  <span className="text-text">{fmt(checkIn.recargoDanos)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-1 border-t border-border">
                <span className="text-text">{t('alquileres.reservaDetalle.checkIn.totalRecargos')}</span>
                <span className="text-text">{fmt(checkIn.totalRecargosCheckIn)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

function Field({ label, value, fullWidth }: { label: string; value: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <p className="text-text-muted text-xs">{label}</p>
      <p className="text-text text-sm">{value}</p>
    </div>
  );
}
