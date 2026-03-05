import { useTranslation } from 'react-i18next';
import { Card, CardHeader, Badge, Button } from '@/shared/ui';
import { formatPrecio } from '../utils/formatters';
import { EstadoPago } from '../types/reserva';
import type { DetallePagoReservaDto } from '../types/reserva';

interface PagosReservaCardProps {
  pagos: DetallePagoReservaDto[];
  moneda: string;
  precioTotal: number;
  onRegistrarPago: () => void;
  puedeEditar: boolean;
}

const ESTADO_PAGO_BADGE: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  [EstadoPago.Pendiente]: 'warning',
  [EstadoPago.Procesando]: 'info',
  [EstadoPago.Completado]: 'success',
  [EstadoPago.Fallido]: 'error',
  [EstadoPago.Reembolsado]: 'default',
  [EstadoPago.ReembolsoParcial]: 'default',
};

export function PagosReservaCard({ pagos, moneda, precioTotal, onRegistrarPago, puedeEditar }: PagosReservaCardProps) {
  const { t } = useTranslation();

  const totalPagado = pagos
    .filter(p => p.estadoPago === EstadoPago.Completado)
    .reduce((sum, p) => sum + p.monto, 0);

  const saldo = precioTotal - totalPagado;

  return (
    <Card>
      <CardHeader
        title={t('alquileres.reservaDetalle.pagos.titulo')}
        action={puedeEditar ? (
          <Button variant="outline" onClick={onRegistrarPago} className="text-xs">
            {t('alquileres.reservaDetalle.pagos.registrar')}
          </Button>
        ) : undefined}
      />

      {pagos.length === 0 ? (
        <p className="text-sm text-text-muted">{t('alquileres.reservaDetalle.pagos.sinPagos')}</p>
      ) : (
        <div className="space-y-3">
          {pagos.map(pago => (
            <div key={pago.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="text-text font-medium">
                  {t(`alquileres.reservaDetalle.tiposPago.${pago.tipoPago}`)}
                </p>
                <p className="text-xs text-text-muted">
                  {t(`alquileres.reservaDetalle.metodosPago.${pago.metodoPago}`)}
                  {' · '}
                  {new Date(pago.fechaPago).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-text font-medium">${pago.monto.toLocaleString()} {moneda}</p>
                <Badge variant={ESTADO_PAGO_BADGE[pago.estadoPago] ?? 'default'}>
                  {t(`alquileres.reservaDetalle.estadosPago.${pago.estadoPago}`)}
                </Badge>
              </div>
            </div>
          ))}

          <div className="border-t border-border pt-2 mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">{t('alquileres.reservaDetalle.pagos.totalPagado')}</span>
              <span className="text-text font-medium">{formatPrecio(totalPagado, moneda)}</span>
            </div>
            {saldo > 0 && (
              <div className="flex justify-between">
                <span className="text-text-muted">{t('alquileres.reservaDetalle.pagos.saldo')}</span>
                <span className="text-error font-medium">{formatPrecio(saldo, moneda)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
