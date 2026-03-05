import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Input, Button, Spinner, Badge } from '@/shared/ui';
import { promocionesApi } from '@/services/endpoints';
import type { RecargoAlquilerDto } from '../../types/recargo';
import type { CoberturaAlquilerDto } from '../../types/cobertura';
import type { ResultadoCotizacionDto } from '../../types/cotizacion';
import type { WizardOpcionesData } from '../../types/wizard';
import { formatPrecio } from '../../utils/formatters';

interface PasoOpcionesProps {
  data: WizardOpcionesData;
  recargos: RecargoAlquilerDto[];
  coberturas: CoberturaAlquilerDto[];
  isLoadingRecargos: boolean;
  isLoadingCoberturas: boolean;
  cotizacion: ResultadoCotizacionDto | null;
  isCotizando: boolean;
  cotizacionError: string | null;
  onChange: (partial: Partial<WizardOpcionesData>) => void;
}

export function PasoOpciones({
  data,
  recargos,
  coberturas,
  isLoadingRecargos,
  isLoadingCoberturas,
  cotizacion,
  isCotizando,
  cotizacionError,
  onChange,
}: PasoOpcionesProps) {
  const { t } = useTranslation();
  const [promoEstado, setPromoEstado] = useState<'idle' | 'validando' | 'valida' | 'invalida'>('idle');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (recargos.length > 0) {
      const obligatoriosIds = recargos.filter(r => r.obligatorio).map(r => r.id);
      const currentIds = data.recargosSeleccionadosIds;
      const faltantes = obligatoriosIds.filter(id => !currentIds.includes(id));
      if (faltantes.length > 0) {
        onChangeRef.current({ recargosSeleccionadosIds: [...new Set([...currentIds, ...faltantes])] });
      }
    }
  }, [recargos, data.recargosSeleccionadosIds]);

  useEffect(() => {
    if (coberturas.length > 0) {
      const obligatoriasIds = coberturas.filter(c => c.obligatoria).map(c => c.id);
      const currentIds = data.coberturasSeleccionadasIds;
      const faltantes = obligatoriasIds.filter(id => !currentIds.includes(id));
      if (faltantes.length > 0) {
        onChangeRef.current({ coberturasSeleccionadasIds: [...new Set([...currentIds, ...faltantes])] });
      }
    }
  }, [coberturas, data.coberturasSeleccionadasIds]);

  const toggleRecargo = (id: string, obligatorio: boolean) => {
    if (obligatorio) return;
    const current = data.recargosSeleccionadosIds;
    const updated = current.includes(id)
      ? current.filter(r => r !== id)
      : [...current, id];
    onChange({ recargosSeleccionadosIds: updated });
  };

  const toggleCobertura = (id: string, obligatoria: boolean) => {
    if (obligatoria) return;
    const current = data.coberturasSeleccionadasIds;
    const updated = current.includes(id)
      ? current.filter(c => c !== id)
      : [...current, id];
    onChange({ coberturasSeleccionadasIds: updated });
  };

  const handleValidarPromo = async () => {
    if (!data.codigoPromocion.trim()) return;
    setPromoEstado('validando');
    try {
      const resultado = await promocionesApi.validar({
        codigo: data.codigoPromocion.trim(),
        montoReserva: cotizacion?.precioTotal ?? 0,
      });
      setPromoEstado(resultado.esValida ? 'valida' : 'invalida');
    } catch {
      setPromoEstado('invalida');
    }
  };

  const moneda = cotizacion?.moneda ?? 'ARS';

  return (
    <div className="px-6 space-y-6">
      <h3 className="text-base font-semibold text-text">
        {t('alquileres.wizard.opciones.titulo')}
      </h3>

      {/* Recargos */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">
          {t('alquileres.wizard.opciones.recargos')}
        </h4>
        {isLoadingRecargos ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : recargos.length === 0 ? (
          <p className="text-sm text-text-muted">{t('alquileres.wizard.opciones.sinRecargos')}</p>
        ) : (
          <div className="space-y-2">
            {recargos.map(r => {
              const isSelected = r.obligatorio || data.recargosSeleccionadosIds.includes(r.id);
              return (
                <label
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  } ${r.obligatorio ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRecargo(r.id, r.obligatorio)}
                    disabled={r.obligatorio}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{r.nombre}</span>
                      {r.obligatorio && (
                        <Badge variant="warning" size="sm">
                          {t('alquileres.wizard.opciones.obligatorio')}
                        </Badge>
                      )}
                    </div>
                    {r.descripcion && (
                      <p className="text-xs text-text-muted mt-0.5">{r.descripcion}</p>
                    )}
                  </div>
                  <span className="text-sm text-text-muted shrink-0">
                    {r.precioFijo != null && r.precioFijo > 0 && formatPrecio(r.precioFijo, moneda)}
                    {r.precioPorDia != null && r.precioPorDia > 0 && t('alquileres.wizard.opciones.porDia', { precio: formatPrecio(r.precioPorDia, moneda) })}
                    {r.porcentajeSobreTotal != null && r.porcentajeSobreTotal > 0 && `${r.porcentajeSobreTotal}%`}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Coberturas */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">
          {t('alquileres.wizard.opciones.coberturas')}
        </h4>
        {isLoadingCoberturas ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : coberturas.length === 0 ? (
          <p className="text-sm text-text-muted">{t('alquileres.wizard.opciones.sinCoberturas')}</p>
        ) : (
          <div className="space-y-2">
            {coberturas.map(c => {
              const isSelected = c.obligatoria || data.coberturasSeleccionadasIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  } ${c.obligatoria ? 'cursor-not-allowed opacity-80' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCobertura(c.id, c.obligatoria)}
                    disabled={c.obligatoria}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text">{c.nombre}</span>
                      {c.obligatoria && (
                        <Badge variant="warning" size="sm">
                          {t('alquileres.wizard.opciones.obligatoria')}
                        </Badge>
                      )}
                    </div>
                    {c.descripcion && (
                      <p className="text-xs text-text-muted mt-0.5">{c.descripcion}</p>
                    )}
                  </div>
                  <span className="text-sm text-text-muted shrink-0">
                    {t('alquileres.wizard.opciones.porDia', { precio: formatPrecio(c.precioPorDia, moneda) })}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Codigo de promocion */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">
          {t('alquileres.wizard.opciones.codigoPromocion')}
        </h4>
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              value={data.codigoPromocion}
              onChange={(e) => {
                onChange({ codigoPromocion: e.target.value });
                setPromoEstado('idle');
              }}
              placeholder={t('alquileres.wizard.opciones.codigoPromocionPlaceholder')}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={handleValidarPromo}
            disabled={!data.codigoPromocion.trim() || promoEstado === 'validando'}
            className="mt-0.5"
          >
            {promoEstado === 'validando' ? (
              <><Loader2 size={14} className="animate-spin mr-1.5" />{t('alquileres.wizard.opciones.validando')}</>
            ) : (
              t('alquileres.wizard.opciones.validar')
            )}
          </Button>
        </div>
        {promoEstado === 'valida' && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-success">
            <CheckCircle size={14} />
            {t('alquileres.wizard.opciones.promoValida')}
          </div>
        )}
        {promoEstado === 'invalida' && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-error">
            <XCircle size={14} />
            {t('alquileres.wizard.opciones.promoInvalida')}
          </div>
        )}
      </div>

      {/* Preview de precio */}
      <div className="rounded-lg border border-border p-4 bg-surface-secondary">
        <h4 className="text-sm font-medium text-text mb-2">
          {t('alquileres.wizard.opciones.previoPrecio')}
        </h4>
        {isCotizando ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Spinner />
            {t('alquileres.wizard.opciones.calculando')}
          </div>
        ) : cotizacionError ? (
          <p className="text-sm text-error">{t('alquileres.wizard.opciones.errorCotizacion')}</p>
        ) : cotizacion ? (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">
                {t('alquileres.wizard.resumen.precioBase', { dias: cotizacion.duracionDias })}
              </span>
              <span className="text-text">{formatPrecio(cotizacion.precioBase, moneda)}</span>
            </div>
            {cotizacion.totalRecargos > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('alquileres.wizard.resumen.totalRecargos')}</span>
                <span className="text-text">{formatPrecio(cotizacion.totalRecargos, moneda)}</span>
              </div>
            )}
            {cotizacion.totalCoberturas > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">{t('alquileres.wizard.resumen.totalCoberturas')}</span>
                <span className="text-text">{formatPrecio(cotizacion.totalCoberturas, moneda)}</span>
              </div>
            )}
            {cotizacion.descuento > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>{t('alquileres.wizard.resumen.descuento', { codigo: data.codigoPromocion })}</span>
                <span>-{formatPrecio(cotizacion.descuento, moneda)}</span>
              </div>
            )}
            <div className="border-t border-border pt-1 mt-1 flex justify-between text-sm font-semibold">
              <span className="text-text">{t('alquileres.wizard.resumen.total')}</span>
              <span className="text-primary">{formatPrecio(cotizacion.precioTotal, moneda)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-muted">
            {t('alquileres.wizard.resumen.sinCotizacion')}
          </p>
        )}
      </div>
    </div>
  );
}
