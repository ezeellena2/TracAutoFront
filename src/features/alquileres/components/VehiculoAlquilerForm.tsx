import { useTranslation } from 'react-i18next';
import { Input, Select, Button, ApiErrorBanner, Spinner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';
import type { SucursalDto } from '../types/sucursal';
import { CategoriaAlquiler, PoliticaCombustible } from '../types/vehiculoAlquiler';
import { BuscadorVehiculo } from './BuscadorVehiculo';

// --- Tipos exportados ---

export interface VehiculoAlquilerFormState {
  vehiculoId: string;
  vehiculoLabel: string;
  categoriaAlquiler: number;
  precioBaseDiario: string;
  depositoMinimo: string;
  kilometrajeLimiteDiario: string;
  precioPorKmExcedente: string;
  politicaCombustible: number;
  edadMinimaConductor: string;
  licenciaRequerida: string;
  sucursalPorDefectoId: string;
  sucursalIds: string[];
}

export interface VehiculoAlquilerFormErrors {
  vehiculoId?: string;
  categoriaAlquiler?: string;
  precioBaseDiario?: string;
  depositoMinimo?: string;
  kilometrajeLimiteDiario?: string;
  precioPorKmExcedente?: string;
  politicaCombustible?: string;
  edadMinimaConductor?: string;
  licenciaRequerida?: string;
  sucursalPorDefectoId?: string;
  sucursalIds?: string;
}

export const INITIAL_VEHICULO_FORM: VehiculoAlquilerFormState = {
  vehiculoId: '',
  vehiculoLabel: '',
  categoriaAlquiler: CategoriaAlquiler.Economico,
  precioBaseDiario: '',
  depositoMinimo: '',
  kilometrajeLimiteDiario: '',
  precioPorKmExcedente: '',
  politicaCombustible: PoliticaCombustible.FullFull,
  edadMinimaConductor: '21',
  licenciaRequerida: 'B1',
  sucursalPorDefectoId: '',
  sucursalIds: [],
};

export function validateVehiculoAlquilerForm(
  form: VehiculoAlquilerFormState,
  t: (key: string) => string,
  isEditMode: boolean,
): VehiculoAlquilerFormErrors {
  const errs: VehiculoAlquilerFormErrors = {};

  if (!isEditMode && !form.vehiculoId) {
    errs.vehiculoId = t('alquileres.flota.form.vehiculoRequerido');
  }

  const precio = parseFloat(form.precioBaseDiario);
  if (isNaN(precio) || precio <= 0) {
    errs.precioBaseDiario = t('alquileres.flota.form.precioRequerido');
  }

  const deposito = parseFloat(form.depositoMinimo);
  if (isNaN(deposito) || deposito < 0) {
    errs.depositoMinimo = t('alquileres.flota.form.depositoRequerido');
  }

  if (form.kilometrajeLimiteDiario.trim() !== '') {
    const km = parseInt(form.kilometrajeLimiteDiario, 10);
    if (isNaN(km) || km <= 0) {
      errs.kilometrajeLimiteDiario = t('alquileres.flota.form.kilometrajeInvalido');
    }
  }

  const precioPorKm = parseFloat(form.precioPorKmExcedente);
  if (isNaN(precioPorKm) || precioPorKm < 0) {
    errs.precioPorKmExcedente = t('alquileres.flota.form.precioPorKmRequerido');
  }

  const edad = parseInt(form.edadMinimaConductor, 10);
  if (isNaN(edad) || edad < 18 || edad > 99) {
    errs.edadMinimaConductor = t('alquileres.flota.form.edadMinimaInvalida');
  }

  if (!form.licenciaRequerida.trim() || form.licenciaRequerida.trim().length > 100) {
    errs.licenciaRequerida = t('alquileres.flota.form.licenciaRequeridaError');
  }

  if (!form.sucursalPorDefectoId) {
    errs.sucursalPorDefectoId = t('alquileres.flota.form.sucursalDefectoRequerida');
  }

  if (form.sucursalIds.length === 0) {
    errs.sucursalIds = t('alquileres.flota.form.sucursalesRequeridas');
  } else if (form.sucursalPorDefectoId && !form.sucursalIds.includes(form.sucursalPorDefectoId)) {
    errs.sucursalIds = t('alquileres.flota.form.sucursalesDebeIncluirDefecto');
  }

  return errs;
}

// --- Componente ---

interface VehiculoAlquilerFormProps {
  form: VehiculoAlquilerFormState;
  errors: VehiculoAlquilerFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  isEditMode: boolean;
  submitLabel: string;
  submittingLabel: string;
  jiraLabel: string;
  sucursalesDisponibles: SucursalDto[];
  sucursalesLoading: boolean;
  onFormChange: (form: VehiculoAlquilerFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function VehiculoAlquilerForm({
  form,
  errors,
  apiError,
  isSubmitting,
  isEditMode,
  submitLabel,
  submittingLabel,
  jiraLabel,
  sucursalesDisponibles,
  sucursalesLoading,
  onFormChange,
  onSubmit,
  onClose,
}: VehiculoAlquilerFormProps) {
  const { t } = useTranslation();

  const categoriaOptions = Object.values(CategoriaAlquiler)
    .filter(v => typeof v === 'number')
    .map(v => ({ value: v as number, label: t(`alquileres.flota.categorias.${v}`) }));

  const politicaOptions = Object.values(PoliticaCombustible)
    .filter(v => typeof v === 'number')
    .map(v => ({ value: v as number, label: t(`alquileres.flota.politicas.${v}`) }));

  const handleSucursalToggle = (sucursalId: string, checked: boolean) => {
    let newIds: string[];
    if (checked) {
      newIds = [...form.sucursalIds, sucursalId];
    } else {
      newIds = form.sucursalIds.filter(id => id !== sucursalId);
    }
    // Si se desmarca la sucursal por defecto, limpiar
    const newDefecto = !checked && form.sucursalPorDefectoId === sucursalId
      ? ''
      : form.sucursalPorDefectoId;
    onFormChange({ ...form, sucursalIds: newIds, sucursalPorDefectoId: newDefecto });
  };

  const handleDefectoChange = (sucursalId: string) => {
    // Auto-check si no está
    const newIds = form.sucursalIds.includes(sucursalId)
      ? form.sucursalIds
      : [...form.sucursalIds, sucursalId];
    onFormChange({ ...form, sucursalPorDefectoId: sucursalId, sucursalIds: newIds });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={jiraLabel} onReportClick={onClose} />

      {/* Sección: Vehículo base (solo en create) */}
      {!isEditMode && (
        <div>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            {t('alquileres.flota.form.seccionVehiculo')}
          </h3>
          <BuscadorVehiculo
            vehiculoId={form.vehiculoId}
            vehiculoLabel={form.vehiculoLabel}
            error={errors.vehiculoId}
            onSelect={(v) => onFormChange({ ...form, vehiculoId: v.id, vehiculoLabel: v.label })}
            onClear={() => onFormChange({ ...form, vehiculoId: '', vehiculoLabel: '' })}
          />
        </div>
      )}

      {/* Sección: Datos de alquiler */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.flota.form.seccionDatosAlquiler')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('alquileres.flota.form.categoriaAlquiler')}
            value={form.categoriaAlquiler}
            onChange={(v) => onFormChange({ ...form, categoriaAlquiler: Number(v) })}
            options={categoriaOptions}
            required
          />
          <Input
            label={t('alquileres.flota.form.precioBaseDiario')}
            type="number"
            value={form.precioBaseDiario}
            onChange={(e) => onFormChange({ ...form, precioBaseDiario: e.target.value })}
            placeholder={t('alquileres.flota.form.precioBaseDiarioPlaceholder')}
            error={errors.precioBaseDiario}
            required
          />
          <Input
            label={t('alquileres.flota.form.depositoMinimo')}
            type="number"
            value={form.depositoMinimo}
            onChange={(e) => onFormChange({ ...form, depositoMinimo: e.target.value })}
            placeholder={t('alquileres.flota.form.depositoMinimoPlaceholder')}
            error={errors.depositoMinimo}
            required
          />
          <Input
            label={t('alquileres.flota.form.kilometrajeLimiteDiario')}
            type="number"
            value={form.kilometrajeLimiteDiario}
            onChange={(e) => onFormChange({ ...form, kilometrajeLimiteDiario: e.target.value })}
            placeholder={t('alquileres.flota.form.kilometrajeLimitePlaceholder')}
            error={errors.kilometrajeLimiteDiario}
          />
          <Input
            label={t('alquileres.flota.form.precioPorKmExcedente')}
            type="number"
            value={form.precioPorKmExcedente}
            onChange={(e) => onFormChange({ ...form, precioPorKmExcedente: e.target.value })}
            placeholder={t('alquileres.flota.form.precioPorKmPlaceholder')}
            error={errors.precioPorKmExcedente}
            required
          />
        </div>
      </div>

      {/* Sección: Política y requisitos */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.flota.form.seccionPolitica')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('alquileres.flota.form.politicaCombustible')}
            value={form.politicaCombustible}
            onChange={(v) => onFormChange({ ...form, politicaCombustible: Number(v) })}
            options={politicaOptions}
            required
          />
          <Input
            label={t('alquileres.flota.form.edadMinimaConductor')}
            type="number"
            value={form.edadMinimaConductor}
            onChange={(e) => onFormChange({ ...form, edadMinimaConductor: e.target.value })}
            placeholder={t('alquileres.flota.form.edadMinimaPlaceholder')}
            error={errors.edadMinimaConductor}
            required
          />
          <Input
            label={t('alquileres.flota.form.licenciaRequerida')}
            value={form.licenciaRequerida}
            onChange={(e) => onFormChange({ ...form, licenciaRequerida: e.target.value })}
            placeholder={t('alquileres.flota.form.licenciaPlaceholder')}
            error={errors.licenciaRequerida}
            maxLength={100}
            required
          />
        </div>
      </div>

      {/* Sección: Sucursales */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.flota.form.seccionSucursales')}
        </h3>
        {errors.sucursalIds && (
          <p className="text-sm text-error mb-3">{errors.sucursalIds}</p>
        )}
        {errors.sucursalPorDefectoId && !errors.sucursalIds && (
          <p className="text-sm text-error mb-3">{errors.sucursalPorDefectoId}</p>
        )}
        {sucursalesLoading ? (
          <div className="flex items-center gap-2 py-4">
            <Spinner />
            <span className="text-sm text-text-muted">{t('alquileres.flota.form.cargandoSucursales')}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {sucursalesDisponibles.map(suc => {
              const isChecked = form.sucursalIds.includes(suc.id);
              const isDefault = form.sucursalPorDefectoId === suc.id;
              return (
                <div
                  key={suc.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleSucursalToggle(suc.id, e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-text flex-1">
                    {suc.nombre} <span className="text-text-muted">— {suc.ciudad}</span>
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sucursalDefecto"
                      checked={isDefault}
                      onChange={() => handleDefectoChange(suc.id)}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-text-muted">
                      {t('alquileres.flota.form.sucursalDefecto')}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
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
