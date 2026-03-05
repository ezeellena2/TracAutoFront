import { useTranslation } from 'react-i18next';
import { Shield, Package } from 'lucide-react';
import { Card, CardContent, Spinner } from '@/shared/ui';
import { formatCurrency } from '@/shared/utils/currencyFormatter';
import type { CoberturaPublicaDto, RecargoPublicoDto } from '../types/detalle';

interface SelectorOpcionesProps {
  coberturas: CoberturaPublicaDto[];
  recargos: RecargoPublicoDto[];
  isLoading: boolean;
  coberturasSeleccionadasIds: string[];
  recargosSeleccionadosIds: string[];
  onCoberturasChange: (ids: string[]) => void;
  onRecargosChange: (ids: string[]) => void;
}

export function SelectorOpciones({
  coberturas,
  recargos,
  isLoading,
  coberturasSeleccionadasIds,
  recargosSeleccionadosIds,
  onCoberturasChange,
  onRecargosChange,
}: SelectorOpcionesProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card padding="none">
        <CardContent>
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (coberturas.length === 0 && recargos.length === 0) return null;

  const toggleCobertura = (id: string, obligatoria: boolean) => {
    if (obligatoria) return;
    const next = coberturasSeleccionadasIds.includes(id)
      ? coberturasSeleccionadasIds.filter(x => x !== id)
      : [...coberturasSeleccionadasIds, id];
    onCoberturasChange(next);
  };

  const toggleRecargo = (id: string, obligatorio: boolean) => {
    if (obligatorio) return;
    const next = recargosSeleccionadosIds.includes(id)
      ? recargosSeleccionadosIds.filter(x => x !== id)
      : [...recargosSeleccionadosIds, id];
    onRecargosChange(next);
  };

  return (
    <Card padding="none">
      <CardContent>
        <h2 className="font-semibold text-lg text-text mb-4">
          {t('alquilerPublico.detalle.opcionesAdicionales')}
        </h2>

        {coberturas.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-1.5">
              <Shield size={14} />
              {t('alquilerPublico.detalle.coberturas')}
            </h3>
            <div className="space-y-2">
              {coberturas.map(c => {
                const checked = c.obligatoria || coberturasSeleccionadasIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                      ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}
                      ${c.obligatoria ? 'opacity-80 cursor-default' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={c.obligatoria}
                      onChange={() => toggleCobertura(c.id, c.obligatoria)}
                      className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text">{c.nombre}</span>
                        <span className="text-sm font-semibold text-primary whitespace-nowrap">
                          {formatCurrency(c.precioPorDia)}/{t('alquilerPublico.detalle.dia')}
                        </span>
                      </div>
                      {c.descripcion && (
                        <p className="text-xs text-text-muted mt-0.5">{c.descripcion}</p>
                      )}
                      {c.obligatoria && (
                        <span className="inline-block text-xs text-primary mt-1">
                          {t('alquilerPublico.detalle.obligatoria')}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {recargos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-muted mb-2 flex items-center gap-1.5">
              <Package size={14} />
              {t('alquilerPublico.detalle.recargos')}
            </h3>
            <div className="space-y-2">
              {recargos.map(r => {
                const checked = r.obligatorio || recargosSeleccionadosIds.includes(r.id);
                const precioDisplay = r.precioPorDia != null
                  ? `${formatCurrency(r.precioPorDia)}/${t('alquilerPublico.detalle.dia')}`
                  : r.precioFijo != null
                    ? formatCurrency(r.precioFijo)
                    : '';
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer
                      ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}
                      ${r.obligatorio ? 'opacity-80 cursor-default' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={r.obligatorio}
                      onChange={() => toggleRecargo(r.id, r.obligatorio)}
                      className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text">{r.nombre}</span>
                        {precioDisplay && (
                          <span className="text-sm font-semibold text-primary whitespace-nowrap">
                            {precioDisplay}
                          </span>
                        )}
                      </div>
                      {r.descripcion && (
                        <p className="text-xs text-text-muted mt-0.5">{r.descripcion}</p>
                      )}
                      {r.obligatorio && (
                        <span className="inline-block text-xs text-primary mt-1">
                          {t('alquilerPublico.detalle.obligatorio')}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
