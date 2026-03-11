import { useTranslation } from 'react-i18next';
import { Input, Select } from '@/shared/ui';
import { TIPO_DOCUMENTO_VALUES } from '@/features/alquileres/types/cliente';
import type { DatosPersonalesForm } from '../../types/reserva-publica';

interface PasoDatosPersonalesProps {
  data: DatosPersonalesForm;
  errors: Record<string, string>;
  onChange: (partial: Partial<DatosPersonalesForm>) => void;
}

export function PasoDatosPersonales({ data, errors, onChange }: PasoDatosPersonalesProps) {
  const { t } = useTranslation();

  const tipoDocOptions = TIPO_DOCUMENTO_VALUES.map(v => ({
    value: v,
    label: t(`alquilerPublico.reserva.datosPersonales.tipoDoc.${v}`),
  }));

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-text">
        {t('alquilerPublico.reserva.datosPersonales.titulo')}
      </h3>

      <div className="space-y-4">
        {/* Nombre + Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.nombre')}
            value={data.nombre}
            onChange={(e) => onChange({ nombre: e.target.value })}
            error={errors.nombre}
            required
          />
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.apellido')}
            value={data.apellido}
            onChange={(e) => onChange({ apellido: e.target.value })}
            error={errors.apellido}
            required
          />
        </div>

        {/* Email + Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.email')}
            type="email"
            value={data.email}
            onChange={(e) => onChange({ email: e.target.value })}
            error={errors.email}
            required
          />
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.telefono')}
            type="tel"
            name="telefono"
            value={data.telefono}
            onChange={(e) => onChange({ telefono: e.target.value })}
            error={errors.telefono}
          />
        </div>

        {/* Tipo Documento + Numero Documento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('alquilerPublico.reserva.datosPersonales.tipoDocumento')}
            value={data.tipoDocumento}
            onChange={(v) => onChange({ tipoDocumento: Number(v) })}
            options={tipoDocOptions}
            placeholder={t('alquilerPublico.reserva.datosPersonales.seleccionarTipo')}
            error={errors.tipoDocumento}
            required
          />
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.numeroDocumento')}
            value={data.numeroDocumento}
            onChange={(e) => onChange({ numeroDocumento: e.target.value })}
            error={errors.numeroDocumento}
            required
          />
        </div>

        {/* Fecha nacimiento + Licencia + Vencimiento licencia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.fechaNacimiento')}
            type="date"
            value={data.fechaNacimiento}
            onChange={(e) => onChange({ fechaNacimiento: e.target.value })}
          />
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.licencia')}
            value={data.numeroLicenciaConducir}
            onChange={(e) => onChange({ numeroLicenciaConducir: e.target.value })}
          />
          <Input
            label={t('alquilerPublico.reserva.datosPersonales.vencimientoLicencia')}
            type="date"
            value={data.vencimientoLicencia}
            onChange={(e) => onChange({ vencimientoLicencia: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
