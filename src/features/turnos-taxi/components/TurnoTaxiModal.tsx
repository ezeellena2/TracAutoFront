/**
 * Modal para crear/editar turno de taxi
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@/shared/ui';
import { DiasSelector } from './DiasSelector';
import { TimeRangePicker } from './TimePicker';
import { GeofenceSelector } from './GeofenceSelector';
import { AlertaCruceMedianoche, InfoDiasActivos } from './TurnoAlerts';
import { calculaCruzaMedianoche } from '../types';
import type { 
  TurnoTaxiDto, 
  CreateTurnoTaxiCommand, 
  UpdateTurnoTaxiCommand,
  DiaSemana,
  GeofenceVinculoDto,
} from '../types';

interface TurnoTaxiModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  turno?: TurnoTaxiDto;
  vehiculoId?: string;
  vehiculoPatente?: string;
  geofenceVinculos: GeofenceVinculoDto[];
  isLoadingGeofences: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTurnoTaxiCommand | UpdateTurnoTaxiCommand) => Promise<void>;
  onRefreshGeofences: () => void;
}

interface FormState {
  nombre: string;
  horaInicioLocal: string;
  horaFinLocal: string;
  diasActivos: DiaSemana[];
  activo: boolean;
  geofenceIds: string[];
}

const initialFormState: FormState = {
  nombre: '',
  horaInicioLocal: '08:00',
  horaFinLocal: '18:00',
  diasActivos: [1, 2, 3, 4, 5], // L-V
  activo: true,
  geofenceIds: [],
};

export function TurnoTaxiModal({
  isOpen,
  mode,
  turno,
  vehiculoId,
  vehiculoPatente,
  geofenceVinculos,
  isLoadingGeofences,
  onClose,
  onSubmit,
  onRefreshGeofences,
}: TurnoTaxiModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar form cuando se abre o cambia el turno
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && turno) {
        setForm({
          nombre: turno.nombre,
          horaInicioLocal: turno.horaInicioLocal,
          horaFinLocal: turno.horaFinLocal,
          diasActivos: turno.diasActivos,
          activo: turno.activo,
          geofenceIds: turno.geofences.map(g => g.id),
        });
      } else {
        setForm(initialFormState);
      }
      setErrors({});
    }
  }, [isOpen, mode, turno]);

  const cruzaMedianoche = calculaCruzaMedianoche(form.horaInicioLocal, form.horaFinLocal);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = t('common.required');
    }

    if (!form.horaInicioLocal) {
      newErrors.horaInicioLocal = t('common.required');
    }

    if (!form.horaFinLocal) {
      newErrors.horaFinLocal = t('common.required');
    }

    if (form.horaInicioLocal === form.horaFinLocal) {
      newErrors.horaFinLocal = t('turnosTaxi.horasIguales');
    }

    if (form.diasActivos.length === 0) {
      newErrors.diasActivos = t('turnosTaxi.minUnDia');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        const command: CreateTurnoTaxiCommand = {
          vehiculoId: vehiculoId!,
          nombre: form.nombre.trim(),
          horaInicioLocal: form.horaInicioLocal,
          horaFinLocal: form.horaFinLocal,
          diasActivos: form.diasActivos,
          geofenceIds: form.geofenceIds.length > 0 ? form.geofenceIds : undefined,
        };
        await onSubmit(command);
      } else {
        const command: UpdateTurnoTaxiCommand = {
          id: turno!.id,
          nombre: form.nombre.trim(),
          horaInicioLocal: form.horaInicioLocal,
          horaFinLocal: form.horaFinLocal,
          diasActivos: form.diasActivos,
          activo: form.activo,
          geofenceIds: form.geofenceIds.length > 0 ? form.geofenceIds : undefined,
        };
        await onSubmit(command);
      }
      onClose();
    } catch (error) {
      // El error ya se maneja en el componente padre
      console.error('Error al guardar turno:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' 
        ? t('turnosTaxi.crearTurno') 
        : t('turnosTaxi.editarTurno')
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Info del vehículo */}
        {vehiculoPatente && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('turnosTaxi.vehiculo')}:
            </span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {vehiculoPatente}
            </span>
          </div>
        )}

        {/* Nombre del turno */}
        <Input
          label={t('turnosTaxi.nombre')}
          value={form.nombre}
          onChange={(e) => updateField('nombre', e.target.value)}
          placeholder={t('turnosTaxi.nombrePlaceholder')}
          error={errors.nombre}
          disabled={isSubmitting}
        />

        {/* Horario */}
        <div>
          <TimeRangePicker
            startValue={form.horaInicioLocal}
            endValue={form.horaFinLocal}
            onStartChange={(v) => updateField('horaInicioLocal', v)}
            onEndChange={(v) => updateField('horaFinLocal', v)}
            startLabel={t('turnosTaxi.horaInicio')}
            endLabel={t('turnosTaxi.horaFin')}
            disabled={isSubmitting}
            startError={errors.horaInicioLocal}
            endError={errors.horaFinLocal}
            cruzaMedianoche={cruzaMedianoche}
          />
        </div>

        {/* Días activos */}
        <div>
          <DiasSelector
            value={form.diasActivos}
            onChange={(v) => updateField('diasActivos', v)}
            disabled={isSubmitting}
          />
          {errors.diasActivos && (
            <span className="text-xs text-red-500 mt-1">{errors.diasActivos}</span>
          )}
          <InfoDiasActivos 
            diasCount={form.diasActivos.length} 
            cruzaMedianoche={cruzaMedianoche}
            className="mt-2"
          />
        </div>
        
        {/* Alerta de cruce de medianoche */}
        {cruzaMedianoche && (
          <AlertaCruceMedianoche />
        )}

        {/* Geofences (opcional) */}
        <GeofenceSelector
          value={form.geofenceIds}
          onChange={(v) => updateField('geofenceIds', v)}
          geofenceVinculos={geofenceVinculos}
          isLoading={isLoadingGeofences}
          onRefresh={onRefreshGeofences}
          disabled={isSubmitting}
        />

        {/* Estado activo (solo en edición) */}
        {mode === 'edit' && (
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="activo"
              checked={form.activo}
              onChange={(e) => updateField('activo', e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-300">
              {t('turnosTaxi.turnoActivo')}
            </label>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {mode === 'create' 
              ? t('common.create') 
              : t('common.save')
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}
