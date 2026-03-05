import { useTranslation } from 'react-i18next';
import { Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';
import { CategoriaAlquiler } from '../types/vehiculoAlquiler';
import { TipoRecargo } from '../types/recargo';

// --- Tipos exportados ---

export interface RecargoFormState {
  tipoRecargo: number;
  nombre: string;
  descripcion: string;
  precioFijo: string;
  precioPorDia: string;
  porcentajeSobreTotal: string;
  obligatorio: boolean;
  categoriaAlquiler: string; // '' = todas
}

export interface RecargoFormErrors {
  nombre?: string;
  descripcion?: string;
  precios?: string;
  precioFijo?: string;
  precioPorDia?: string;
  porcentajeSobreTotal?: string;
}

export const INITIAL_RECARGO_FORM: RecargoFormState = {
  tipoRecargo: TipoRecargo.Otro,
  nombre: '',
  descripcion: '',
  precioFijo: '',
  precioPorDia: '',
  porcentajeSobreTotal: '',
  obligatorio: false,
  categoriaAlquiler: '',
};

export function validateRecargoForm(
  form: RecargoFormState,
  t: (key: string) => string,
): RecargoFormErrors {
  const errs: RecargoFormErrors = {};

  if (!form.nombre.trim() || form.nombre.trim().length > 200) {
    errs.nombre = t('alquileres.recargos.form.nombreRequerido');
  }

  if (form.descripcion.length > 1000) {
    errs.descripcion = t('alquileres.recargos.form.descripcionLarga');
  }

  const hasFijo = form.precioFijo.trim() !== '';
  const hasDia = form.precioPorDia.trim() !== '';
  const hasPorcentaje = form.porcentajeSobreTotal.trim() !== '';

  if (!hasFijo && !hasDia && !hasPorcentaje) {
    errs.precios = t('alquileres.recargos.form.alMenosUnPrecio');
  }

  if (hasFijo) {
    const val = parseFloat(form.precioFijo);
    if (isNaN(val) || val <= 0) {
      errs.precioFijo = t('alquileres.recargos.form.precioFijoInvalido');
    }
  }

  if (hasDia) {
    const val = parseFloat(form.precioPorDia);
    if (isNaN(val) || val <= 0) {
      errs.precioPorDia = t('alquileres.recargos.form.precioPorDiaInvalido');
    }
  }

  if (hasPorcentaje) {
    const val = parseFloat(form.porcentajeSobreTotal);
    if (isNaN(val) || val <= 0 || val > 100) {
      errs.porcentajeSobreTotal = t('alquileres.recargos.form.porcentajeInvalido');
    }
  }

  return errs;
}

// --- Componente ---

interface RecargoFormProps {
  form: RecargoFormState;
  errors: RecargoFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  isEditMode: boolean;
  submitLabel: string;
  submittingLabel: string;
  onFormChange: (form: RecargoFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function RecargoForm({
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
}: RecargoFormProps) {
  const { t } = useTranslation();

  const tipoOptions = Object.values(TipoRecargo)
    .filter(v => typeof v === 'number')
    .map(v => ({ value: v as number, label: t(`alquileres.recargos.tipos.${v}`) }));

  const categoriaOptions = [
    { value: '', label: t('alquileres.recargos.form.categoriaPlaceholder') },
    ...Object.values(CategoriaAlquiler)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={isEditMode ? 'recargo-edit' : 'recargo-create'} onReportClick={onClose} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t('alquileres.recargos.form.tipoRecargo')}
          value={form.tipoRecargo}
          onChange={(v) => onFormChange({ ...form, tipoRecargo: Number(v) })}
          options={tipoOptions}
          required
        />
        <Input
          label={t('alquileres.recargos.form.nombre')}
          value={form.nombre}
          onChange={(e) => onFormChange({ ...form, nombre: e.target.value })}
          placeholder={t('alquileres.recargos.form.nombrePlaceholder')}
          error={errors.nombre}
          maxLength={200}
          required
        />
        <Select
          label={t('alquileres.recargos.form.categoriaAlquiler')}
          value={form.categoriaAlquiler}
          onChange={(v) => onFormChange({ ...form, categoriaAlquiler: String(v) })}
          options={categoriaOptions}
        />
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="obligatorio"
            checked={form.obligatorio}
            onChange={(e) => onFormChange({ ...form, obligatorio: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor="obligatorio" className="text-sm font-medium text-text cursor-pointer">
            {t('alquileres.recargos.form.obligatorio')}
          </label>
        </div>
      </div>

      <div className="col-span-full">
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.recargos.form.descripcion')}
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })}
          placeholder={t('alquileres.recargos.form.descripcionPlaceholder')}
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        />
        {errors.descripcion && (
          <p className="mt-1.5 text-sm text-error">{errors.descripcion}</p>
        )}
      </div>

      {/* Sección precios */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.recargos.form.seccionPrecios')}
        </h3>
        {errors.precios && (
          <p className="text-sm text-error mb-3">{errors.precios}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('alquileres.recargos.form.precioFijo')}
            type="number"
            value={form.precioFijo}
            onChange={(e) => onFormChange({ ...form, precioFijo: e.target.value })}
            placeholder={t('alquileres.recargos.form.precioFijoPlaceholder')}
            error={errors.precioFijo}
          />
          <Input
            label={t('alquileres.recargos.form.precioPorDia')}
            type="number"
            value={form.precioPorDia}
            onChange={(e) => onFormChange({ ...form, precioPorDia: e.target.value })}
            placeholder={t('alquileres.recargos.form.precioPorDiaPlaceholder')}
            error={errors.precioPorDia}
          />
          <Input
            label={t('alquileres.recargos.form.porcentajeSobreTotal')}
            type="number"
            value={form.porcentajeSobreTotal}
            onChange={(e) => onFormChange({ ...form, porcentajeSobreTotal: e.target.value })}
            placeholder={t('alquileres.recargos.form.porcentajePlaceholder')}
            error={errors.porcentajeSobreTotal}
          />
        </div>
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
