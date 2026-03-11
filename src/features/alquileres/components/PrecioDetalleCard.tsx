import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '@/shared/ui';
import { formatPrecio } from '../utils/formatters';
import type { ReservaAlquilerDetalleDto } from '../types/reserva';

interface PrecioDetalleCardProps {
  reserva: ReservaAlquilerDetalleDto;
}

export function PrecioDetalleCard({ reserva }: PrecioDetalleCardProps) {
  const { t } = useTranslation();
  const { moneda } = reserva;

  const fmt = (n: number) => formatPrecio(n, moneda);

  return (
    <Card>
      <CardHeader title={t('alquileres.reservaDetalle.precio.titulo')} />
      <div className="space-y-2 text-sm">
        {/* Precio base */}
        <div className="flex justify-between">
          <span className="text-text-muted">{t('alquileres.reservaDetalle.precio.precioBase')}</span>
          <span className="text-text">{fmt(reserva.precioBase)}</span>
        </div>

        {/* Recargos */}
        {reserva.recargos.length > 0 && (
          <>
            {reserva.recargos.map((r) => (
              <div key={r.recargoAlquilerId} className="flex justify-between">
                <span className="text-text-muted">
                  {t('alquileres.reservaDetalle.precio.recargo')} ×{r.cantidad}
                </span>
                <span className="text-text">{fmt(r.precioAplicado)}</span>
              </div>
            ))}
          </>
        )}

        {/* Coberturas */}
        {reserva.coberturas.length > 0 && (
          <>
            {reserva.coberturas.map((c) => (
              <div key={c.coberturaAlquilerId} className="flex justify-between">
                <span className="text-text-muted">{t('alquileres.reservaDetalle.precio.cobertura')}</span>
                <span className="text-text">{fmt(c.precioAplicado)}</span>
              </div>
            ))}
          </>
        )}

        {/* Descuento */}
        {reserva.descuento > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>
              {t('alquileres.reservaDetalle.precio.descuento')}
              {reserva.promocionCodigo && (
                <span className="text-xs ml-1">({reserva.promocionCodigo})</span>
              )}
            </span>
            <span>-{fmt(reserva.descuento)}</span>
          </div>
        )}

        {/* Depósito */}
        {reserva.montoDeposito > 0 && (
          <div className="flex justify-between">
            <span className="text-text-muted">{t('alquileres.reservaDetalle.precio.deposito')}</span>
            <span className="text-text">{fmt(reserva.montoDeposito)}</span>
          </div>
        )}

        {/* Separador + Total */}
        <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
          <span className="text-text">{t('alquileres.reservaDetalle.precio.total')}</span>
          <span className="text-text">{fmt(reserva.precioTotal)}</span>
        </div>
      </div>
    </Card>
  );
}
