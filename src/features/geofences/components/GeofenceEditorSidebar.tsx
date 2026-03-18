/**
 * Sidebar del editor de geozonas.
 * Sigue el mismo patrón visual que VehiclesSidebar del mapa.
 */

import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Pencil, Info, MousePointer, Move, GripVertical } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { TipoGeofence } from '../types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface GeofenceFormState {
  nombre: string;
  descripcion: string;
  tipo: TipoGeofence;
  geometria: string;
}

interface GeofenceEditorSidebarProps {
  mode: 'create' | 'edit';
  form: GeofenceFormState;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onUpdateField: <K extends keyof GeofenceFormState>(field: K, value: GeofenceFormState[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GeofenceEditorSidebar({
  mode,
  form,
  errors,
  isSubmitting,
  onUpdateField,
  onSubmit,
  onCancel,
}: GeofenceEditorSidebarProps) {
  const { t } = useTranslation();

  const tipoOptions = [
    { value: TipoGeofence.Polygon, label: t('geofences.tipo.polygon') },
    { value: TipoGeofence.Circle, label: t('geofences.tipo.circle') },
    { value: TipoGeofence.Polyline, label: t('geofences.tipo.polyline') },
  ];

  const title =
    mode === 'create'
      ? t('geofences.crearGeozona')
      : t('geofences.editarGeozona');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="flex flex-col h-full bg-surface border-r border-border"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          {t('geofences.volverALista', 'Volver a geozonas')}
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            {mode === 'create' ? (
              <MapPin size={20} className="text-primary" />
            ) : (
              <Pencil size={20} className="text-primary" />
            )}
          </div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Nombre */}
        <Input
          label={t('geofences.nombre')}
          value={form.nombre}
          onChange={(e) => onUpdateField('nombre', e.target.value)}
          placeholder={t('geofences.nombrePlaceholder', 'Ej: Zona Centro')}
          error={errors.nombre}
          disabled={isSubmitting}
        />

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t('geofences.descripcion')}
          </label>
          <textarea
            value={form.descripcion}
            onChange={(e) => onUpdateField('descripcion', e.target.value)}
            placeholder={t(
              'geofences.descripcionPlaceholder',
              'Descripción opcional...',
            )}
            disabled={isSubmitting}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
          />
        </div>

        {/* Tipo de geometría */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            {t('geofences.tipo.label')}
          </label>
          <div className="flex gap-2">
            {tipoOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onUpdateField('tipo', opt.value);
                  // Limpiar geometría al cambiar tipo
                  onUpdateField('geometria', '');
                }}
                disabled={isSubmitting}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.tipo === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-text-muted border-border hover:border-primary/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indicador de geometría dibujada */}
        {form.geometria ? (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
            <MapPin size={14} />
            {t(
              'geofences.geometriaDibujada',
              'Geometría dibujada correctamente',
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-text-muted bg-background px-3 py-2 rounded-lg">
            <MapPin size={14} />
            {t(
              'geofences.dibujeEnMapa',
              'Dibuje la geozona haciendo clic en el mapa',
            )}
          </div>
        )}

        {errors.geometria && (
          <p className="text-xs text-red-500">{errors.geometria}</p>
        )}

        {/* Instrucciones de uso */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs font-medium text-text">
            <Info size={13} />
            {t('geofences.instrucciones', 'Instrucciones')}
          </div>

          {form.tipo === TipoGeofence.Polygon && (
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex items-start gap-2">
                <MousePointer size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.polygonClick')}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.closeShape')}</span>
              </div>
              <div className="flex items-start gap-2">
                <GripVertical size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.editVertices')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Move size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.moveShape')}</span>
              </div>
            </div>
          )}

          {form.tipo === TipoGeofence.Circle && (
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex items-start gap-2">
                <MousePointer size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.circleClickDrag')}</span>
              </div>
              <div className="flex items-start gap-2">
                <GripVertical size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.editRadius')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Move size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.moveCircle')}</span>
              </div>
            </div>
          )}

          {form.tipo === TipoGeofence.Polyline && (
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex items-start gap-2">
                <MousePointer size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.polylineClick')}</span>
              </div>
              <div className="flex items-start gap-2">
                <GripVertical size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.editPoints')}</span>
              </div>
              <div className="flex items-start gap-2">
                <Move size={12} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{t('geofences.editor.instructions.moveLine')}</span>
              </div>
            </div>
          )}

          {/* Leyenda de colores de herramientas */}
          <div className="bg-background rounded-lg p-2.5 space-y-1.5 text-xs text-text-muted">
            <div className="font-medium text-text text-[11px] uppercase tracking-wider mb-1">{t('geofences.editor.legend.title')}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{t('geofences.editor.legend.draw')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{t('geofences.editor.legend.edit')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>{t('geofences.editor.legend.move')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>{t('geofences.editor.legend.delete')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones fijas abajo */}
      <div className="flex gap-3 p-4 border-t border-border bg-surface">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="flex-1"
        >
          {mode === 'create' ? t('common.create') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
