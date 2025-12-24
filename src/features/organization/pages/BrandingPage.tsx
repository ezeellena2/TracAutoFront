import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, Palette, RefreshCw, Save, Undo2, Sparkles } from 'lucide-react';
import { Button, Card, Input } from '@/shared/ui';
import { usePermissions, useErrorHandler } from '@/hooks';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { toast } from '@/store/toast.store';
import { organizacionesApi } from '@/services/endpoints/organizaciones.api';
import { ThemeColors } from '@/shared/types/organization';
import { OrganizacionThemeDto } from '@/shared/types/api';
import { THEME_PRESETS, ThemePreset } from '@/config/themePresets';
import { ThemePresetCard } from '@/features/organization/components/ThemePresetCard';

type ThemeFormState = {
  logoUrl: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  roleAdminBg: string;
  roleAdminText: string;
  roleOperadorBg: string;
  roleOperadorText: string;
  roleAnalistaBg: string;
  roleAnalistaText: string;
};

const EMPTY_FORM: ThemeFormState = {
  logoUrl: '',
  primary: '',
  primaryDark: '',
  secondary: '',
  roleAdminBg: '',
  roleAdminText: '',
  roleOperadorBg: '',
  roleOperadorText: '',
  roleAnalistaBg: '',
  roleAnalistaText: '',
};

function normalize(v: string | null | undefined): string {
  return (v ?? '').trim();
}

function isHexColor(v: string | null | undefined): boolean {
  const s = normalize(v);
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(s);
}

function ColorField({
  label,
  value,
  onChange,
  placeholder = '#RRGGBB',
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const isValid = value === '' || isHexColor(value);
  const pickerValue = isHexColor(value) ? normalize(value) : '#000000';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 items-center">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-border bg-surface"
          aria-label={`${label} (${t('common.select')})`}
        />
        <div className="flex-1">
          <Input
            label=""
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {!isValid && (
            <p className="mt-1 text-xs text-error">
              {t('organization.invalidColorFormat')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function mapThemeDtoToColorsOverride(theme?: OrganizacionThemeDto | null): Partial<ThemeColors> {
  return {
    // Branding (solo marca; NO background/surface/text, etc.)
    ...(theme?.primary ? { primary: theme.primary } : {}),
    ...(theme?.primaryDark ? { primaryDark: theme.primaryDark } : {}),
    ...(theme?.secondary ? { secondary: theme.secondary } : {}),
    ...(theme?.roleAdminBg ? { roleAdminBg: theme.roleAdminBg } : {}),
    ...(theme?.roleAdminText ? { roleAdminText: theme.roleAdminText } : {}),
    ...(theme?.roleOperadorBg ? { roleOperadorBg: theme.roleOperadorBg } : {}),
    ...(theme?.roleOperadorText ? { roleOperadorText: theme.roleOperadorText } : {}),
    ...(theme?.roleAnalistaBg ? { roleAnalistaBg: theme.roleAnalistaBg } : {}),
    ...(theme?.roleAnalistaText ? { roleAnalistaText: theme.roleAnalistaText } : {}),
  };
}

export function BrandingPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { getErrorMessage } = useErrorHandler();
  const isAllowed = can('organizacion:editar');
  const navigate = useNavigate();

  const { organizationId } = useAuthStore();
  const { currentOrganization, setOrganization } = useTenantStore();
  const { isDarkMode, setDarkMode } = useThemeStore();

  const [form, setForm] = useState<ThemeFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isDarkModeRef = useRef(isDarkMode);

  /**
   * Estados explícitos (UX/Modelo):
   * - uiMode: 'light' | 'dark' (fuente de verdad: theme store)
   * - activePresetId: preset aplicado como preview (opcional)
   * - organizationThemeDraft: override actual en edición (preview, no persistido)
   * - organizationThemePersisted: override persistido (baseline backend)
   */
  const [activePresetId, setActivePresetId] = useState<ThemePreset['id'] | null>(null);

  // Guardar baseline para diff + para revertir preview al salir sin guardar
  const baselineRef = useRef<{ logoUrl: string; theme: Partial<ThemeColors> }>({ logoUrl: '', theme: {} });

  /**
   * Fetch organization branding from backend and update stores
   * Used by initial load and manual refresh
   */
  const fetchOrganizationBranding = async (orgId: string, options?: { updateTheme?: boolean; updateBaseline?: boolean }) => {
    const { updateTheme = false, updateBaseline = false } = options || {};

    setLoadError(null);

    try {
      const orgDto = await organizacionesApi.getOrganizacionById(orgId);
      const override = mapThemeDtoToColorsOverride(orgDto.theme);
      const logoUrl = orgDto.theme?.logoUrl ?? '';

      // Update tenant store (cache)
      setOrganization({
        id: orgDto.id,
        name: orgDto.nombre,
        logo: logoUrl,
        theme: override,
      });

      // Optionally update theme immediately (for manual refresh)
      if (updateTheme) {
        setDarkMode(isDarkMode, override);
      }

      // Optionally update baseline (for manual refresh, to reset "pending changes" state)
      if (updateBaseline) {
        baselineRef.current = { logoUrl, theme: override };
      }

      return { logoUrl, override };
    } catch (e) {
      setLoadError(getErrorMessage(e));
      throw e;
    }
  };

  // Hidratación simple (sin selector multi-org): si no hay org en tenant store, cargar por id desde auth store.
  useEffect(() => {
    if (currentOrganization) return;
    if (!organizationId) return;

    let cancelled = false;
    (async () => {
      setIsRetrying(false);
      try {
        await fetchOrganizationBranding(organizationId);
      } catch {
        // Error already handled by fetchOrganizationBranding
      }
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [currentOrganization, organizationId, setOrganization, isRetrying]);

  useEffect(() => {
    isDarkModeRef.current = isDarkMode;
  }, [isDarkMode]);

  useEffect(() => {
    if (!currentOrganization) return;

    baselineRef.current = {
      logoUrl: currentOrganization.logo || '',
      theme: currentOrganization.theme || {},
    };

    setForm({
      ...EMPTY_FORM,
      logoUrl: currentOrganization.logo || '',
      primary: currentOrganization.theme?.primary || '',
      primaryDark: currentOrganization.theme?.primaryDark || '',
      secondary: currentOrganization.theme?.secondary || '',
      roleAdminBg: currentOrganization.theme?.roleAdminBg || '',
      roleAdminText: currentOrganization.theme?.roleAdminText || '',
      roleOperadorBg: currentOrganization.theme?.roleOperadorBg || '',
      roleOperadorText: currentOrganization.theme?.roleOperadorText || '',
      roleAnalistaBg: currentOrganization.theme?.roleAnalistaBg || '',
      roleAnalistaText: currentOrganization.theme?.roleAnalistaText || '',
    });
  }, [currentOrganization]);

  const previewOverride: Partial<ThemeColors> = useMemo(() => {
    const o: Partial<ThemeColors> = {};
    const put = (k: keyof ThemeFormState, tk: keyof ThemeColors) => {
      const v = normalize(form[k]);
      if (v) (o as Record<string, string>)[tk] = v;
    };

    put('primary', 'primary');
    put('primaryDark', 'primaryDark');
    put('secondary', 'secondary');
    put('roleAdminBg', 'roleAdminBg');
    put('roleAdminText', 'roleAdminText');
    put('roleOperadorBg', 'roleOperadorBg');
    put('roleOperadorText', 'roleOperadorText');
    put('roleAnalistaBg', 'roleAnalistaBg');
    put('roleAnalistaText', 'roleAnalistaText');

    return o;
  }, [form]);

  const organizationThemeDraft = previewOverride;

  // Preview inmediato: aplica el override del form sobre el tema base actual
  useLayoutEffect(() => {
    if (!currentOrganization) return;
    // themeFinal = merge(baseTheme(uiMode), organizationThemeOverride(draft))
    setDarkMode(isDarkMode, organizationThemeDraft);
  }, [previewOverride, currentOrganization, isDarkMode, setDarkMode]);

  // Al salir de la página sin guardar: revertir a lo que estaba en la organización
  useEffect(() => {
    return () => {
      const baseline = baselineRef.current;
      setDarkMode(isDarkModeRef.current, baseline.theme);
    };
  }, [setDarkMode]);

  // Si el usuario modifica manualmente tokens que el preset define, dejar de marcarlo como activo.
  useEffect(() => {
    if (!activePresetId) return;
    const preset = THEME_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) {
      setActivePresetId(null);
      return;
    }

    const keys: Array<keyof ThemeFormState> = [
      'primary',
      'secondary',
      'roleAdminBg',
      'roleAdminText',
      'roleOperadorBg',
      'roleOperadorText',
      'roleAnalistaBg',
      'roleAnalistaText',
    ];

    const stillMatches = keys.every((k) => {
      const presetValue = (preset.colors as Record<string, string | undefined>)[k];
      if (!presetValue) return true;
      return normalize(form[k]) === normalize(presetValue);
    });

    if (!stillMatches) setActivePresetId(null);
  }, [activePresetId, form]);

  const patch = useMemo(() => {
    const baseline = baselineRef.current;
    const p: Partial<Record<keyof OrganizacionThemeDto, string | null>> = {};

    const diffStr = (key: keyof ThemeFormState, targetKey: keyof OrganizacionThemeDto, baseValue: string) => {
      const next = normalize(form[key]);
      const base = normalize(baseValue);
      if (next === base) return;
      p[targetKey] = next === '' ? null : next;
    };

    diffStr('logoUrl', 'logoUrl', baseline.logoUrl);

    diffStr('primary', 'primary', baseline.theme.primary || '');
    diffStr('primaryDark', 'primaryDark', baseline.theme.primaryDark || '');
    diffStr('secondary', 'secondary', baseline.theme.secondary || '');
    diffStr('roleAdminBg', 'roleAdminBg', baseline.theme.roleAdminBg || '');
    diffStr('roleAdminText', 'roleAdminText', baseline.theme.roleAdminText || '');
    diffStr('roleOperadorBg', 'roleOperadorBg', baseline.theme.roleOperadorBg || '');
    diffStr('roleOperadorText', 'roleOperadorText', baseline.theme.roleOperadorText || '');
    diffStr('roleAnalistaBg', 'roleAnalistaBg', baseline.theme.roleAnalistaBg || '');
    diffStr('roleAnalistaText', 'roleAnalistaText', baseline.theme.roleAnalistaText || '');

    return p;
  }, [form]);

  const hasChanges = useMemo(() => Object.keys(patch).length > 0, [patch]);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  const handleRetry = () => {
    setIsRetrying(true);
  };

  const handleRefreshFromServer = async () => {
    if (!currentOrganization) return;

    // Advertir si hay cambios sin guardar
    if (hasChanges) {
      const confirmed = window.confirm(
        t('organization.unsavedChangesWarning')
      );
      if (!confirmed) return;
    }

    setIsRefreshing(true);
    try {
      const { logoUrl, override } = await fetchOrganizationBranding(currentOrganization.id, {
        updateTheme: true,
        updateBaseline: true,
      });

      // Reset form to new values from server
      setForm({
        ...EMPTY_FORM,
        logoUrl: logoUrl,
        primary: override.primary || '',
        primaryDark: override.primaryDark || '',
        secondary: override.secondary || '',
        roleAdminBg: override.roleAdminBg || '',
        roleAdminText: override.roleAdminText || '',
        roleOperadorBg: override.roleOperadorBg || '',
        roleOperadorText: override.roleOperadorText || '',
        roleAnalistaBg: override.roleAnalistaBg || '',
        roleAnalistaText: override.roleAnalistaText || '',
      });

      // Reset active preset (since we loaded from server)
      setActivePresetId(null);

      toast.success(t('organization.success.refreshed'));
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <div className="p-6">
            {loadError ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-error">
                  <AlertCircle size={24} />
                  <div>
                    <h3 className="font-semibold">{t('organization.loadError')}</h3>
                    <p className="text-sm mt-1">{loadError}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleRetry} disabled={isRetrying}>
                    <RefreshCw size={16} className="mr-2" />
                    {isRetrying ? t('organization.retrying') : t('organization.retry')}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    {t('organization.back')}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-text-muted">{t('organization.loading')}</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const handleReset = () => {
    const baseline = baselineRef.current;
    setForm({
      ...EMPTY_FORM,
      logoUrl: baseline.logoUrl,
      primary: baseline.theme.primary || '',
      primaryDark: baseline.theme.primaryDark || '',
      secondary: baseline.theme.secondary || '',
      roleAdminBg: baseline.theme.roleAdminBg || '',
      roleAdminText: baseline.theme.roleAdminText || '',
      roleOperadorBg: baseline.theme.roleOperadorBg || '',
      roleOperadorText: baseline.theme.roleOperadorText || '',
      roleAnalistaBg: baseline.theme.roleAnalistaBg || '',
      roleAnalistaText: baseline.theme.roleAnalistaText || '',
    });
    toast.info(t('organization.success.discarded'));
  };

  const applyPresetToForm = (preset: ThemePreset) => {
    // Presets de EMPRESA: solo aplican tokens de branding (no background/surface/text).
    // Mantener comportamiento: preview inmediato, sin guardar.
    const pickHex = (v: string | undefined) => (v && isHexColor(v) ? normalize(v) : undefined);
    setForm((s) => ({
      ...s,
      primary: pickHex(preset.colors.primary) ?? s.primary,
      secondary: pickHex(preset.colors.secondary) ?? s.secondary,
      roleAdminBg: pickHex(preset.colors.roleAdminBg) ?? s.roleAdminBg,
      roleAdminText: pickHex(preset.colors.roleAdminText) ?? s.roleAdminText,
      roleOperadorBg: pickHex(preset.colors.roleOperadorBg) ?? s.roleOperadorBg,
      roleOperadorText: pickHex(preset.colors.roleOperadorText) ?? s.roleOperadorText,
      roleAnalistaBg: pickHex(preset.colors.roleAnalistaBg) ?? s.roleAnalistaBg,
      roleAnalistaText: pickHex(preset.colors.roleAnalistaText) ?? s.roleAnalistaText,
    }));
    setActivePresetId(preset.id);
    toast.info(t('organization.success.presetApplied', { name: preset.name }));
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    // Validación mínima de colores (solo si se cargaron)
    const invalid = Object.entries(form).find(([k, v]) => k !== 'logoUrl' && v !== '' && !isHexColor(v));
    if (invalid) {
      toast.error(t('organization.errors.invalidColors'));
      return;
    }

    // Detectar offline antes de intentar guardar
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      toast.error(t('organization.errors.noConnection'));
      return;
    }

    setIsSaving(true);
    try {
      const orgId = currentOrganization.id;
      const updatedThemeDto = await organizacionesApi.updateOrganizacionTheme(orgId, patch);

      // Persistir en store de organización (logo + override de colores)
      const nextLogo = updatedThemeDto.logoUrl ?? '';
      const nextColors = mapThemeDtoToColorsOverride(updatedThemeDto);

      setOrganization({
        ...currentOrganization,
        logo: nextLogo,
        theme: nextColors,
      });

      // Aplicar globalmente sin reload
      setDarkMode(isDarkMode, nextColors);

      // Actualizar baseline para que la UI quede "sin cambios pendientes"
      baselineRef.current = { logoUrl: nextLogo, theme: nextColors };
      toast.success(t('organization.success.updated'));
    } catch (e) {
      console.error('[BrandingPage] Error al guardar branding:', e);

      let msg = t('organization.errors.saveFailed');

      // Detectar si se perdió la conexión durante el request
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        msg = t('organization.errors.connectionLost');
      } else {
        msg = getErrorMessage(e);
      }

      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const logoPreview = normalize(form.logoUrl);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text">{t('organization.title')}</h1>
          <p className="text-sm text-text-muted">
            {t('organization.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleRefreshFromServer}
            disabled={isRefreshing || isSaving}
            title={t('organization.refreshFromServer')}
          >
            <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? t('organization.refreshing') : t('organization.refresh')}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSaving || isRefreshing}>
            <Undo2 size={16} className="mr-2" />
            {t('organization.discard')}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving || isRefreshing}>
            <Save size={16} className="mr-2" />
            {isSaving ? t('organization.saving') : t('organization.save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-text-muted" />
                <h2 className="font-semibold text-text">{t('organization.presets')}</h2>
              </div>
              <p className="text-sm text-text-muted">
                {t('organization.presetsDescription')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {THEME_PRESETS.map((preset) => (
                  <ThemePresetCard
                    key={preset.id}
                    preset={preset}
                    onApply={applyPresetToForm}
                    isActive={activePresetId === preset.id}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-text-muted" />
                <h2 className="font-semibold text-text">{t('organization.branding')}</h2>
              </div>

              <Input
                label={t('organization.logo')}
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))}
                placeholder={t('organization.logoPlaceholder')}
              />
              {logoPreview && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                  <div className="w-14 h-14 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden">
                    <img
                      src={logoPreview}
                      alt={t('organization.logo')}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-sm text-text-muted">
                    {t('organization.logoPreview')}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-6">
              <h2 className="font-semibold text-text">{t('organization.mainColors')}</h2>
              <div className="space-y-4">
                <ColorField label={t('organization.primary')} value={form.primary} onChange={(v) => setForm((s) => ({ ...s, primary: v }))} />
                <ColorField label={t('organization.primaryDark')} value={form.primaryDark} onChange={(v) => setForm((s) => ({ ...s, primaryDark: v }))} />
                <ColorField label={t('organization.secondary')} value={form.secondary} onChange={(v) => setForm((s) => ({ ...s, secondary: v }))} />
              </div>
            </div>
          </Card>

          {/* Branding de empresa: NO incluye background/surface/text/estados (pertenecen al tema base light/dark) */}

          <Card>
            <div className="p-6 space-y-6">
              <h2 className="font-semibold text-text">{t('organization.roleColors')}</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text">{t('organization.admin')}</h3>
                  <ColorField label={t('organization.adminBg')} value={form.roleAdminBg} onChange={(v) => setForm((s) => ({ ...s, roleAdminBg: v }))} />
                  <ColorField label={t('organization.adminText')} value={form.roleAdminText} onChange={(v) => setForm((s) => ({ ...s, roleAdminText: v }))} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text">{t('organization.operador')}</h3>
                  <ColorField label={t('organization.operadorBg')} value={form.roleOperadorBg} onChange={(v) => setForm((s) => ({ ...s, roleOperadorBg: v }))} />
                  <ColorField label={t('organization.operadorText')} value={form.roleOperadorText} onChange={(v) => setForm((s) => ({ ...s, roleOperadorText: v }))} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text">{t('organization.analista')}</h3>
                  <ColorField label={t('organization.analistaBg')} value={form.roleAnalistaBg} onChange={(v) => setForm((s) => ({ ...s, roleAnalistaBg: v }))} />
                  <ColorField label={t('organization.analistaText')} value={form.roleAnalistaText} onChange={(v) => setForm((s) => ({ ...s, roleAnalistaText: v }))} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-3 lg:sticky lg:top-4 self-start">
          <Card>
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-text">{t('organization.preview')}</h2>
              <p className="text-sm text-text-muted">
                {t('organization.previewDescription')}
              </p>

              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="text-sm font-semibold text-text">{t('organization.card')}</div>
                <p className="text-sm text-text-muted mt-1">
                  {t('organization.cardDescription')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-role-admin-bg text-role-admin-text">
                    {t('organization.admin')}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-role-operador-bg text-role-operador-text">
                    {t('organization.operador')}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-role-analista-bg text-role-analista-text">
                    {t('organization.analista')}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">{t('organization.primaryAction')}</Button>
                  <Button size="sm" variant="outline">{t('organization.secondaryAction')}</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-3">
              <h2 className="font-semibold text-text">{t('organization.notes')}</h2>
              <ul className="text-sm text-text-muted space-y-2">
                <li>
                  - {t('organization.note1')}
                </li>
                <li>
                  - {t('organization.note2')}
                </li>
                <li>
                  - {t('organization.note3')}
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


