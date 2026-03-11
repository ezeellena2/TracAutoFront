import { useTranslation } from 'react-i18next';
import { Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';
import type { SucursalDto } from '../types/sucursal';
import { CategoriaAlquiler } from '../types/vehiculoAlquiler';
import { UnidadTiempoTarifa } from '../types/tarifa';

// --- Tipos exportados ---

export interface TarifaFormState {
  nombre: string;
  categoriaAlquiler: string; // '' = todas
  sucursalId: string; // '' = todas
  unidadTiempo: number;
  precioPorUnidad: string;
  moneda: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
  duracionMinimaDias: string;
  duracionMaximaDias: string;
  prioridad: string;
}

export interface TarifaFormErrors {
  nombre?: string;
  precioPorUnidad?: string;
  moneda?: string;
  vigencia?: string;
  duracionMinimaDias?: string;
  duracionMaximaDias?: string;
  prioridad?: string;
}

export const INITIAL_TARIFA_FORM: TarifaFormState = {
  nombre: '',
  categoriaAlquiler: '',
  sucursalId: '',
  unidadTiempo: UnidadTiempoTarifa.Dia,
  precioPorUnidad: '',
  moneda: 'ARS',
  vigenciaDesde: '',
  vigenciaHasta: '',
  duracionMinimaDias: '',
  duracionMaximaDias: '',
  prioridad: '1',
};

export function validateTarifaForm(
  form: TarifaFormState,
  t: (key: string) => string,
): TarifaFormErrors {
  const errs: TarifaFormErrors = {};

  if (!form.nombre.trim() || form.nombre.trim().length > 200) {
    errs.nombre = t('alquileres.tarifas.form.nombreRequerido');
  }

  const precio = parseFloat(form.precioPorUnidad);
  if (isNaN(precio) || precio <= 0) {
    errs.precioPorUnidad = t('alquileres.tarifas.form.precioRequerido');
  }

  if (!form.moneda.trim()) {
    errs.moneda = t('alquileres.tarifas.form.monedaRequerida');
  }

  if (!form.vigenciaDesde || !form.vigenciaHasta) {
    errs.vigencia = t('alquileres.tarifas.form.vigenciaRequerida');
  } else if (form.vigenciaHasta <= form.vigenciaDesde) {
    errs.vigencia = t('alquileres.tarifas.form.vigenciaInvalida');
  }

  if (form.duracionMinimaDias.trim() !== '') {
    const min = parseInt(form.duracionMinimaDias, 10);
    if (isNaN(min) || min <= 0) {
      errs.duracionMinimaDias = t('alquileres.tarifas.form.duracionMinimaInvalida');
    }
  }

  if (form.duracionMaximaDias.trim() !== '') {
    const max = parseInt(form.duracionMaximaDias, 10);
    if (isNaN(max) || max <= 0) {
      errs.duracionMaximaDias = t('alquileres.tarifas.form.duracionMaximaInvalida');
    } else if (form.duracionMinimaDias.trim() !== '') {
      const min = parseInt(form.duracionMinimaDias, 10);
      if (!isNaN(min) && max < min) {
        errs.duracionMaximaDias = t('alquileres.tarifas.form.duracionMaximaMenor');
      }
    }
  }

  const prioridad = parseInt(form.prioridad, 10);
  if (isNaN(prioridad) || prioridad < 1) {
    errs.prioridad = t('alquileres.tarifas.form.prioridadInvalida');
  }

  return errs;
}

// --- Componente ---

interface TarifaFormProps {
  form: TarifaFormState;
  errors: TarifaFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  isEditMode: boolean;
  submitLabel: string;
  submittingLabel: string;
  sucursales: SucursalDto[];
  onFormChange: (form: TarifaFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function TarifaForm({
  form,
  errors,
  apiError,
  isSubmitting,
  isEditMode,
  submitLabel,
  submittingLabel,
  sucursales,
  onFormChange,
  onSubmit,
  onClose,
}: TarifaFormProps) {
  const { t } = useTranslation();

  const categoriaOptions = [
    { value: '', label: t('alquileres.tarifas.form.categoriaPlaceholder') },
    ...Object.values(CategoriaAlquiler)
      .filter(v => typeof v === 'number')
      .map(v => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) })),
  ];

  const sucursalOptions = [
    { value: '', label: t('alquileres.tarifas.form.sucursalPlaceholder') },
    ...sucursales.map(s => ({ value: s.id, label: s.nombre })),
  ];

  const unidadOptions = Object.values(UnidadTiempoTarifa)
    .filter(v => typeof v === 'number')
    .map(v => ({ value: v as number, label: t(`alquileres.tarifas.unidades.${v}`) }));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={isEditMode ? 'tarifa-edit' : 'tarifa-create'} onReportClick={onClose} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('alquileres.tarifas.form.nombre')}
          value={form.nombre}
          onChange={(e) => onFormChange({ ...form, nombre: e.target.value })}
          placeholder={t('alquileres.tarifas.form.nombrePlaceholder')}
          error={errors.nombre}
          maxLength={200}
          required
        />
        <Select
          label={t('alquileres.tarifas.form.categoriaAlquiler')}
          value={form.categoriaAlquiler}
          onChange={(v) => onFormChange({ ...form, categoriaAlquiler: String(v) })}
          options={categoriaOptions}
        />
        <Select
          label={t('alquileres.tarifas.form.sucursal')}
          value={form.sucursalId}
          onChange={(v) => onFormChange({ ...form, sucursalId: String(v) })}
          options={sucursalOptions}
        />
        <Select
          label={t('alquileres.tarifas.form.unidadTiempo')}
          value={form.unidadTiempo}
          onChange={(v) => onFormChange({ ...form, unidadTiempo: Number(v) })}
          options={unidadOptions}
          required
        />
        <Input
          label={t('alquileres.tarifas.form.precioPorUnidad')}
          type="number"
          value={form.precioPorUnidad}
          onChange={(e) => onFormChange({ ...form, precioPorUnidad: e.target.value })}
          placeholder={t('alquileres.tarifas.form.precioPorUnidadPlaceholder')}
          error={errors.precioPorUnidad}
          required
        />
        <Input
          label={t('alquileres.tarifas.form.moneda')}
          value={form.moneda}
          onChange={(e) => onFormChange({ ...form, moneda: e.target.value })}
          placeholder={t('alquileres.tarifas.form.monedaPlaceholder')}
          error={errors.moneda}
          required
        />
        <Input
          label={t('alquileres.tarifas.form.vigenciaDesde')}
          type="date"
          value={form.vigenciaDesde}
          onChange={(e) => onFormChange({ ...form, vigenciaDesde: e.target.value })}
          error={errors.vigencia}
          required
        />
        <Input
          label={t('alquileres.tarifas.form.vigenciaHasta')}
          type="date"
          value={form.vigenciaHasta}
          onChange={(e) => onFormChange({ ...form, vigenciaHasta: e.target.value })}
          error={errors.vigencia}
          required
        />
        <Input
          label={t('alquileres.tarifas.form.duracionMinimaDias')}
          type="number"
          value={form.duracionMinimaDias}
          onChange={(e) => onFormChange({ ...form, duracionMinimaDias: e.target.value })}
          placeholder={t('alquileres.tarifas.form.duracionMinimaPlaceholder')}
          error={errors.duracionMinimaDias}
        />
        <Input
          label={t('alquileres.tarifas.form.duracionMaximaDias')}
          type="number"
          value={form.duracionMaximaDias}
          onChange={(e) => onFormChange({ ...form, duracionMaximaDias: e.target.value })}
          placeholder={t('alquileres.tarifas.form.duracionMaximaPlaceholder')}
          error={errors.duracionMaximaDias}
        />
        <Input
          label={t('alquileres.tarifas.form.prioridad')}
          type="number"
          value={form.prioridad}
          onChange={(e) => onFormChange({ ...form, prioridad: e.target.value })}
          placeholder={t('alquileres.tarifas.form.prioridadPlaceholder')}
          error={errors.prioridad}
          required
        />
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
