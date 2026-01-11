/**
 * Componente de formulario para datos de extensión Alquiler
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui';
import type { VehiculoAlquilerCreateData } from '../types';

interface AlquilerExtensionFormProps {
  value: VehiculoAlquilerCreateData;
  onChange: (data: VehiculoAlquilerCreateData) => void;
  errors?: Partial<Record<keyof VehiculoAlquilerCreateData, string>>;
}

export function AlquilerExtensionForm({
  value,
  onChange,
  errors,
}: AlquilerExtensionFormProps) {
  const { t } = useTranslation();

  const updateField = <K extends keyof VehiculoAlquilerCreateData>(
    field: K,
    fieldValue: VehiculoAlquilerCreateData[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-lg font-semibold text-text">
        {t('vehicles.extensions.rental.title')}
      </h3>
      <p className="text-sm text-text-muted">
        {t('vehicles.extensions.rental.description')}
      </p>

      <Input
        label={t('vehicles.extensions.rental.categoryId')}
        value={value.categoriaId || ''}
        onChange={(e) => updateField('categoriaId', e.target.value)}
        placeholder={t('vehicles.extensions.rental.categoryIdPlaceholder')}
        error={errors?.categoriaId}
        required
      />

      <Input
        label={t('vehicles.extensions.rental.baseBranchId')}
        value={value.sucursalBaseId || ''}
        onChange={(e) => updateField('sucursalBaseId', e.target.value || undefined)}
        placeholder={t('vehicles.extensions.rental.baseBranchIdPlaceholder')}
        error={errors?.sucursalBaseId}
      />

      <Input
        label={t('vehicles.extensions.rental.maxKmPerDay')}
        type="number"
        value={value.kilometrosMaxDia?.toString() || ''}
        onChange={(e) =>
          updateField('kilometrosMaxDia', e.target.value ? Number(e.target.value) : undefined)
        }
        placeholder={t('vehicles.extensions.rental.maxKmPerDayPlaceholder')}
        error={errors?.kilometrosMaxDia}
      />

      <Input
        label={t('vehicles.extensions.rental.availableFrom')}
        type="datetime-local"
        value={
          value.disponibleDesdeUtc
            ? new Date(value.disponibleDesdeUtc).toISOString().slice(0, 16)
            : ''
        }
        onChange={(e) =>
          updateField(
            'disponibleDesdeUtc',
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        error={errors?.disponibleDesdeUtc}
      />

      <Input
        label={t('vehicles.extensions.rental.availableUntil')}
        type="datetime-local"
        value={
          value.disponibleHastaUtc
            ? new Date(value.disponibleHastaUtc).toISOString().slice(0, 16)
            : ''
        }
        onChange={(e) =>
          updateField(
            'disponibleHastaUtc',
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        error={errors?.disponibleHastaUtc}
      />

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {t('vehicles.extensions.rental.notes')}
        </label>
        <textarea
          value={value.notas || ''}
          onChange={(e) => updateField('notas', e.target.value || undefined)}
          placeholder={t('vehicles.extensions.rental.notesPlaceholder')}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />
        {errors?.notas && (
          <p className="text-sm text-error mt-1">{errors.notas}</p>
        )}
      </div>
    </div>
  );
}
