import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import type { ResultadoCotizacionDto } from '@/features/alquileres/types/cotizacion';

interface CotizacionDesgloseProps {
  cotizacion: ResultadoCotizacionDto;
}

export function CotizacionDesglose({ cotizacion }: CotizacionDesgloseProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {/* Tarifa */}
      <div>
        <p className="text-sm font-medium text-text">
          {t('alquilerPublico.cotizacion.tarifa')}
        </p>
        <p className="text-xs text-text-muted">{cotizacion.detalleTarifa.nombreTarifa}</p>
        <div className="text-xs text-text-muted mt-1 space-y-0.5">
          {cotizacion.detalleTarifa.meses > 0 && cotizacion.detalleTarifa.precioMes != null && (
            <p>
              {t('alquilerPublico.cotizacion.meses', { count: cotizacion.detalleTarifa.meses })}
              {' × '}
              {formatCurrency(cotizacion.detalleTarifa.precioMes, cotizacion.moneda)}
            </p>
          )}
          {cotizacion.detalleTarifa.semanas > 0 && cotizacion.detalleTarifa.precioSemana != null && (
            <p>
              {t('alquilerPublico.cotizacion.semanas', { count: cotizacion.detalleTarifa.semanas })}
              {' × '}
              {formatCurrency(cotizacion.detalleTarifa.precioSemana, cotizacion.moneda)}
            </p>
          )}
          {cotizacion.detalleTarifa.dias > 0 && cotizacion.detalleTarifa.precioDia != null && (
            <p>
              {t('alquilerPublico.cotizacion.dias', { count: cotizacion.detalleTarifa.dias })}
              {' × '}
              {formatCurrency(cotizacion.detalleTarifa.precioDia, cotizacion.moneda)}
            </p>
          )}
        </div>
        <p className="text-sm text-text text-right">
          {formatCurrency(cotizacion.precioBase, cotizacion.moneda)}
        </p>
      </div>

      {/* Recargos */}
      {cotizacion.recargos.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text">
            {t('alquilerPublico.cotizacion.recargos')}
          </p>
          {cotizacion.recargos.map(r => (
            <div key={r.recargoId} className="flex items-center justify-between text-xs text-text-muted mt-1">
              <span className="flex items-center gap-1.5">
                {r.nombre}
                {r.obligatorio && (
                  <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded-full">
                    {t('alquilerPublico.cotizacion.obligatorio')}
                  </span>
                )}
              </span>
              <span>{formatCurrency(r.monto, cotizacion.moneda)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coberturas */}
      {cotizacion.coberturas.length > 0 && (
        <div>
          <p className="text-sm font-medium text-text">
            {t('alquilerPublico.cotizacion.coberturas')}
          </p>
          {cotizacion.coberturas.map(c => (
            <div key={c.coberturaId} className="flex items-center justify-between text-xs text-text-muted mt-1">
              <span className="flex items-center gap-1.5">
                {c.nombre}
                {c.obligatoria && (
                  <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded-full">
                    {t('alquilerPublico.cotizacion.obligatorio')}
                  </span>
                )}
              </span>
              <span>{formatCurrency(c.monto, cotizacion.moneda)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Subtotal + Descuento + Total + Deposito */}
      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex justify-between text-sm text-text">
          <span>{t('alquilerPublico.cotizacion.subtotal')}</span>
          <span>{formatCurrency(cotizacion.subtotal, cotizacion.moneda)}</span>
        </div>

        {cotizacion.promocion && cotizacion.descuento > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>
              {t('alquilerPublico.cotizacion.descuento')}
              <span className="text-xs ml-1">({cotizacion.promocion.codigo})</span>
            </span>
            <span>-{formatCurrency(cotizacion.descuento, cotizacion.moneda)}</span>
          </div>
        )}

        <div className="flex justify-between items-baseline pt-2 border-t border-border">
          <span className="font-semibold text-text">
            {t('alquilerPublico.cotizacion.total')}
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatCurrency(cotizacion.precioTotal, cotizacion.moneda)}
          </span>
        </div>

        {cotizacion.depositoMinimo > 0 && (
          <p className="text-xs text-text-muted text-right">
            {t('alquilerPublico.cotizacion.deposito')}: {formatCurrency(cotizacion.depositoMinimo, cotizacion.moneda)}
          </p>
        )}
      </div>
    </div>
  );
}
