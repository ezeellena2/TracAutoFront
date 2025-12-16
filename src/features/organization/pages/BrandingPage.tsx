import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Building2, Palette, Save, Undo2, Sparkles } from 'lucide-react';
import { Button, Card, Input } from '@/shared/ui';
import { usePermissions } from '@/hooks';
import { useTenantStore, useThemeStore } from '@/store';
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
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
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
  background: '',
  surface: '',
  text: '',
  textMuted: '',
  border: '',
  success: '',
  warning: '',
  error: '',
  roleAdminBg: '',
  roleAdminText: '',
  roleOperadorBg: '',
  roleOperadorText: '',
  roleAnalistaBg: '',
  roleAnalistaText: '',
};

function normalize(v: string): string {
  return v.trim();
}

function isHexColor(v: string): boolean {
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
          aria-label={`${label} (selector de color)`}
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
              Formato inválido. Use hex: #RRGGBB
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function mapThemeDtoToColorsOverride(theme?: OrganizacionThemeDto | null): Partial<ThemeColors> {
  return {
    ...(theme?.primary ? { primary: theme.primary } : {}),
    ...(theme?.primaryDark ? { primaryDark: theme.primaryDark } : {}),
    ...(theme?.secondary ? { secondary: theme.secondary } : {}),
    ...(theme?.background ? { background: theme.background } : {}),
    ...(theme?.surface ? { surface: theme.surface } : {}),
    ...(theme?.text ? { text: theme.text } : {}),
    ...(theme?.textMuted ? { textMuted: theme.textMuted } : {}),
    ...(theme?.border ? { border: theme.border } : {}),
    ...(theme?.success ? { success: theme.success } : {}),
    ...(theme?.warning ? { warning: theme.warning } : {}),
    ...(theme?.error ? { error: theme.error } : {}),
    ...(theme?.roleAdminBg ? { roleAdminBg: theme.roleAdminBg } : {}),
    ...(theme?.roleAdminText ? { roleAdminText: theme.roleAdminText } : {}),
    ...(theme?.roleOperadorBg ? { roleOperadorBg: theme.roleOperadorBg } : {}),
    ...(theme?.roleOperadorText ? { roleOperadorText: theme.roleOperadorText } : {}),
    ...(theme?.roleAnalistaBg ? { roleAnalistaBg: theme.roleAnalistaBg } : {}),
    ...(theme?.roleAnalistaText ? { roleAnalistaText: theme.roleAnalistaText } : {}),
  };
}

export function BrandingPage() {
  const { can } = usePermissions();
  const isAllowed = can('organizacion:editar');

  const { currentOrganization, setOrganization } = useTenantStore();
  const { isDarkMode, setDarkMode } = useThemeStore();

  const [form, setForm] = useState<ThemeFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
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
      background: currentOrganization.theme?.background || '',
      surface: currentOrganization.theme?.surface || '',
      text: currentOrganization.theme?.text || '',
      textMuted: currentOrganization.theme?.textMuted || '',
      border: currentOrganization.theme?.border || '',
      success: currentOrganization.theme?.success || '',
      warning: currentOrganization.theme?.warning || '',
      error: currentOrganization.theme?.error || '',
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
    put('background', 'background');
    put('surface', 'surface');
    put('text', 'text');
    put('textMuted', 'textMuted');
    put('border', 'border');
    put('success', 'success');
    put('warning', 'warning');
    put('error', 'error');
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
    diffStr('background', 'background', baseline.theme.background || '');
    diffStr('surface', 'surface', baseline.theme.surface || '');
    diffStr('text', 'text', baseline.theme.text || '');
    diffStr('textMuted', 'textMuted', baseline.theme.textMuted || '');
    diffStr('border', 'border', baseline.theme.border || '');
    diffStr('success', 'success', baseline.theme.success || '');
    diffStr('warning', 'warning', baseline.theme.warning || '');
    diffStr('error', 'error', baseline.theme.error || '');
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

  if (!currentOrganization) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <div className="p-6">
            <p className="text-text-muted">Cargando organización…</p>
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
      background: baseline.theme.background || '',
      surface: baseline.theme.surface || '',
      text: baseline.theme.text || '',
      textMuted: baseline.theme.textMuted || '',
      border: baseline.theme.border || '',
      success: baseline.theme.success || '',
      warning: baseline.theme.warning || '',
      error: baseline.theme.error || '',
      roleAdminBg: baseline.theme.roleAdminBg || '',
      roleAdminText: baseline.theme.roleAdminText || '',
      roleOperadorBg: baseline.theme.roleOperadorBg || '',
      roleOperadorText: baseline.theme.roleOperadorText || '',
      roleAnalistaBg: baseline.theme.roleAnalistaBg || '',
      roleAnalistaText: baseline.theme.roleAnalistaText || '',
    });
    toast.info('Cambios descartados (preview revertido).');
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
    toast.info(`Preset aplicado (preview): ${preset.name}. No se guardó.`);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    // Validación mínima de colores (solo si se cargaron)
    const invalid = Object.entries(form).find(([k, v]) => k !== 'logoUrl' && v !== '' && !isHexColor(v));
    if (invalid) {
      toast.error('Hay colores con formato inválido. Use hex (#RRGGBB).');
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
      toast.success('Branding guardado correctamente.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo guardar el branding';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const logoPreview = normalize(form.logoUrl);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette size={20} className="text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text">Empresa · Apariencia / Branding</h1>
          <p className="text-sm text-text-muted">
            Configura un override parcial del tema base para toda la organización. Preview inmediato (sin guardar).
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <Undo2 size={16} className="mr-2" />
            Descartar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save size={16} className="mr-2" />
            {isSaving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-text-muted" />
                <h2 className="font-semibold text-text">Presets (opcionales)</h2>
              </div>
              <p className="text-sm text-text-muted">
                Son <strong>preview</strong> inmediato. No guardan automáticamente: puedes ajustar manualmente y luego guardar.
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
                <h2 className="font-semibold text-text">Branding</h2>
              </div>

              <Input
                label="Logo (URL)"
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm((s) => ({ ...s, logoUrl: e.target.value }))}
                placeholder="https://..."
              />
              {logoPreview && (
                <div className="flex items-center gap-4 p-4 rounded-lg bg-background border border-border">
                  <div className="w-14 h-14 rounded-lg bg-surface border border-border flex items-center justify-center overflow-hidden">
                    <img
                      src={logoPreview}
                      alt="Preview logo"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="text-sm text-text-muted">
                    Preview local del logo (no se guarda hasta presionar Guardar).
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-6">
              <h2 className="font-semibold text-text">Colores principales</h2>
              <div className="space-y-4">
                <ColorField label="Primary" value={form.primary} onChange={(v) => setForm((s) => ({ ...s, primary: v }))} />
                <ColorField label="Primary Dark" value={form.primaryDark} onChange={(v) => setForm((s) => ({ ...s, primaryDark: v }))} />
                <ColorField label="Secondary" value={form.secondary} onChange={(v) => setForm((s) => ({ ...s, secondary: v }))} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-6">
              <h2 className="font-semibold text-text">Superficie / Texto / UI</h2>
              <div className="space-y-4">
                <ColorField label="Background" value={form.background} onChange={(v) => setForm((s) => ({ ...s, background: v }))} />
                <ColorField label="Surface" value={form.surface} onChange={(v) => setForm((s) => ({ ...s, surface: v }))} />
                <ColorField label="Text" value={form.text} onChange={(v) => setForm((s) => ({ ...s, text: v }))} />
                <ColorField label="Text muted" value={form.textMuted} onChange={(v) => setForm((s) => ({ ...s, textMuted: v }))} />
                <ColorField label="Border" value={form.border} onChange={(v) => setForm((s) => ({ ...s, border: v }))} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-6">
              <h2 className="font-semibold text-text">Estados</h2>
              <div className="space-y-4">
                <ColorField label="Success" value={form.success} onChange={(v) => setForm((s) => ({ ...s, success: v }))} />
                <ColorField label="Warning" value={form.warning} onChange={(v) => setForm((s) => ({ ...s, warning: v }))} />
                <ColorField label="Error" value={form.error} onChange={(v) => setForm((s) => ({ ...s, error: v }))} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-6">
              <h2 className="font-semibold text-text">Colores por rol (badge)</h2>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text">Admin</h3>
                  <ColorField label="Admin BG" value={form.roleAdminBg} onChange={(v) => setForm((s) => ({ ...s, roleAdminBg: v }))} />
                  <ColorField label="Admin Text" value={form.roleAdminText} onChange={(v) => setForm((s) => ({ ...s, roleAdminText: v }))} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text">Operador</h3>
                  <ColorField label="Operador BG" value={form.roleOperadorBg} onChange={(v) => setForm((s) => ({ ...s, roleOperadorBg: v }))} />
                  <ColorField label="Operador Text" value={form.roleOperadorText} onChange={(v) => setForm((s) => ({ ...s, roleOperadorText: v }))} />
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-text">Analista</h3>
                  <ColorField label="Analista BG" value={form.roleAnalistaBg} onChange={(v) => setForm((s) => ({ ...s, roleAnalistaBg: v }))} />
                  <ColorField label="Analista Text" value={form.roleAnalistaText} onChange={(v) => setForm((s) => ({ ...s, roleAnalistaText: v }))} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-text">Preview</h2>
              <p className="text-sm text-text-muted">
                Esto refleja el theme aplicado por CSS variables en tiempo real.
              </p>

              <div className="p-4 rounded-lg border border-border bg-surface">
                <div className="text-sm font-semibold text-text">Card</div>
                <p className="text-sm text-text-muted mt-1">
                  Texto muted / bordes / fondo/superficie
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-role-admin-bg text-role-admin-text">
                    Admin
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-role-operador-bg text-role-operador-text">
                    Operador
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-role-analista-bg text-role-analista-text">
                    Analista
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">Acción primaria</Button>
                  <Button size="sm" variant="outline">Secundaria</Button>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-3">
              <h2 className="font-semibold text-text">Notas</h2>
              <ul className="text-sm text-text-muted space-y-2">
                <li>
                  - Solo se editan tokens soportados por backend (no se inventan campos).
                </li>
                <li>
                  - El theme es por organización: no hay selector ni cambio de empresa.
                </li>
                <li>
                  - Los tokens no editables permanecen en defaults del tema base (light/dark).
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


