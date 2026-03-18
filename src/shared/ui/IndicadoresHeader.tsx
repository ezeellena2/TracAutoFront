import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useIndicesHeader } from '@/hooks/useIndicesHeader';

/**
 * Muestra dólar blue y riesgo país como chips compactos.
 * Se usa dentro del dropdown del header.
 * Degrada sin romper: muestra "—" si no hay datos o hay error.
 */
export function IndicadoresHeader() {
  const { t } = useTranslation();
  const { data, isLoading } = useIndicesHeader();

  const dolar = data.dolar;
  const riesgoPais = data.riesgoPais;

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-1.5" aria-hidden="true">
        <div className="h-6 w-28 rounded-md bg-text-muted/10 animate-pulse" />
        <div className="h-6 w-24 rounded-md bg-text-muted/10 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="region" aria-label={t('header.dolarBlue')}>
      {/* Dollar Blue chip */}
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-text-muted/[0.06] text-xs whitespace-nowrap cursor-default"
        title={dolar ? `${t('header.actualizado')}: ${dolar.fechaActualizacion}` : undefined}
      >
        <DollarSign size={12} className="text-emerald-500 flex-shrink-0" />
        <span className="font-medium text-text">{t('header.dolarBlue')}:</span>
        <span className="text-text-muted">
          {dolar
            ? `$${dolar.venta.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : '—'}
        </span>
      </span>

      {/* Risk chip */}
      <span
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-text-muted/[0.06] text-xs whitespace-nowrap cursor-default"
        title={riesgoPais ? `${t('header.actualizado')}: ${riesgoPais.fecha ?? riesgoPais.timestamp ?? ''}` : undefined}
      >
        <TrendingUp size={12} className="text-blue-400 flex-shrink-0" />
        <span className="font-medium text-text">{t('header.riesgoPais')}:</span>
        <span className="text-text-muted">
          {riesgoPais
            ? `${riesgoPais.valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
            : '—'}
        </span>
      </span>
    </div>
  );
}
