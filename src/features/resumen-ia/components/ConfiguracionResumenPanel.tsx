import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save } from 'lucide-react';
import { CadenciaResumenIA } from '../types';
import type { ConfiguracionResumenIADto, ActualizarConfiguracionRequest } from '../types';

interface Props {
  configuracion: ConfiguracionResumenIADto;
  guardando: boolean;
  onGuardar: (data: ActualizarConfiguracionRequest) => Promise<void>;
}

export function ConfiguracionResumenPanel({ configuracion, guardando, onGuardar }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<ActualizarConfiguracionRequest>(configuracion);

  useEffect(() => {
    setForm(configuracion);
  }, [configuracion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGuardar(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('resumenIA.configuracion.titulo')}
        </h3>
      </div>

      {/* Habilitado */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.habilitado}
          onChange={(e) => setForm({ ...form, habilitado: e.target.checked })}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t('resumenIA.configuracion.habilitado')}
        </span>
      </label>

      {/* Cadencia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('resumenIA.configuracion.cadencia')}
        </label>
        <select
          value={form.cadencia}
          onChange={(e) => setForm({ ...form, cadencia: Number(e.target.value) as CadenciaResumenIA })}
          className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option value={CadenciaResumenIA.Diario}>{t('resumenIA.cadencia.diario')}</option>
          <option value={CadenciaResumenIA.Semanal}>{t('resumenIA.cadencia.semanal')}</option>
          <option value={CadenciaResumenIA.Mensual}>{t('resumenIA.cadencia.mensual')}</option>
        </select>
      </div>

      {/* Hora de envio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('resumenIA.configuracion.horaEnvio')}
        </label>
        <select
          value={form.horaEnvioUtc}
          onChange={(e) => setForm({ ...form, horaEnvioUtc: Number(e.target.value) })}
          className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {String(i).padStart(2, '0')}:00 UTC
            </option>
          ))}
        </select>
      </div>

      {/* Dia semana (solo semanal) */}
      {form.cadencia === CadenciaResumenIA.Semanal && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumenIA.configuracion.diaSemana')}
          </label>
          <select
            value={form.diaSemana}
            onChange={(e) => setForm({ ...form, diaSemana: Number(e.target.value) })}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {t(`resumenIA.dias.${d}`)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Dia mes (solo mensual) */}
      {form.cadencia === CadenciaResumenIA.Mensual && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumenIA.configuracion.diaMes')}
          </label>
          <select
            value={form.diaMes}
            onChange={(e) => setForm({ ...form, diaMes: Number(e.target.value) })}
            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Secciones incluidas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('resumenIA.configuracion.seccionesIncluidas')}
        </label>
        <div className="space-y-2">
          {[
            { key: 'incluirMetricasFlota', label: t('resumenIA.secciones.metricas') },
            { key: 'incluirAlertas', label: t('resumenIA.secciones.alertas') },
            { key: 'incluirVehiculosOciosos', label: t('resumenIA.secciones.ociosos') },
            { key: 'incluirConsumosCombustible', label: t('resumenIA.secciones.combustible') },
            { key: 'incluirAlquileres', label: t('resumenIA.secciones.alquileres') },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key as keyof ActualizarConfiguracionRequest] as boolean}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Emails adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('resumenIA.configuracion.emailsAdicionales')}
        </label>
        <input
          type="text"
          value={form.emailsAdicionales ?? ''}
          onChange={(e) => setForm({ ...form, emailsAdicionales: e.target.value || null })}
          placeholder={t('resumenIA.configuracion.emailsPlaceholder')}
          className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">{t('resumenIA.configuracion.emailsAyuda')}</p>
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        <Save className="w-4 h-4" />
        {guardando ? t('resumenIA.guardando') : t('resumenIA.guardar')}
      </button>
    </form>
  );
}
