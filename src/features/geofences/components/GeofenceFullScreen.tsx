/**
 * Pantalla completa inmersiva para crear/editar una geofence.
 * Reemplaza al antiguo GeofenceFormModal con un overlay full-screen:
 *   - Mapa ocupa el 100 % del fondo
 *   - Panel lateral flotante a la izquierda con el formulario
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MapPin, Pencil } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { GeofenceDrawMap } from './GeofenceDrawMap';
import { TipoGeofence } from '../types';
import type {
  GeofenceDto,
  CreateGeofenceCommand,
  UpdateGeofenceCommand,
} from '../types';

/* ------------------------------------------------------------------ */
/*  Props – se mantiene el mismo contrato que el modal anterior        */
/* ------------------------------------------------------------------ */

interface GeofenceFullScreenProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  geofence?: GeofenceDto;
  onClose: () => void;
  onSubmit: (data: CreateGeofenceCommand | UpdateGeofenceCommand) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Form state                                                         */
/* ------------------------------------------------------------------ */

interface FormState {
  nombre: string;
  descripcion: string;
  tipo: TipoGeofence;
  geometria: string;
}

const initialFormState: FormState = {
  nombre: '',
  descripcion: '',
  tipo: TipoGeofence.Polygon,
  geometria: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GeofenceFullScreen({
  isOpen,
  mode,
  geofence,
  onClose,
  onSubmit,
}: GeofenceFullScreenProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ---- Inicializar formulario cuando se abre ---- */
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && geofence) {
        setForm({
          nombre: geofence.nombre,
          descripcion: geofence.descripcion ?? '',
          tipo: geofence.tipo,
          geometria: geofence.geometria,
        });
      } else {
        setForm(initialFormState);
      }
      setErrors({});
    }
  }, [isOpen, mode, geofence]);

  /* ---- Cerrar con Escape ---- */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'visible';
    };
  }, [isOpen, onClose]);

  /* ---- Validación ---- */
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = t('common.required');
    }

    if (!form.geometria) {
      newErrors.geometria = t(
        'geofences.geometriaRequerida',
        'Dibuje la geozona en el mapa',
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  /* ---- Submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const command: CreateGeofenceCommand = {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          geometria: form.geometria,
          tipo: form.tipo,
        };
        await onSubmit(command);
      } else {
        const command: UpdateGeofenceCommand = {
          id: geofence!.id,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          geometria: form.geometria,
          tipo: form.tipo,
        };
        await onSubmit(command);
      }
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error al guardar geofence:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- Helpers ---- */
  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const tipoOptions = [
    { value: TipoGeofence.Polygon, label: t('geofences.tipo.polygon') },
    { value: TipoGeofence.Circle, label: t('geofences.tipo.circle') },
    { value: TipoGeofence.Polyline, label: t('geofences.tipo.polyline') },
  ];

  const title =
    mode === 'create'
      ? t('geofences.crearGeozona')
      : t('geofences.editarGeozona');

  /* ---- Render ---- */
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] bg-background animate-in fade-in duration-200">
      {/* ====== Top toolbar ====== */}
      <div className="absolute top-0 left-0 right-0 h-14 z-[1001] bg-surface/90 backdrop-blur-sm border-b border-border flex items-center px-4 gap-3">
        <div className="flex items-center gap-2 text-primary">
          {mode === 'create' ? <MapPin size={20} /> : <Pencil size={20} />}
        </div>
        <h2 className="text-base font-semibold text-text truncate">{title}</h2>

        <div className="ml-auto">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-background transition-colors"
            title={t('common.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ====== Mapa full-screen (fondo) ====== */}
      <div className="absolute inset-0 pt-14">
        <GeofenceDrawMap
          tipo={form.tipo}
          geometria={mode === 'edit' ? geofence?.geometria : undefined}
          onGeometriaChange={(wkt) => updateField('geometria', wkt)}
          height="100%"
          autoStartDraw={mode === 'create'}
        />
      </div>

      {/* ====== Panel lateral flotante (formulario) ====== */}
      <form
        onSubmit={handleSubmit}
        className="absolute left-4 top-[72px] bottom-4 w-80 z-[1000] bg-surface rounded-xl border border-border shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-300"
      >
        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nombre */}
          <Input
            label={t('geofences.nombre')}
            value={form.nombre}
            onChange={(e) => updateField('nombre', e.target.value)}
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
              onChange={(e) => updateField('descripcion', e.target.value)}
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
                    updateField('tipo', opt.value);
                    // Limpiar geometría al cambiar tipo
                    updateField('geometria', '');
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
              {t('geofences.geometriaDibujada', 'Geometría dibujada correctamente')}
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
        </div>

        {/* Acciones fijas en la parte inferior */}
        <div className="flex gap-3 p-4 border-t border-border bg-surface">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
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
    </div>
  );
}
