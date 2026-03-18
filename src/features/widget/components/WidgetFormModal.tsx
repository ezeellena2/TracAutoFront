import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { TipoWidget, type CrearWidgetRequest, type ActualizarWidgetRequest, type WidgetConfiguracionConApiKeyDto } from '../types';

interface WidgetFormModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (request: CrearWidgetRequest) => void;
  onUpdate?: (id: string, request: ActualizarWidgetRequest) => void;
  editData?: WidgetConfiguracionConApiKeyDto | null;
}

const TIPO_WIDGET_LABELS: Record<TipoWidget, string> = {
  [TipoWidget.MapaFlota]: 'widget.tipos.mapaFlota',
  [TipoWidget.TrackingVehiculo]: 'widget.tipos.trackingVehiculo',
  [TipoWidget.EstadoReserva]: 'widget.tipos.estadoReserva',
  [TipoWidget.FlotaResumen]: 'widget.tipos.flotaResumen',
};

export function WidgetFormModal({ isOpen, isLoading, onClose, onSubmit, onUpdate, editData }: WidgetFormModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editData;

  const [nombre, setNombre] = useState(editData?.nombre ?? '');
  const [tipoWidget, setTipoWidget] = useState<TipoWidget>(editData?.tipoWidget ?? TipoWidget.MapaFlota);
  const [dominiosText, setDominiosText] = useState(editData?.dominiosPermitidos?.join('\n') ?? '');
  const [maxRequests, setMaxRequests] = useState(editData?.maxRequestsPorMinuto ?? 60);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dominios = dominiosText
      .split('\n')
      .map(d => d.trim())
      .filter(Boolean);

    if (isEdit && editData && onUpdate) {
      onUpdate(editData.id, {
        nombre,
        dominiosPermitidos: dominios,
        maxRequestsPorMinuto: maxRequests,
      });
    } else {
      onSubmit({
        nombre,
        tipoWidget,
        dominiosPermitidos: dominios,
        maxRequestsPorMinuto: maxRequests,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface rounded-xl border border-border w-full max-w-lg mx-4 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">
            {isEdit ? t('widget.editar') : t('widget.crear')}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('widget.form.nombre')}
            </label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-secondary text-text focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              placeholder={t('widget.form.nombrePlaceholder')}
            />
          </div>

          {/* Tipo Widget (solo en creación) */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {t('widget.form.tipo')}
              </label>
              <select
                value={tipoWidget}
                onChange={e => setTipoWidget(Number(e.target.value) as TipoWidget)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-secondary text-text focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              >
                {Object.entries(TIPO_WIDGET_LABELS).map(([value, labelKey]) => (
                  <option key={value} value={value}>
                    {t(labelKey)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dominios Permitidos */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('widget.form.dominios')}
            </label>
            <textarea
              value={dominiosText}
              onChange={e => setDominiosText(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-secondary text-text focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none font-mono text-sm"
              placeholder={t('widget.form.dominiosPlaceholder')}
            />
            <p className="text-xs text-text-muted mt-1">
              {t('widget.form.dominiosHelp')}
            </p>
          </div>

          {/* Rate Limit */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t('widget.form.maxRequests')}
            </label>
            <input
              type="number"
              value={maxRequests}
              onChange={e => setMaxRequests(Number(e.target.value))}
              min={1}
              max={1000}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background-secondary text-text focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-text hover:bg-surface-hover transition-colors"
            >
              {t('common.cancelar')}
            </button>
            <button
              type="submit"
              disabled={isLoading || !nombre.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? t('common.guardando') : isEdit ? t('common.guardar') : t('widget.crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
