import { useTranslation } from 'react-i18next';
import { Input, Button, ApiErrorBanner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';

// --- Tipos exportados ---

export interface CoberturaFormState {
  nombre: string;
  descripcion: string;
  precioPorDia: string;
  deducibleMaximo: string;
  cubreRobo: boolean;
  cubreVidrios: boolean;
  cubreNeumaticos: boolean;
  cubreGranizo: boolean;
  obligatoria: boolean;
}

export interface CoberturaFormErrors {
  nombre?: string;
  descripcion?: string;
  precioPorDia?: string;
  deducibleMaximo?: string;
}

export const INITIAL_COBERTURA_FORM: CoberturaFormState = {
  nombre: '',
  descripcion: '',
  precioPorDia: '',
  deducibleMaximo: '',
  cubreRobo: false,
  cubreVidrios: false,
  cubreNeumaticos: false,
  cubreGranizo: false,
  obligatoria: false,
};

export function validateCoberturaForm(
  form: CoberturaFormState,
  t: (key: string) => string,
): CoberturaFormErrors {
  const errs: CoberturaFormErrors = {};

  if (!form.nombre.trim() || form.nombre.trim().length > 200) {
    errs.nombre = t('alquileres.coberturas.form.nombreRequerido');
  }

  if (form.descripcion.length > 1000) {
    errs.descripcion = t('alquileres.coberturas.form.descripcionLarga');
  }

  const precio = parseFloat(form.precioPorDia);
  if (isNaN(precio) || precio <= 0) {
    errs.precioPorDia = t('alquileres.coberturas.form.precioRequerido');
  }

  const deducible = parseFloat(form.deducibleMaximo);
  if (isNaN(deducible) || deducible < 0) {
    errs.deducibleMaximo = t('alquileres.coberturas.form.deducibleInvalido');
  }

  return errs;
}

// --- Componente ---

interface CoberturaFormProps {
  form: CoberturaFormState;
  errors: CoberturaFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  isEditMode: boolean;
  submitLabel: string;
  submittingLabel: string;
  onFormChange: (form: CoberturaFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function CoberturaForm({
  form,
  errors,
  apiError,
  isSubmitting,
  isEditMode,
  submitLabel,
  submittingLabel,
  onFormChange,
  onSubmit,
  onClose,
}: CoberturaFormProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={isEditMode ? 'cobertura-edit' : 'cobertura-create'} onReportClick={onClose} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('alquileres.coberturas.form.nombre')}
          value={form.nombre}
          onChange={(e) => onFormChange({ ...form, nombre: e.target.value })}
          placeholder={t('alquileres.coberturas.form.nombrePlaceholder')}
          error={errors.nombre}
          maxLength={200}
          required
        />
        <Input
          label={t('alquileres.coberturas.form.precioPorDia')}
          type="number"
          value={form.precioPorDia}
          onChange={(e) => onFormChange({ ...form, precioPorDia: e.target.value })}
          placeholder={t('alquileres.coberturas.form.precioPorDiaPlaceholder')}
          error={errors.precioPorDia}
          required
        />
        <Input
          label={t('alquileres.coberturas.form.deducibleMaximo')}
          type="number"
          value={form.deducibleMaximo}
          onChange={(e) => onFormChange({ ...form, deducibleMaximo: e.target.value })}
          placeholder={t('alquileres.coberturas.form.deduciblePlaceholder')}
          error={errors.deducibleMaximo}
          required
        />
      </div>

      <div className="col-span-full">
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.coberturas.form.descripcion')}
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })}
          placeholder={t('alquileres.coberturas.form.descripcionPlaceholder')}
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        />
        {errors.descripcion && (
          <p className="mt-1.5 text-sm text-error">{errors.descripcion}</p>
        )}
      </div>

      {/* Seccin coberturas */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.coberturas.form.seccionCoberturas')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['cubreRobo', 'cubreVidrios', 'cubreNeumaticos', 'cubreGranizo'] as const).map((field) => (
            <div key={field} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={field}
                checked={form[field]}
                onChange={(e) => onFormChange({ ...form, [field]: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor={field} className="text-sm font-medium text-text cursor-pointer">
                {t(`alquileres.coberturas.form.${field}`)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="obligatoria"
          checked={form.obligatoria}
          onChange={(e) => onFormChange({ ...form, obligatoria: e.target.checked })}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="obligatoria" className="text-sm font-medium text-text cursor-pointer">
          {t('alquileres.coberturas.form.obligatoria')}
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
