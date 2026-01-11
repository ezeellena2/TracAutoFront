/**
 * Componente de formulario para datos de extensión Aseguradora
 */

import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui';
import { useTenantStore } from '@/store';
import { TipoOrganizacion } from '@/shared/types/api';
import type { VehiculoAseguradoraCreateData } from '../types';

interface AseguradoraExtensionFormProps {
  value: VehiculoAseguradoraCreateData;
  onChange: (data: VehiculoAseguradoraCreateData) => void;
  errors?: Partial<Record<keyof VehiculoAseguradoraCreateData, string>>;
}

export function AseguradoraExtensionForm({
  value,
  onChange,
  errors,
}: AseguradoraExtensionFormProps) {
  const { t } = useTranslation();
  const { currentOrganization } = useTenantStore();
  const isAseguradora = currentOrganization?.tipoOrganizacion === TipoOrganizacion.Aseguradora;

  const updateField = <K extends keyof VehiculoAseguradoraCreateData>(
    field: K,
    fieldValue: VehiculoAseguradoraCreateData[K]
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <h3 className="text-lg font-semibold text-text">
        {t('vehicles.extensions.insurance.title')}
      </h3>
      <p className="text-sm text-text-muted">
        {t('vehicles.extensions.insurance.description')}
      </p>

      <Input
        label={t('vehicles.extensions.insurance.policyNumber')}
        value={value.numeroPoliza || ''}
        onChange={(e) => updateField('numeroPoliza', e.target.value || undefined)}
        placeholder={t('vehicles.extensions.insurance.policyNumberPlaceholder')}
        error={errors?.numeroPoliza}
      />

      {!isAseguradora && (
        <Input
          label={t('vehicles.extensions.insurance.insuranceCompany')}
          value={value.companiaAseguradora || ''}
          onChange={(e) => updateField('companiaAseguradora', e.target.value || undefined)}
          placeholder={t('vehicles.extensions.insurance.insuranceCompanyPlaceholder')}
          error={errors?.companiaAseguradora}
        />
      )}

      <Input
        label={t('vehicles.extensions.insurance.coverageType')}
        value={value.tipoCobertura || ''}
        onChange={(e) => updateField('tipoCobertura', e.target.value || undefined)}
        placeholder={t('vehicles.extensions.insurance.coverageTypePlaceholder')}
        error={errors?.tipoCobertura}
      />

      <Input
        label={t('vehicles.extensions.insurance.insuredValue')}
        type="number"
        value={value.valorAsegurado?.toString() || ''}
        onChange={(e) =>
          updateField('valorAsegurado', e.target.value ? Number(e.target.value) : undefined)
        }
        placeholder={t('vehicles.extensions.insurance.insuredValuePlaceholder')}
        error={errors?.valorAsegurado}
      />

      <Input
        label={t('vehicles.extensions.insurance.coverageStartDate')}
        type="date"
        value={
          value.fechaInicioCobertura
            ? new Date(value.fechaInicioCobertura).toISOString().split('T')[0]
            : ''
        }
        onChange={(e) =>
          updateField(
            'fechaInicioCobertura',
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        error={errors?.fechaInicioCobertura}
      />

      <Input
        label={t('vehicles.extensions.insurance.policyExpiryDate')}
        type="date"
        value={
          value.fechaVencimientoPoliza
            ? new Date(value.fechaVencimientoPoliza).toISOString().split('T')[0]
            : ''
        }
        onChange={(e) =>
          updateField(
            'fechaVencimientoPoliza',
            e.target.value ? new Date(e.target.value).toISOString() : undefined
          )
        }
        error={errors?.fechaVencimientoPoliza}
      />
    </div>
  );
}
