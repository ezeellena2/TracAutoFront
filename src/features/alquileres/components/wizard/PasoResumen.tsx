import { useTranslation } from 'react-i18next';
import { Select, Spinner } from '@/shared/ui';
import { formatDateTime } from '@/shared/utils/dateFormatter';
import { useLocalization } from '@/hooks/useLocalization';
import type { WizardFormData } from '../../types/wizard';
import type { ResultadoCotizacionDto } from '../../types/cotizacion';
import { formatPrecio } from '../../utils/formatters';

interface PasoResumenProps {
  formData: WizardFormData;
  cotizacion: ResultadoCotizacionDto | null;
  isCotizando: boolean;
  origenOptions: { value: number; label: string }[];
  onNotasChange: (notas: string) => void;
  onOrigenChange: (origen: number) => void;
}

export function PasoResumen({
  formData,
  cotizacion,
  isCotizando,
  origenOptions,
  onNotasChange,
  onOrigenChange,
}: PasoResumenProps) {
  const { t } = useTranslation();
  const { culture, timeZoneId } = useLocalization();
  const { cliente, vehiculo, opciones } = formData;

  const moneda = cotizacion?.moneda ?? 'ARS';

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    return formatDateTime(iso, culture, timeZoneId);
  };

  const clienteNombre = cliente.creandoNuevo
    ? `${cliente.nombre} ${cliente.apellido}`
    : cliente.clienteExistente
      ? `${cliente.clienteExistente.nombre} ${cliente.clienteExistente.apellido}`
      : '—';

  const clienteEmail = cliente.creandoNuevo
    ? cliente.email
    : cliente.clienteExistente?.email ?? '—';

  const clienteDoc = cliente.creandoNuevo
    ? cliente.numeroDocumento
    : cliente.clienteExistente?.numeroDocumento ?? '—';

  return (
    <div className="px-6 space-y-5">
      <h3 className="text-base font-semibold text-text">
        {t('alquileres.wizard.resumen.titulo')}
      </h3>

      {/* Secciones de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cliente */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {t('alquileres.wizard.resumen.seccionCliente')}
          </h4>
          <p className="text-sm font-medium text-text">{clienteNombre}</p>
          <p className="text-xs text-text-muted">{clienteEmail}</p>
          <p className="text-xs text-text-muted">{clienteDoc}</p>
          <p className="text-xs text-text-muted mt-1">
            {cliente.creandoNuevo
              ? t('alquileres.wizard.resumen.clienteNuevo')
              : t('alquileres.wizard.resumen.clienteExistente')}
          </p>
        </div>

        {/* Vehiculo */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {t('alquileres.wizard.resumen.seccionVehiculo')}
          </h4>
          {vehiculo.vehiculoSeleccionado ? (
            <>
              <p className="text-sm font-medium text-text">
                {vehiculo.vehiculoSeleccionado.patente} — {vehiculo.vehiculoSeleccionado.marca} {vehiculo.vehiculoSeleccionado.modelo}
              </p>
              <p className="text-xs text-text-muted">
                {t('alquileres.wizard.resumen.vehiculoAsignado')}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-text">
                {vehiculo.categoriaAlquiler !== ''
                  ? t(`alquileres.flota.categorias.${vehiculo.categoriaAlquiler}`)
                  : '—'}
              </p>
              <p className="text-xs text-text-muted">
                {t('alquileres.wizard.resumen.soloCategoria')}
              </p>
            </>
          )}
        </div>

        {/* Fechas */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {t('alquileres.wizard.resumen.seccionFechas')}
          </h4>
          <div className="space-y-1">
            <p className="text-xs text-text-muted">{t('alquileres.wizard.vehiculo.fechaHoraRecogida')}</p>
            <p className="text-sm text-text">{fmtDate(vehiculo.fechaHoraRecogida)}</p>
            <p className="text-xs text-text-muted mt-2">{t('alquileres.wizard.vehiculo.fechaHoraDevolucion')}</p>
            <p className="text-sm text-text">{fmtDate(vehiculo.fechaHoraDevolucion)}</p>
            {cotizacion && (
              <p className="text-xs text-primary mt-1 font-medium">
                {t('alquileres.wizard.resumen.duracion', { dias: cotizacion.duracionDias })}
              </p>
            )}
          </div>
        </div>

        {/* Opciones */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {t('alquileres.wizard.resumen.seccionOpciones')}
          </h4>
          <div className="space-y-1 text-sm">
            {cotizacion && cotizacion.recargos.length > 0 ? (
              cotizacion.recargos.map(r => (
                <p key={r.recargoId} className="text-text-muted">{r.nombre}</p>
              ))
            ) : (
              <p className="text-text-muted">{t('alquileres.wizard.resumen.sinRecargos')}</p>
            )}
            {cotizacion && cotizacion.coberturas.length > 0 ? (
              cotizacion.coberturas.map(c => (
                <p key={c.coberturaId} className="text-text-muted">{c.nombre}</p>
              ))
            ) : (
              <p className="text-text-muted">{t('alquileres.wizard.resumen.sinCoberturas')}</p>
            )}
            <p className="text-text-muted">
              {opciones.codigoPromocion.trim()
                ? t('alquileres.wizard.resumen.promoAplicada', { codigo: opciones.codigoPromocion })
                : t('alquileres.wizard.resumen.sinPromocion')}
            </p>
          </div>
        </div>
      </div>

      {/* Desglose de precio */}
      <div className="rounded-lg border border-border p-4 bg-surface-secondary">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          {t('alquileres.wizard.resumen.seccionPrecio')}
        </h4>
        {isCotizando ? (
          <div className="flex items-center gap-2 text-sm text-text-muted py-2">
            <Spinner />
            {t('alquileres.wizard.opciones.calculando')}
          </div>
        ) : cotizacion ? (
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">
                {t('alquileres.wizard.resumen.precioBase', { dias: cotizacion.duracionDias })}
              </span>
              <span className="text-text">{formatPrecio(cotizacion.precioBase, moneda)}</span>
            </div>

            {cotizacion.recargos.map(r => (
              <div key={r.recargoId} className="flex justify-between text-sm">
                <span className="text-text-muted">
                  {t('alquileres.wizard.resumen.recargo', { nombre: r.nombre })}
                </span>
                <span className="text-text">{formatPrecio(r.monto, moneda)}</span>
              </div>
            ))}

            {cotizacion.coberturas.map(c => (
              <div key={c.coberturaId} className="flex justify-between text-sm">
                <span className="text-text-muted">
                  {t('alquileres.wizard.resumen.cobertura', { nombre: c.nombre })}
                </span>
                <span className="text-text">{formatPrecio(c.monto, moneda)}</span>
              </div>
            ))}

            <div className="flex justify-between text-sm border-t border-border pt-1.5">
              <span className="text-text-muted">{t('alquileres.wizard.resumen.subtotal')}</span>
              <span className="text-text">{formatPrecio(cotizacion.subtotal, moneda)}</span>
            </div>

            {cotizacion.descuento > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>
                  {t('alquileres.wizard.resumen.descuento', {
                    codigo: cotizacion.promocion?.codigo ?? opciones.codigoPromocion,
                  })}
                </span>
                <span>-{formatPrecio(cotizacion.descuento, moneda)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold border-t border-border pt-1.5 mt-1.5">
              <span className="text-text">{t('alquileres.wizard.resumen.total')}</span>
              <span className="text-primary text-base">{formatPrecio(cotizacion.precioTotal, moneda)}</span>
            </div>

            <div className="flex justify-between text-xs text-text-muted pt-1">
              <span>{t('alquileres.wizard.resumen.deposito')}</span>
              <span>{formatPrecio(cotizacion.depositoMinimo, moneda)}</span>
            </div>

            {cotizacion.usaFallbackVehiculo && (
              <p className="text-sm text-amber-600 mt-2">
                {t('alquileres.wizard.resumen.precioFallback')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            {t('alquileres.wizard.resumen.sinCotizacion')}
          </p>
        )}
      </div>

      {/* Notas + Origen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            {t('alquileres.wizard.resumen.notas')}
          </label>
          <textarea
            value={formData.notas}
            onChange={(e) => onNotasChange(e.target.value)}
            placeholder={t('alquileres.wizard.resumen.notasPlaceholder')}
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          />
        </div>
        <Select
          label={t('alquileres.wizard.resumen.origenReserva')}
          value={formData.origenReserva}
          onChange={(v) => onOrigenChange(Number(v))}
          options={origenOptions}
          placeholder={t('alquileres.wizard.resumen.origenPlaceholder')}
          required
        />
      </div>
    </div>
  );
}
