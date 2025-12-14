import { create } from 'zustand';
import { ThemeColors } from '@/shared/types';

interface ThemeState {
  colors: ThemeColors;
  isDarkMode: boolean;
  
  // Actions
  setTheme: (colors: ThemeColors) => void;
  applyThemeToCSSVariables: (colors: ThemeColors) => void;
  resetToDefault: () => void;
}

const defaultTheme: ThemeColors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#0ea5e9',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  border: '#334155',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  colors: defaultTheme,
  isDarkMode: true,

  setTheme: (colors) => {
    set({ colors });
    get().applyThemeToCSSVariables(colors);
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
  },

  resetToDefault: () => {
    set({ colors: defaultTheme });
    get().applyThemeToCSSVariables(defaultTheme);
  },
}));
