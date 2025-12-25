import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { organizacionesApi } from '@/services/endpoints';
import { useAuthStore } from '@/store';

interface OrganizacionOption {
  id: string;
  nombre: string;
}

interface OrganizacionAsociadaSelectorProps {
  value?: string | null;
  onChange: (orgId: string | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector de organización asociada que muestra solo organizaciones relacionadas con la actual
 * Usa directamente los datos de listarRelacionesOrganizacion que ya incluye los nombres
 */
export function OrganizacionAsociadaSelector({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  className = '',
}: OrganizacionAsociadaSelectorProps) {
  const { t } = useTranslation();
  const organizacionActualId = useAuthStore((state) => state.organizationId);
  const [organizacionesRelacionadas, setOrganizacionesRelacionadas] = useState<OrganizacionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (organizacionActualId) {
      loadOrganizacionesRelacionadas();
    }
  }, [organizacionActualId]);

  const loadOrganizacionesRelacionadas = async () => {
    try {
      setIsLoading(true);
      // Obtener relaciones activas (el DTO ya incluye organizacionANombre y organizacionBNombre)
      const relacionesResult = await organizacionesApi.listarRelacionesOrganizacion({
        numeroPagina: 1,
        tamanoPagina: 100,
        soloActivas: true,
      });

      // Extraer organizaciones relacionadas usando directamente los datos del DTO
      const organizaciones: OrganizacionOption[] = relacionesResult.items.map((rel) => {
        // Determinar cuál es la organización relacionada (no la actual)
        if (rel.organizacionAId === organizacionActualId) {
          return {
            id: rel.organizacionBId,
            nombre: rel.organizacionBNombre,
          };
        } else {
          return {
            id: rel.organizacionAId,
            nombre: rel.organizacionANombre,
          };
        }
      });

      setOrganizacionesRelacionadas(organizaciones);
    } catch (err) {
      console.error('Error loading related organizations:', err);
      setOrganizacionesRelacionadas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? undefined : selectedValue);
  };

  if (!label) {
    label = t('resources.form.associatedOrganizationLabel');
  }
  if (!placeholder) {
    placeholder = t('resources.form.associatedOrganizationPlaceholder');
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text mb-1">
        {label}
        <span className="text-text-muted text-xs ml-1">
          ({t('common.optional')})
        </span>
      </label>
      {isLoading ? (
        <div className="text-sm text-text-muted py-2">
          {t('common.loading')}...
        </div>
      ) : organizacionesRelacionadas.length === 0 ? (
        <div className="text-sm text-text-muted py-2">
          {t('resources.form.noRelatedOrganizations')}
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {organizacionesRelacionadas.map((org) => (
            <option key={org.id} value={org.id}>
              {org.nombre}
            </option>
          ))}
        </select>
      )}
      <p className="text-xs text-text-muted mt-1">
        {t('resources.form.associatedOrganizationHelp')}
      </p>
    </div>
  );
}

