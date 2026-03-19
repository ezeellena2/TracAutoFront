import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Save, Bell } from 'lucide-react';
import { Button, Card } from '@/shared/ui';
import { useAuthStore } from '@/store';
import { useLocalizationStore } from '@/store/localization.store';
import { toast } from '@/store/toast.store';
import { organizacionesApi } from '@/services/endpoints/organizaciones.api';
import { useErrorHandler } from '@/hooks';
import { PreferenciasNotificacionPanel } from '@/features/preferencias-notificacion/components';

const COUNTRY_ENUM: Record<string, number> = {
  AR: 1, US: 2, MX: 3, BR: 4, CL: 5, CO: 6, PE: 7, ES: 8, GB: 9, CA: 10,
};

const COUNTRY_CODES = ['AR', 'US', 'MX', 'BR', 'CL', 'CO', 'PE', 'ES', 'GB', 'CA'] as const;

const COUNTRY_DEFAULTS: Record<string, { timeZone: string; culture: string; measurement: number }> = {
  AR: { timeZone: 'America/Argentina/Buenos_Aires', culture: 'es-AR', measurement: 0 },
  US: { timeZone: 'America/New_York', culture: 'en-US', measurement: 1 },
  MX: { timeZone: 'America/Mexico_City', culture: 'es-MX', measurement: 0 },
  BR: { timeZone: 'America/Sao_Paulo', culture: 'pt-BR', measurement: 0 },
  CL: { timeZone: 'America/Santiago', culture: 'es-CL', measurement: 0 },
  CO: { timeZone: 'America/Bogota', culture: 'es-CO', measurement: 0 },
  PE: { timeZone: 'America/Lima', culture: 'es-PE', measurement: 0 },
  ES: { timeZone: 'Europe/Madrid', culture: 'es-ES', measurement: 0 },
  GB: { timeZone: 'Europe/London', culture: 'en-GB', measurement: 1 },
  CA: { timeZone: 'America/Toronto', culture: 'en-CA', measurement: 0 },
};

const TIMEZONE_OPTIONS = [
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Santiago',
  'America/Bogota',
  'America/Lima',
  'America/Toronto',
  'Europe/Madrid',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

const CULTURE_OPTIONS = [
  { value: 'es-AR', labelKey: 'organization.preferences.cultures.esAR' },
  { value: 'es-MX', labelKey: 'organization.preferences.cultures.esMX' },
  { value: 'es-CL', labelKey: 'organization.preferences.cultures.esCL' },
  { value: 'es-CO', labelKey: 'organization.preferences.cultures.esCO' },
  { value: 'es-PE', labelKey: 'organization.preferences.cultures.esPE' },
  { value: 'es-ES', labelKey: 'organization.preferences.cultures.esES' },
  { value: 'en-US', labelKey: 'organization.preferences.cultures.enUS' },
  { value: 'en-GB', labelKey: 'organization.preferences.cultures.enGB' },
  { value: 'en-CA', labelKey: 'organization.preferences.cultures.enCA' },
  { value: 'pt-BR', labelKey: 'organization.preferences.cultures.ptBR' },
];

function countryCodeFromEnum(enumValue: number | null): string {
  if (enumValue === null) return '';
  const entry = Object.entries(COUNTRY_ENUM).find(([, v]) => v === enumValue);
  return entry ? entry[0] : '';
}

export function PreferenciasOrganizacionPage() {
  const { t } = useTranslation();
  const { handleApiError } = useErrorHandler();
  const orgId = useAuthStore((s) => s.organizationId);
  const locStore = useLocalizationStore();

  const [country, setCountry] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [culture, setCulture] = useState('');
  const [measurement, setMeasurement] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (locStore.preferences && !loaded) {
      setCountry(countryCodeFromEnum(locStore.preferences.country));
      setTimeZone(locStore.preferences.timeZoneId ?? '');
      setCulture(locStore.preferences.culture ?? 'es-AR');
      setMeasurement(locStore.preferences.measurementSystem ?? 0);
      setLoaded(true);
    }
  }, [locStore.preferences, loaded]);

  const handleCountryChange = (code: string) => {
    setCountry(code);
    if (code && COUNTRY_DEFAULTS[code]) {
      const defaults = COUNTRY_DEFAULTS[code];
      setTimeZone(defaults.timeZone);
      setCulture(defaults.culture);
      setMeasurement(defaults.measurement);
    }
  };

  const handleSave = async () => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      const result = await organizacionesApi.updateOrganizacionPreferences({
        organizacionId: orgId,
        country: country ? COUNTRY_ENUM[country] : null,
        timeZoneId: timeZone || null,
        culture: culture || null,
        measurementSystem: measurement,
      });
      locStore.setPreferences({
        timeZoneId: result.timeZoneId,
        culture: result.culture,
        measurementSystem: result.measurementSystem,
        country: result.country,
      });
      toast.success(t('organization.preferences.success'));
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Globe size={24} className="text-primary" />
          {t('organization.preferences.title')}
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {t('organization.preferences.subtitle')}
        </p>
      </div>

      <Card>
        <div className="space-y-5 p-1">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {t('organization.preferences.country')}
            </label>
            <select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('organization.preferences.countryPlaceholder')}</option>
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`organization.preferences.countries.${code}`)}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('organization.preferences.countryHelp')}
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {t('organization.preferences.timeZone')}
            </label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">
                {t('organization.preferences.timeZonePlaceholder')} ({browserTz})
              </option>
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1">
              {t('organization.preferences.timeZoneHelp')}
            </p>
          </div>

          {/* Culture */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {t('organization.preferences.culture')}
            </label>
            <select
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('organization.preferences.culturePlaceholder')}</option>
              {CULTURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* Measurement System */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              {t('organization.preferences.measurementSystem')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="measurement"
                  checked={measurement === 0}
                  onChange={() => setMeasurement(0)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">{t('organization.preferences.metric')}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="measurement"
                  checked={measurement === 1}
                  onChange={() => setMeasurement(1)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">{t('organization.preferences.imperial')}</span>
              </label>
            </div>
          </div>

          {/* Status indicator */}
          <div className="rounded-lg bg-surface-alt p-3">
            <p className="text-xs text-text-muted">
              {timeZone
                ? `${t('organization.preferences.configuredBadge')}: ${timeZone}`
                : `${t('organization.preferences.autoDetectBadge')}: ${browserTz}`
              }
            </p>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving
                ? t('organization.preferences.saving')
                : t('organization.preferences.save')
              }
            </Button>
          </div>
        </div>
      </Card>

      {/* Preferencias de Notificación */}
      <div>
        <h2 className="text-xl font-bold text-text flex items-center gap-2">
          <Bell size={20} className="text-primary" />
          {t('preferenciasNotificacion.titulo')}
        </h2>
        <p className="text-sm text-text-muted mt-1">
          {t('preferenciasNotificacion.subtitulo')}
        </p>
      </div>

      <PreferenciasNotificacionPanel />
    </div>
  );
}
