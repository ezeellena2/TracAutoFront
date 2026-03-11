import { useTranslation } from 'react-i18next';
import { Input, Button, ApiErrorBanner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';
import type { HorarioSucursalDto } from '../types/sucursal';

// --- Constantes y tipos compartidos ---

export const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0] as const;
export const DIAS_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export interface SucursalFormState {
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  permiteOneWay: boolean;
  notas: string;
  horarios: HorarioSucursalDto[];
}

export interface SucursalFormErrors {
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  email?: string;
  horarios?: string;
}

export function getDefaultHorarios(): HorarioSucursalDto[] {
  return DIAS_ORDEN.map(dia => ({
    diaSemana: dia,
    horaApertura: dia === 6 ? '09:00:00' : '08:00:00',
    horaCierre: dia === 6 ? '13:00:00' : '18:00:00',
    cerrado: dia === 0,
  }));
}

export function validateSucursalForm(form: SucursalFormState, t: (key: string) => string): SucursalFormErrors {
  const errs: SucursalFormErrors = {};
  if (!form.nombre.trim()) errs.nombre = t('alquileres.sucursales.form.nombreRequerido');
  if (!form.direccion.trim()) errs.direccion = t('alquileres.sucursales.form.direccionRequerida');
  if (!form.ciudad.trim()) errs.ciudad = t('alquileres.sucursales.form.ciudadRequerida');
  if (!form.provincia.trim()) errs.provincia = t('alquileres.sucursales.form.provinciaRequerida');
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errs.email = t('alquileres.sucursales.form.emailInvalido');
  }
  const horarioInvalido = form.horarios.some(h => !h.cerrado && h.horaApertura >= h.horaCierre);
  if (horarioInvalido) errs.horarios = t('alquileres.sucursales.form.horaInvalida');
  return errs;
}

// --- Componente ---

interface SucursalFormProps {
  form: SucursalFormState;
  errors: SucursalFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  jiraLabel: string;
  onFormChange: (form: SucursalFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  checkboxId: string;
}

export function SucursalForm({
  form,
  errors,
  apiError,
  isSubmitting,
  submitLabel,
  submittingLabel,
  jiraLabel,
  onFormChange,
  onSubmit,
  onClose,
  checkboxId,
}: SucursalFormProps) {
  const { t } = useTranslation();

  const updateHorario = (index: number, field: keyof HorarioSucursalDto, value: unknown) => {
    const horarios = [...form.horarios];
    horarios[index] = { ...horarios[index], [field]: value };
    onFormChange({ ...form, horarios });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={jiraLabel} onReportClick={onClose} />

      {/* Datos generales */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.sucursales.form.datosGenerales')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label={t('alquileres.sucursales.form.nombre')}
              value={form.nombre}
              onChange={(e) => onFormChange({ ...form, nombre: e.target.value })}
              placeholder={t('alquileres.sucursales.form.nombrePlaceholder')}
              error={errors.nombre}
              maxLength={200}
              required
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label={t('alquileres.sucursales.form.direccion')}
              value={form.direccion}
              onChange={(e) => onFormChange({ ...form, direccion: e.target.value })}
              placeholder={t('alquileres.sucursales.form.direccionPlaceholder')}
              error={errors.direccion}
              maxLength={500}
              required
            />
          </div>
          <Input
            label={t('alquileres.sucursales.form.ciudad')}
            value={form.ciudad}
            onChange={(e) => onFormChange({ ...form, ciudad: e.target.value })}
            placeholder={t('alquileres.sucursales.form.ciudadPlaceholder')}
            error={errors.ciudad}
            maxLength={100}
            required
          />
          <Input
            label={t('alquileres.sucursales.form.provincia')}
            value={form.provincia}
            onChange={(e) => onFormChange({ ...form, provincia: e.target.value })}
            placeholder={t('alquileres.sucursales.form.provinciaPlaceholder')}
            error={errors.provincia}
            maxLength={100}
            required
          />
          <Input
            label={t('alquileres.sucursales.form.codigoPostal')}
            value={form.codigoPostal}
            onChange={(e) => onFormChange({ ...form, codigoPostal: e.target.value })}
            placeholder={t('alquileres.sucursales.form.codigoPostalPlaceholder')}
            maxLength={20}
          />
          <Input
            label={t('alquileres.sucursales.form.telefono')}
            value={form.telefono}
            onChange={(e) => onFormChange({ ...form, telefono: e.target.value })}
            placeholder={t('alquileres.sucursales.form.telefonoPlaceholder')}
            maxLength={50}
          />
          <Input
            label={t('alquileres.sucursales.form.email')}
            type="email"
            value={form.email}
            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            placeholder={t('alquileres.sucursales.form.emailPlaceholder')}
            error={errors.email}
            maxLength={200}
          />
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id={checkboxId}
              checked={form.permiteOneWay}
              onChange={(e) => onFormChange({ ...form, permiteOneWay: e.target.checked })}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor={checkboxId} className="text-sm text-text cursor-pointer">
              {t('alquileres.sucursales.form.permiteOneWay')}
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text mb-1.5">
              {t('alquileres.sucursales.form.notas')}
            </label>
            <textarea
              value={form.notas}
              onChange={(e) => onFormChange({ ...form, notas: e.target.value })}
              placeholder={t('alquileres.sucursales.form.notasPlaceholder')}
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Horarios */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.sucursales.form.horarios')}
        </h3>
        {errors.horarios && (
          <p className="text-sm text-error mb-3">{errors.horarios}</p>
        )}
        <div className="space-y-2">
          {form.horarios.map((horario, index) => {
            const diaIndex = DIAS_ORDEN.indexOf(horario.diaSemana as typeof DIAS_ORDEN[number]);
            const diaKey = DIAS_KEYS[diaIndex];
            return (
              <div key={horario.diaSemana} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-background">
                <span className="w-24 text-sm font-medium text-text">
                  {t(`alquileres.sucursales.dias.${diaKey}`)}
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={horario.cerrado}
                    onChange={(e) => updateHorario(index, 'cerrado', e.target.checked)}
                    className="w-4 h-4 rounded border-border text-error focus:ring-error"
                  />
                  <span className="text-xs text-text-muted">{t('alquileres.sucursales.form.cerrado')}</span>
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={horario.horaApertura.substring(0, 5)}
                    onChange={(e) => updateHorario(index, 'horaApertura', e.target.value + ':00')}
                    disabled={horario.cerrado}
                    aria-label={t('alquileres.sucursales.form.horaApertura', { dia: t(`alquileres.sucursales.dias.${diaKey}`) })}
                    className={`px-2 py-1 text-sm rounded border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary ${horario.cerrado ? 'opacity-40' : ''}`}
                  />
                  <span className="text-text-muted text-xs">—</span>
                  <input
                    type="time"
                    value={horario.horaCierre.substring(0, 5)}
                    onChange={(e) => updateHorario(index, 'horaCierre', e.target.value + ':00')}
                    disabled={horario.cerrado}
                    aria-label={t('alquileres.sucursales.form.horaCierre', { dia: t(`alquileres.sucursales.dias.${diaKey}`) })}
                    className={`px-2 py-1 text-sm rounded border border-border bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary ${horario.cerrado ? 'opacity-40' : ''}`}
                  />
                </div>
              </div>
            );
          })}
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
