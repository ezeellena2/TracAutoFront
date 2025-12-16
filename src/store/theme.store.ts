import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeColors } from '@/shared/types';
import { darkTheme, lightTheme, mergeTheme } from '@/config/themes';

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

/**
 * Detecta la preferencia del sistema para dark mode
 */
function detectSystemPreference(): boolean {
  if (typeof window === 'undefined') return true; // Default a dark en SSR
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Obtiene el valor inicial de isDarkMode:
 * 1. Intenta cargar desde localStorage (si existe)
 * 2. Si no existe, usa la preferencia del sistema
 */
function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return true;
  
  const stored = localStorage.getItem('theme-store');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.isDarkMode !== undefined) {
        return parsed.state.isDarkMode;
      }
    } catch {
      // Si hay error parseando, usar preferencia del sistema
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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      const initialDarkMode = getInitialDarkMode();
      const initialTheme = initialDarkMode ? darkTheme : lightTheme;
      
      // Aplicar tema inicial inmediatamente
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
         * Cambia entre dark/light mode y aplica el tema
         * @param isDark - true para dark mode, false para light mode
         * @param organizationOverride - Overrides parciales de la organización (opcional)
         */
        setDarkMode: (isDark, organizationOverride) => {
          const baseTheme = isDark ? darkTheme : lightTheme;
          const finalTheme = mergeTheme(baseTheme, organizationOverride);
          
          set({ isDarkMode: isDark, colors: finalTheme });
          get().applyThemeToCSSVariables(finalTheme);
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
    },
    {
      name: 'theme-store',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }), // Solo persistir isDarkMode
    }
  )
);
