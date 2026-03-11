import { useTranslation } from 'react-i18next';
import { Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';
import { TipoDescuento } from '../types/promocion';

// --- Tipos exportados ---

export interface PromocionFormState {
  codigo: string;
  descripcion: string;
  tipoDescuento: number;
  valorDescuento: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  usosMaximos: string;
  montoMinimoReserva: string;
}

export interface PromocionFormErrors {
  codigo?: string;
  descripcion?: string;
  valorDescuento?: string;
  vigencia?: string;
  usosMaximos?: string;
  montoMinimoReserva?: string;
}

export const INITIAL_PROMOCION_FORM: PromocionFormState = {
  codigo: '',
  descripcion: '',
  tipoDescuento: TipoDescuento.Porcentaje,
  valorDescuento: '',
  vigenciaDesde: '',
  vigenciaHasta: '',
  usosMaximos: '',
  montoMinimoReserva: '',
};

export function validatePromocionForm(
  form: PromocionFormState,
  t: (key: string) => string,
): PromocionFormErrors {
  const errs: PromocionFormErrors = {};

  if (!form.codigo.trim() || form.codigo.trim().length > 50) {
    errs.codigo = t('alquileres.promociones.form.codigoRequerido');
  }

  if (form.descripcion.length > 1000) {
    errs.descripcion = t('alquileres.promociones.form.descripcionLarga');
  }

  const valor = parseFloat(form.valorDescuento);
  if (isNaN(valor) || valor <= 0) {
    errs.valorDescuento = t('alquileres.promociones.form.valorRequerido');
  } else if (form.tipoDescuento === TipoDescuento.Porcentaje && valor > 100) {
    errs.valorDescuento = t('alquileres.promociones.form.valorPorcentajeMax');
  }

  if (!form.vigenciaDesde || !form.vigenciaHasta) {
    errs.vigencia = t('alquileres.promociones.form.vigenciaRequerida');
  } else if (form.vigenciaHasta <= form.vigenciaDesde) {
    errs.vigencia = t('alquileres.promociones.form.vigenciaInvalida');
  }

  if (form.usosMaximos.trim() !== '') {
    const usos = parseInt(form.usosMaximos, 10);
    if (isNaN(usos) || usos <= 0) {
      errs.usosMaximos = t('alquileres.promociones.form.usosMaximosInvalido');
    }
  }

  if (form.montoMinimoReserva.trim() !== '') {
    const monto = parseFloat(form.montoMinimoReserva);
    if (isNaN(monto) || monto <= 0) {
      errs.montoMinimoReserva = t('alquileres.promociones.form.montoMinimoInvalido');
    }
  }

  return errs;
}

// --- Componente ---

interface PromocionFormProps {
  form: PromocionFormState;
  errors: PromocionFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  isEditMode: boolean;
  submitLabel: string;
  submittingLabel: string;
  onFormChange: (form: PromocionFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function PromocionForm({
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
}: PromocionFormProps) {
  const { t } = useTranslation();

  const tipoOptions = Object.values(TipoDescuento)
    .filter(v => typeof v === 'number')
    .map(v => ({ value: v as number, label: t(`alquileres.promociones.tiposDescuento.${v}`) }));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={isEditMode ? 'promocion-edit' : 'promocion-create'} onReportClick={onClose} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('alquileres.promociones.form.codigo')}
          value={form.codigo}
          onChange={(e) => onFormChange({ ...form, codigo: e.target.value })}
          placeholder={t('alquileres.promociones.form.codigoPlaceholder')}
          error={errors.codigo}
          maxLength={50}
          required
        />
        <Select
          label={t('alquileres.promociones.form.tipoDescuento')}
          value={form.tipoDescuento}
          onChange={(v) => onFormChange({ ...form, tipoDescuento: Number(v) })}
          options={tipoOptions}
          required
        />
        <Input
          label={t('alquileres.promociones.form.valorDescuento')}
          type="number"
          value={form.valorDescuento}
          onChange={(e) => onFormChange({ ...form, valorDescuento: e.target.value })}
          placeholder={t('alquileres.promociones.form.valorDescuentoPlaceholder')}
          error={errors.valorDescuento}
          required
        />
        <Input
          label={t('alquileres.promociones.form.vigenciaDesde')}
          type="date"
          value={form.vigenciaDesde}
          onChange={(e) => onFormChange({ ...form, vigenciaDesde: e.target.value })}
          error={errors.vigencia}
          required
        />
        <Input
          label={t('alquileres.promociones.form.vigenciaHasta')}
          type="date"
          value={form.vigenciaHasta}
          onChange={(e) => onFormChange({ ...form, vigenciaHasta: e.target.value })}
          required
        />
        <Input
          label={t('alquileres.promociones.form.usosMaximos')}
          type="number"
          value={form.usosMaximos}
          onChange={(e) => onFormChange({ ...form, usosMaximos: e.target.value })}
          placeholder={t('alquileres.promociones.form.usosMaximosPlaceholder')}
          error={errors.usosMaximos}
        />
        <Input
          label={t('alquileres.promociones.form.montoMinimoReserva')}
          type="number"
          value={form.montoMinimoReserva}
          onChange={(e) => onFormChange({ ...form, montoMinimoReserva: e.target.value })}
          placeholder={t('alquileres.promociones.form.montoMinimoPlaceholder')}
          error={errors.montoMinimoReserva}
        />
      </div>

      <div className="col-span-full">
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.promociones.form.descripcion')}
        </label>
        <textarea
          value={form.descripcion}
          onChange={(e) => onFormChange({ ...form, descripcion: e.target.value })}
          placeholder={t('alquileres.promociones.form.descripcionPlaceholder')}
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        />
        {errors.descripcion && (
          <p className="mt-1.5 text-sm text-error">{errors.descripcion}</p>
        )}
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
