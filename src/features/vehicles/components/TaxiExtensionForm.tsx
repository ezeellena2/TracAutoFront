/**
 * Componente de formulario para datos de extensión Taxi
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui';
import type { VehiculoTaxiCreateData } from '../types';

interface TaxiExtensionFormProps {
  value: VehiculoTaxiCreateData;
  onChange: (data: VehiculoTaxiCreateData) => void;
  errors?: Partial<Record<keyof VehiculoTaxiCreateData, string>>;
}

export function TaxiExtensionForm({
  value,
  onChange,
  errors,
}: TaxiExtensionFormProps) {
  const { t } = useTranslation();

  const updateField = <K extends keyof VehiculoTaxiCreateData>(
    field: K,
    fieldValue: VehiculoTaxiCreateData[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-lg font-semibold text-text">
        {t('vehicles.extensions.taxi.title')}
      </h3>
      <p className="text-sm text-text-muted">
        {t('vehicles.extensions.taxi.description')}
      </p>

      <Input
        label={t('vehicles.extensions.taxi.licenseNumber')}
        value={value.numeroLicencia || ''}
        onChange={(e) => updateField('numeroLicencia', e.target.value || undefined)}
        placeholder={t('vehicles.extensions.taxi.licenseNumberPlaceholder')}
        error={errors?.numeroLicencia}
      />

      <Input
        label={t('vehicles.extensions.taxi.internalNumber')}
        value={value.numeroInterno || ''}
        onChange={(e) => updateField('numeroInterno', e.target.value || undefined)}
        placeholder={t('vehicles.extensions.taxi.internalNumberPlaceholder')}
        error={errors?.numeroInterno}
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="habilitadoParaServicio"
          checked={value.habilitadoParaServicio ?? true}
          onChange={(e) => updateField('habilitadoParaServicio', e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="habilitadoParaServicio" className="text-sm font-medium text-text">
          {t('vehicles.extensions.taxi.enabledForService')}
        </label>
      </div>

      <Input
        label={t('vehicles.extensions.taxi.vtvExpiry')}
        type="date"
        value={
          value.vencimientoVTV
            ? new Date(value.vencimientoVTV).toISOString().split('T')[0]
            : ''
        }
        onChange={(e) =>
          updateField(
            'vencimientoVTV',
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        error={errors?.vencimientoVTV}
      />

      <Input
        label={t('vehicles.extensions.taxi.insuranceExpiry')}
        type="date"
        value={
          value.vencimientoSeguro
            ? new Date(value.vencimientoSeguro).toISOString().split('T')[0]
            : ''
        }
        onChange={(e) =>
          updateField(
            'vencimientoSeguro',
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        error={errors?.vencimientoSeguro}
      />
    </div>
  );
}
