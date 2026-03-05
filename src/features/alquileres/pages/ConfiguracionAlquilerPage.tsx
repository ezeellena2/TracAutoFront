import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { Card, CardHeader, Input, Select, Button, Spinner, ApiErrorBanner, EstadoError } from '@/shared/ui';
import { usePermissions } from '@/hooks';
import { useConfiguracionAlquiler } from '../hooks/useConfiguracionAlquiler';
import { PoliticaCancelacion } from '../types/configuracion';

export function ConfiguracionAlquilerPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const {
    form,
    errors,
    isLoading,
    loadError,
    apiError,
    isSaving,
    handleChange,
    handleSubmit,
  } = useConfiguracionAlquiler();

  const canConfigurar = can('alquileres:configurar');

  const politicaOptions = [
    { value: PoliticaCancelacion.Flexible, label: t('alquileres.configuracion.politicas.flexible') },
    { value: PoliticaCancelacion.Moderada, label: t('alquileres.configuracion.politicas.moderada') },
    { value: PoliticaCancelacion.Estricta, label: t('alquileres.configuracion.politicas.estricta') },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (loadError) {
    return <EstadoError mensaje={t('alquileres.configuracion.errorCarga')} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">{t('alquileres.configuracion.titulo')}</h1>
        <p className="text-text-muted mt-1">{t('alquileres.configuracion.subtitulo')}</p>
      </div>

      <ApiErrorBanner error={apiError} jiraLabel="Error Configuración Alquiler" />

      {/* Señal y Reserva */}
      <Card>
        <CardHeader
          title={t('alquileres.configuracion.secciones.senal')}
          subtitle={t('alquileres.configuracion.secciones.senalDesc')}
        />
        <div className="space-y-4 px-6 pb-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.requiereSenalAlReservar}
              onChange={(e) => handleChange('requiereSenalAlReservar', e.target.checked)}
              disabled={!canConfigurar}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <label className="text-sm text-text">
              {t('alquileres.configuracion.campos.requiereSenal')}
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('alquileres.configuracion.campos.porcentajeSenal')}
              type="number"
              name="porcentajeSenal"
              value={form.porcentajeSenal}
              onChange={(e) => handleChange('porcentajeSenal', e.target.value)}
              error={errors.porcentajeSenal}
              helperText={t('alquileres.configuracion.helpers.porcentajeSenal')}
              min={0}
              max={100}
              disabled={!canConfigurar}
            />
            <Input
              label={t('alquileres.configuracion.campos.stripeAccountId')}
              name="stripeAccountId"
              value={form.stripeAccountId}
              onChange={(e) => handleChange('stripeAccountId', e.target.value)}
              error={errors.stripeAccountId}
              helperText={t('alquileres.configuracion.helpers.stripeAccountId')}
              disabled={!canConfigurar}
            />
          </div>
        </div>
      </Card>

      {/* Política de Cancelación */}
      <Card>
        <CardHeader
          title={t('alquileres.configuracion.secciones.cancelacion')}
          subtitle={t('alquileres.configuracion.secciones.cancelacionDesc')}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 pb-6">
          <Select
            label={t('alquileres.configuracion.campos.politicaCancelacion')}
            value={form.politicaCancelacion}
            onChange={(v) => handleChange('politicaCancelacion', v as PoliticaCancelacion)}
            options={politicaOptions}
            error={errors.politicaCancelacion}
            disabled={!canConfigurar}
          />
          <Input
            label={t('alquileres.configuracion.campos.diasGratis')}
            type="number"
            name="diasAntesCancelacionGratis"
            value={form.diasAntesCancelacionGratis}
            onChange={(e) => handleChange('diasAntesCancelacionGratis', e.target.value)}
            error={errors.diasAntesCancelacionGratis}
            helperText={t('alquileres.configuracion.helpers.diasGratis')}
            min={0}
            disabled={!canConfigurar}
          />
          <Input
            label={t('alquileres.configuracion.campos.porcentajePenalizacion')}
            type="number"
            name="porcentajePenalizacion"
            value={form.porcentajePenalizacion}
            onChange={(e) => handleChange('porcentajePenalizacion', e.target.value)}
            error={errors.porcentajePenalizacion}
            helperText={t('alquileres.configuracion.helpers.porcentajePenalizacion')}
            min={0}
            max={100}
            disabled={!canConfigurar}
          />
        </div>
      </Card>

      {/* General */}
      <Card>
        <CardHeader
          title={t('alquileres.configuracion.secciones.general')}
          subtitle={t('alquileres.configuracion.secciones.generalDesc')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
          <Input
            label={t('alquileres.configuracion.campos.moneda')}
            name="monedaPorDefecto"
            value={form.monedaPorDefecto}
            onChange={(e) => handleChange('monedaPorDefecto', e.target.value)}
            error={errors.monedaPorDefecto}
            helperText={t('alquileres.configuracion.helpers.moneda')}
            maxLength={3}
            disabled={!canConfigurar}
          />
          <Input
            label={t('alquileres.configuracion.campos.horasExpiracion')}
            type="number"
            name="horasExpiracionTentativa"
            value={form.horasExpiracionTentativa}
            onChange={(e) => handleChange('horasExpiracionTentativa', e.target.value)}
            error={errors.horasExpiracionTentativa}
            helperText={t('alquileres.configuracion.helpers.horasExpiracion')}
            min={1}
            disabled={!canConfigurar}
          />
          <Input
            label={t('alquileres.configuracion.campos.emailNotificacion')}
            type="email"
            name="emailNotificacionReservas"
            value={form.emailNotificacionReservas}
            onChange={(e) => handleChange('emailNotificacionReservas', e.target.value)}
            error={errors.emailNotificacionReservas}
            helperText={t('alquileres.configuracion.helpers.emailNotificacion')}
            disabled={!canConfigurar}
          />
        </div>
      </Card>

      {/* Precios */}
      <Card>
        <CardHeader
          title={t('alquileres.configuracion.secciones.precios')}
          subtitle={t('alquileres.configuracion.secciones.preciosDesc')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
          <Input
            label={t('alquileres.configuracion.campos.precioCombustible')}
            type="number"
            name="precioPorLitroCombustible"
            value={form.precioPorLitroCombustible}
            onChange={(e) => handleChange('precioPorLitroCombustible', e.target.value)}
            error={errors.precioPorLitroCombustible}
            helperText={t('alquileres.configuracion.helpers.precioCombustible')}
            min={0}
            step="0.01"
            disabled={!canConfigurar}
          />
          <Input
            label={t('alquileres.configuracion.campos.precioHoraExtra')}
            type="number"
            name="precioPorHoraExtra"
            value={form.precioPorHoraExtra}
            onChange={(e) => handleChange('precioPorHoraExtra', e.target.value)}
            error={errors.precioPorHoraExtra}
            helperText={t('alquileres.configuracion.helpers.precioHoraExtra')}
            min={0}
            step="0.01"
            disabled={!canConfigurar}
          />
        </div>
      </Card>

      {/* Botón Guardar */}
      {canConfigurar && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {t('alquileres.configuracion.guardar')}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
