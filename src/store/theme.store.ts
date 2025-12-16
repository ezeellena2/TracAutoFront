import { create } from 'zustand';
import { ThemeColors } from '@/shared/types';
import { darkTheme, lightTheme, mergeTheme } from '@/config/themes';
import { useAuthStore } from './auth.store';

interface ThemeState {
  colors: ThemeColors;
  isDarkMode: boolean;
  
  // Actions
  setTheme: (colors: ThemeColors) => void;
  setDarkMode: (isDark: boolean, organizationOverride?: Partial<ThemeColors>) => void;
  applyTheme: (baseTheme: ThemeColors, organizationOverride?: Partial<ThemeColors>) => void;
  applyThemeToCSSVariables: (colors: ThemeColors) => void;
  resetToDefault: () => void;
}

type UiMode = 'light' | 'dark';

/**
 * Persistencia de UI mode (preferencia por usuario + organización):
 * - Clave: theme:uiMode:{userId}:{organizationId}
 * - Valor: 'light' | 'dark'
 */
export function getUiModeStorageKey(userId: string, organizationId: string): string {
  return `theme:uiMode:${userId}:${organizationId}`;
}

/**
 * Detecta la preferencia del sistema para dark mode
 */
function detectSystemPreference(): boolean {
  if (typeof window === 'undefined') return true; // Default a dark en SSR
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function parseAuthContextFromLocalStorage(): { userId: string | null; organizationId: string | null } {
  if (typeof window === 'undefined') return { userId: null, organizationId: null };

  const raw = localStorage.getItem('tracauto-auth');
  if (!raw) return { userId: null, organizationId: null };

  try {
    const parsed = JSON.parse(raw);
    const state = parsed?.state as { user?: { id?: string } | null; organizationId?: string | null } | undefined;
    const userId = state?.user?.id ?? null;
    const organizationId = state?.organizationId ?? null;
    return { userId, organizationId };
  } catch {
    return { userId: null, organizationId: null };
  }
}

function readStoredUiMode(userId: string, organizationId: string): UiMode | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(getUiModeStorageKey(userId, organizationId));
  if (!raw) return null;

  if (raw === 'dark' || raw === 'light') return raw;
  // Compatibilidad por si algún entorno guardó booleanos
  if (raw === 'true') return 'dark';
  if (raw === 'false') return 'light';

  return null;
}

function writeStoredUiMode(userId: string, organizationId: string, isDark: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUiModeStorageKey(userId, organizationId), (isDark ? 'dark' : 'light') satisfies UiMode);
}

/**
 * Obtiene el valor inicial de isDarkMode:
 * - Si hay sesión (userId+organizationId): lee theme:uiMode:{userId}:{organizationId}
 * - Si no existe esa key, migra desde el storage viejo ('theme-store') si está disponible
 * - Si no hay sesión: usa preferencia del sistema (login estándar)
 */
function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;

  const { userId, organizationId } = parseAuthContextFromLocalStorage();

  // Si no hay usuario/sesión, NO usar valores anteriores: login estándar = preferencia del sistema
  if (!userId || !organizationId) {
    return detectSystemPreference();
  }

  const storedMode = readStoredUiMode(userId, organizationId);
  if (storedMode) return storedMode === 'dark';

  // Migración suave: si existía el storage viejo, lo tomamos una vez y lo escribimos en la key nueva.
  const legacy = localStorage.getItem('theme-store');
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy);
      const legacyIsDark = parsed?.state?.isDarkMode;
      if (typeof legacyIsDark === 'boolean') {
        writeStoredUiMode(userId, organizationId, legacyIsDark);
        return legacyIsDark;
      }
    } catch {
      // noop
    }
  }

  return detectSystemPreference();
}

function isHexColor(v: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v.trim());
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.trim().replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Para BG semánticos de roles, el backend persiste SOLO HEX (#RRGGBB).
 * La opacidad se resuelve en runtime (CSS variables) para mantener consistencia visual.
 * - Si viene HEX -> se transforma a rgba con alpha fijo.
 * - Si ya viene rgba()/otro color CSS -> se respeta.
 */
function roleBgRuntimeColor(color: string, alpha: number): string {
  if (isHexColor(color)) return hexToRgba(color, alpha);
  return color;
}

export const useThemeStore = create<ThemeState>()((set, get) => {
  const initialDarkMode = getInitialDarkMode();
  const initialTheme = initialDarkMode ? darkTheme : lightTheme;

  // Aplicar tema inicial inmediatamente (evita flash)
  if (typeof window !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', initialTheme.primary);
    root.style.setProperty('--color-primary-dark', initialTheme.primaryDark);
    root.style.setProperty('--color-secondary', initialTheme.secondary);
    root.style.setProperty('--color-background', initialTheme.background);
    root.style.setProperty('--color-surface', initialTheme.surface);
    root.style.setProperty('--color-text', initialTheme.text);
    root.style.setProperty('--color-text-muted', initialTheme.textMuted);
    root.style.setProperty('--color-border', initialTheme.border);
    root.style.setProperty('--color-success', initialTheme.success);
    root.style.setProperty('--color-warning', initialTheme.warning);
    root.style.setProperty('--color-error', initialTheme.error);
    root.style.setProperty('--color-role-admin', initialTheme.roleAdmin);
    root.style.setProperty('--color-role-admin-bg', initialTheme.roleAdminBg);
    root.style.setProperty('--color-role-admin-text', initialTheme.roleAdminText);
    root.style.setProperty('--color-role-operador', initialTheme.roleOperador);
    root.style.setProperty('--color-role-operador-bg', initialTheme.roleOperadorBg);
    root.style.setProperty('--color-role-operador-text', initialTheme.roleOperadorText);
    root.style.setProperty('--color-role-analista', initialTheme.roleAnalista);
    root.style.setProperty('--color-role-analista-bg', initialTheme.roleAnalistaBg);
    root.style.setProperty('--color-role-analista-text', initialTheme.roleAnalistaText);
    root.style.setProperty('--color-role-default', initialTheme.roleDefault);
    root.style.setProperty('--color-role-default-bg', initialTheme.roleDefaultBg);
    root.style.setProperty('--color-role-default-text', initialTheme.roleDefaultText);
  }

  return {
    colors: initialTheme,
    isDarkMode: initialDarkMode,

    setTheme: (colors) => {
      set({ colors });
      get().applyThemeToCSSVariables(colors);
    },

    /**
     * Cambia entre dark/light mode y aplica el tema.
     * Persistencia: se guarda por usuario+organización (theme:uiMode:{userId}:{organizationId}).
     *
     * Evita que el login quede “teñido” por el último usuario:
     * - si no hay usuario/organización en sesión, NO se escribe nada.
     */
    setDarkMode: (isDark, organizationOverride) => {
      const baseTheme = isDark ? darkTheme : lightTheme;
      const finalTheme = mergeTheme(baseTheme, organizationOverride);

      set({ isDarkMode: isDark, colors: finalTheme });
      get().applyThemeToCSSVariables(finalTheme);

      const auth = useAuthStore.getState();
      const userId = auth.user?.id;
      const orgId = auth.organizationId;
      if (userId && orgId) {
        writeStoredUiMode(userId, orgId, isDark);
      }
    },

    /**
     * Aplica un tema combinando tema base con overrides de organización
     * @param baseTheme - Tema base (light o dark)
     * @param organizationOverride - Overrides parciales de la organización (opcional)
     */
    applyTheme: (baseTheme, organizationOverride) => {
      const finalTheme = mergeTheme(baseTheme, organizationOverride);
      set({ colors: finalTheme });
      get().applyThemeToCSSVariables(finalTheme);
    },

    applyThemeToCSSVariables: (colors) => {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-primary-dark', colors.primaryDark);
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-background', colors.background);
      root.style.setProperty('--color-surface', colors.surface);
      root.style.setProperty('--color-text', colors.text);
      root.style.setProperty('--color-text-muted', colors.textMuted);
      root.style.setProperty('--color-border', colors.border);
      root.style.setProperty('--color-success', colors.success);
      root.style.setProperty('--color-warning', colors.warning);
      root.style.setProperty('--color-error', colors.error);
      // Tokens semánticos para roles
      root.style.setProperty('--color-role-admin', colors.roleAdmin);
      root.style.setProperty('--color-role-admin-bg', roleBgRuntimeColor(colors.roleAdminBg, 0.12));
      root.style.setProperty('--color-role-admin-text', colors.roleAdminText);
      root.style.setProperty('--color-role-operador', colors.roleOperador);
      root.style.setProperty('--color-role-operador-bg', roleBgRuntimeColor(colors.roleOperadorBg, 0.12));
      root.style.setProperty('--color-role-operador-text', colors.roleOperadorText);
      root.style.setProperty('--color-role-analista', colors.roleAnalista);
      root.style.setProperty('--color-role-analista-bg', roleBgRuntimeColor(colors.roleAnalistaBg, 0.12));
      root.style.setProperty('--color-role-analista-text', colors.roleAnalistaText);
      root.style.setProperty('--color-role-default', colors.roleDefault);
      root.style.setProperty('--color-role-default-bg', roleBgRuntimeColor(colors.roleDefaultBg, 0.10));
      root.style.setProperty('--color-role-default-text', colors.roleDefaultText);
    },

    resetToDefault: () => {
      const systemPrefersDark = detectSystemPreference();
      const baseTheme = systemPrefersDark ? darkTheme : lightTheme;
      set({ colors: baseTheme, isDarkMode: systemPrefersDark });
      get().applyThemeToCSSVariables(baseTheme);
    },
  };
});
