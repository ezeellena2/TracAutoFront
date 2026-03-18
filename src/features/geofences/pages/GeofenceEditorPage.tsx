/**
 * Página de creación/edición de geozonas.
 * Usa el mismo layout MapShell que TraccarMapPage (sidebar + mapa).
 *
 *  - Sidebar: formulario con nombre, descripción, tipo y estado de geometría
 *  - Mapa:    herramientas de dibujo + geozonas existentes como referencia
 *
 * Rutas:
 *   /geozonas/crear         → modo crear
 *   /geozonas/:id/editar    → modo editar
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useErrorHandler } from '@/hooks';
import { Loader2, MapPin } from 'lucide-react';

import { MapShell } from '@/features/traccar-map/components/MapShell';
import { GeofenceEditorSidebar } from '../components/GeofenceEditorSidebar';
import { GeofenceEditorMap } from '../components/GeofenceEditorMap';
import { geofencesApi } from '../api';
import { toast } from '@/store/toast.store';
import { TipoGeofence, GEOFENCES_PAGE_SIZE } from '../types';
import type { GeofenceDto } from '../types';
import type { GeofenceFormState } from '../components/GeofenceEditorSidebar';

/* ------------------------------------------------------------------ */
/*  Constantes                                                         */
/* ------------------------------------------------------------------ */

const initialFormState: GeofenceFormState = {
  nombre: '',
  descripcion: '',
  tipo: TipoGeofence.Polygon,
  geometria: '',
};

/* ------------------------------------------------------------------ */
/*  Componente                                                         */
/* ------------------------------------------------------------------ */

export function GeofenceEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();

  const isEditMode = !!id;

  /* ---- State ---- */
  const [form, setForm] = useState<GeofenceFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Inicializar en true si hay id, así el mapa NO se monta hasta que la geozona esté cargada.
  // Esto evita un mount/unmount/remount que causaba que la geometría no se mostrara.
  const [isLoadingGeofence, setIsLoadingGeofence] = useState(!!id);
  const [existingGeofences, setExistingGeofences] = useState<GeofenceDto[]>([]);
  const [geofence, setGeofence] = useState<GeofenceDto | null>(null);

  /* ---- Cargar geozonas existentes de la organización ---- */
  useEffect(() => {
    geofencesApi
      .listar({ soloActivas: true, tamanoPagina: GEOFENCES_PAGE_SIZE })
      .then((result) => setExistingGeofences(result.items))
      .catch((err) => { if (import.meta.env.DEV) console.error('Error loading existing geofences:', err); });
  }, []);

  /* ---- Cargar geozona para edición ---- */
  useEffect(() => {
    if (!id) return;

    setIsLoadingGeofence(true);
    geofencesApi
      .obtenerPorId(id)
      .then((g) => {
        setGeofence(g);
        setForm({
          nombre: g.nombre,
          descripcion: g.descripcion ?? '',
          tipo: g.tipo,
          geometria: g.geometria,
        });
      })
      .catch((err) => {
        handleApiError(err, { showToast: false });
        toast.error(t('geofences.errorCargar', 'Error al cargar la geozona'));
        navigate('/geozonas');
      })
      .finally(() => setIsLoadingGeofence(false));
  }, [id, navigate, t, handleApiError]);

  /* ---- Helpers ---- */
  const updateField = useCallback(
    <K extends keyof GeofenceFormState>(field: K, value: GeofenceFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

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
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        geometria: form.geometria,
        tipo: form.tipo,
      };

      if (isEditMode) {
        await geofencesApi.actualizar(id!, payload);
        toast.success(
          t('geofences.actualizadaExito', 'Geozona actualizada exitosamente'),
        );
      } else {
        await geofencesApi.crear(payload);
        toast.success(
          t('geofences.creadaExito', 'Geozona creada exitosamente'),
        );
      }

      navigate('/geozonas');
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/geozonas');

  /* ---- Geozonas existentes sin la que se está editando ---- */
  const otherGeofences = isEditMode
    ? existingGeofences.filter((g) => g.id !== id)
    : existingGeofences;

  /* ---- Loading mientras carga la geozona a editar ---- */
  if (isLoadingGeofence) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-88px)] -m-6 bg-background">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Loader2 size={48} className="animate-spin text-primary" />
          <p className="text-sm">
            {t('geofences.cargando', 'Cargando geozona...')}
          </p>
        </div>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <MapShell
      sidebar={
        <GeofenceEditorSidebar
          mode={isEditMode ? 'edit' : 'create'}
          form={form}
          errors={errors}
          isSubmitting={isSubmitting}
          onUpdateField={updateField}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      }
      map={
        <GeofenceEditorMap
          tipo={form.tipo}
          geometria={isEditMode ? geofence?.geometria : undefined}
          onGeometriaChange={(wkt) => updateField('geometria', wkt)}
          autoStartDraw={!isEditMode}
          existingGeofences={otherGeofences}
        />
      }
      itemCount={otherGeofences.length}
      CollapsedIcon={MapPin}
    />
  );
}
