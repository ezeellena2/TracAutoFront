import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button, ApiErrorBanner } from '@/shared/ui';
import type { ParsedError } from '@/hooks';
import { TIPO_DOCUMENTO_VALUES } from '../types/cliente';
import { clienteFormSchema } from '@/shared/validation/schemas';

// --- Tipos y constantes compartidos ---

export interface ClienteFormState {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  tipoDocumento: number;
  numeroDocumento: string;
  fechaNacimiento: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  numeroLicenciaConducir: string;
  vencimientoLicencia: string;
  notas: string;
}

export interface ClienteFormErrors {
  nombre?: string;
  apellido?: string;
  email?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
}

export const INITIAL_CLIENTE_FORM: ClienteFormState = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipoDocumento: 0,
  numeroDocumento: '',
  fechaNacimiento: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
  numeroLicenciaConducir: '',
  vencimientoLicencia: '',
  notas: '',
};

export function validateClienteForm(
  form: ClienteFormState,
  t: (key: string) => string,
): ClienteFormErrors {
  const schema = clienteFormSchema(t);
  const result = schema.safeParse(form);
  if (result.success) return {};

  const errs: ClienteFormErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof ClienteFormErrors;
    if (field && !errs[field]) {
      errs[field] = issue.message;
    }
  }
  return errs;
}

// --- Componente ---

interface ClienteFormProps {
  form: ClienteFormState;
  errors: ClienteFormErrors;
  apiError: ParsedError | null;
  isSubmitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  jiraLabel: string;
  onFormChange: (form: ClienteFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function ClienteForm({
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
}: ClienteFormProps) {
  const { t } = useTranslation();

  const tipoDocumentoOptions = useMemo(() =>
    TIPO_DOCUMENTO_VALUES.map(val => ({
      value: String(val),
      label: t(`alquileres.clientes.tiposDocumento.${val}`),
    })),
  [t]);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <ApiErrorBanner error={apiError} jiraLabel={jiraLabel} onReportClick={onClose} />

      {/* Datos personales */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.clientes.form.datosPersonales')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('alquileres.clientes.form.nombre')}
            value={form.nombre}
            onChange={(e) => onFormChange({ ...form, nombre: e.target.value })}
            placeholder={t('alquileres.clientes.form.nombrePlaceholder')}
            error={errors.nombre}
            maxLength={100}
            required
          />
          <Input
            label={t('alquileres.clientes.form.apellido')}
            value={form.apellido}
            onChange={(e) => onFormChange({ ...form, apellido: e.target.value })}
            placeholder={t('alquileres.clientes.form.apellidoPlaceholder')}
            error={errors.apellido}
            maxLength={100}
            required
          />
          <Input
            label={t('alquileres.clientes.form.email')}
            type="email"
            value={form.email}
            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            placeholder={t('alquileres.clientes.form.emailPlaceholder')}
            error={errors.email}
            maxLength={200}
            required
          />
          <Input
            label={t('alquileres.clientes.form.telefono')}
            value={form.telefono}
            onChange={(e) => onFormChange({ ...form, telefono: e.target.value })}
            placeholder={t('alquileres.clientes.form.telefonoPlaceholder')}
            maxLength={50}
          />
        </div>
      </div>

      {/* Documento */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.clientes.form.documentoSeccion')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={t('alquileres.clientes.form.tipoDocumento')}
            value={form.tipoDocumento > 0 ? String(form.tipoDocumento) : ''}
            onChange={(v) => onFormChange({ ...form, tipoDocumento: Number(v) })}
            options={tipoDocumentoOptions}
            placeholder={t('alquileres.clientes.form.tipoDocumentoPlaceholder')}
            error={errors.tipoDocumento}
            required
          />
          <Input
            label={t('alquileres.clientes.form.numeroDocumento')}
            value={form.numeroDocumento}
            onChange={(e) => onFormChange({ ...form, numeroDocumento: e.target.value })}
            placeholder={t('alquileres.clientes.form.numeroDocumentoPlaceholder')}
            error={errors.numeroDocumento}
            maxLength={50}
            required
          />
        </div>
      </div>

      {/* Información adicional */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.clientes.form.informacionAdicional')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('alquileres.clientes.form.fechaNacimiento')}
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => onFormChange({ ...form, fechaNacimiento: e.target.value })}
          />
          <div className="md:col-span-2">
            <Input
              label={t('alquileres.clientes.form.direccion')}
              value={form.direccion}
              onChange={(e) => onFormChange({ ...form, direccion: e.target.value })}
              placeholder={t('alquileres.clientes.form.direccionPlaceholder')}
              maxLength={500}
            />
          </div>
          <Input
            label={t('alquileres.clientes.form.ciudad')}
            value={form.ciudad}
            onChange={(e) => onFormChange({ ...form, ciudad: e.target.value })}
            placeholder={t('alquileres.clientes.form.ciudadPlaceholder')}
            maxLength={100}
          />
          <Input
            label={t('alquileres.clientes.form.provincia')}
            value={form.provincia}
            onChange={(e) => onFormChange({ ...form, provincia: e.target.value })}
            placeholder={t('alquileres.clientes.form.provinciaPlaceholder')}
            maxLength={100}
          />
          <Input
            label={t('alquileres.clientes.form.codigoPostal')}
            value={form.codigoPostal}
            onChange={(e) => onFormChange({ ...form, codigoPostal: e.target.value })}
            placeholder={t('alquileres.clientes.form.codigoPostalPlaceholder')}
            maxLength={20}
          />
        </div>
      </div>

      {/* Licencia */}
      <div>
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t('alquileres.clientes.form.licenciaSeccion')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('alquileres.clientes.form.licenciaConducir')}
            value={form.numeroLicenciaConducir}
            onChange={(e) => onFormChange({ ...form, numeroLicenciaConducir: e.target.value })}
            placeholder={t('alquileres.clientes.form.licenciaPlaceholder')}
            maxLength={50}
          />
          <Input
            label={t('alquileres.clientes.form.vencimientoLicencia')}
            type="date"
            value={form.vencimientoLicencia}
            onChange={(e) => onFormChange({ ...form, vencimientoLicencia: e.target.value })}
          />
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-text mb-1.5">
          {t('alquileres.clientes.form.notas')}
        </label>
        <textarea
          value={form.notas}
          onChange={(e) => onFormChange({ ...form, notas: e.target.value })}
          placeholder={t('alquileres.clientes.form.notasPlaceholder')}
          maxLength={2000}
          rows={3}
          className="w-full px-4 py-2 rounded-lg bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
        />
      </div>

      {/* Botones */}
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
