/**
 * Componente de formulario para datos de extensión Otros
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui';
import type { VehiculoOtrosCreateData } from '../types';

interface OtrosExtensionFormProps {
  value: VehiculoOtrosCreateData;
  onChange: (data: VehiculoOtrosCreateData) => void;
  errors?: Partial<Record<keyof VehiculoOtrosCreateData, string>>;
}

export function OtrosExtensionForm({
  value,
  onChange,
  errors,
}: OtrosExtensionFormProps) {
  const { t } = useTranslation();

  const updateField = <K extends keyof VehiculoOtrosCreateData>(
    field: K,
    fieldValue: VehiculoOtrosCreateData[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-lg font-semibold text-text">
        {t('vehicles.extensions.others.title')}
      </h3>
      <p className="text-sm text-text-muted">
        {t('vehicles.extensions.others.description')}
      </p>

      <Input
        label={t('vehicles.extensions.others.contextType')}
        value={value.tipoContexto || ''}
        onChange={(e) => updateField('tipoContexto', e.target.value)}
        placeholder={t('vehicles.extensions.others.contextTypePlaceholder')}
        error={errors?.tipoContexto}
        required
      />

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {t('vehicles.extensions.others.descriptionLabel')}
        </label>
        <textarea
          value={value.descripcion || ''}
          onChange={(e) => updateField('descripcion', e.target.value || undefined)}
          placeholder={t('vehicles.extensions.others.descriptionPlaceholder')}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          rows={3}
        />
        {errors?.descripcion && (
          <p className="text-sm text-error mt-1">{errors.descripcion}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          {t('vehicles.extensions.others.metadataJson')}
        </label>
        <textarea
          value={value.metadatosJson || ''}
          onChange={(e) => updateField('metadatosJson', e.target.value || undefined)}
          placeholder={t('vehicles.extensions.others.metadataJsonPlaceholder')}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
          rows={4}
        />
        {errors?.metadatosJson && (
          <p className="text-sm text-error mt-1">{errors.metadatosJson}</p>
        )}
        <p className="text-xs text-text-muted mt-1">
          {t('vehicles.extensions.others.metadataJsonHint')}
        </p>
      </div>
    </div>
  );
}
