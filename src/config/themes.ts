/**
 * Temas base del sistema (light / dark)
 * Estos temas definen los valores por defecto para cada modo
 */

import { ThemeColors } from '@/shared/types';

/**
 * Tema base para modo claro (light mode)
 */
export const lightTheme: ThemeColors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  secondary: '#0ea5e9',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  // Tokens semánticos para roles (light mode)
  roleAdmin: '#9333ea',
  roleAdminBg: 'rgba(147, 51, 234, 0.1)',
  roleAdminText: '#7c3aed',
  roleOperador: '#2563eb',
  roleOperadorBg: 'rgba(37, 99, 235, 0.1)',
  roleOperadorText: '#1d4ed8',
  roleAnalista: '#16a34a',
  roleAnalistaBg: 'rgba(22, 163, 74, 0.1)',
  roleAnalistaText: '#15803d',
  roleDefault: '#64748b',
  roleDefaultBg: 'rgba(100, 116, 139, 0.1)',
  roleDefaultText: '#475569',
};

/**
 * Tema base para modo oscuro (dark mode)
 * Este es el tema por defecto actual del sistema
 */
export const darkTheme: ThemeColors = {
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
  // Tokens semánticos para roles (dark mode)
  roleAdmin: '#a855f7',
  roleAdminBg: 'rgba(168, 85, 247, 0.1)',
  roleAdminText: '#c4b5fd',
  roleOperador: '#3b82f6',
  roleOperadorBg: 'rgba(59, 130, 246, 0.1)',
  roleOperadorText: '#93c5fd',
  roleAnalista: '#22c55e',
  roleAnalistaBg: 'rgba(34, 197, 94, 0.1)',
  roleAnalistaText: '#86efac',
  roleDefault: '#94a3b8',
  roleDefaultBg: 'rgba(148, 163, 184, 0.1)',
  roleDefaultText: '#cbd5e1',
};

/**
 * Combina un tema base con overrides de organización
 * Los valores del override tienen prioridad sobre el tema base
 * 
 * @param baseTheme - Tema base (light o dark)
 * @param organizationOverride - Overrides parciales de la organización
 * @returns Tema final combinado
 */
export function mergeTheme(
  baseTheme: ThemeColors,
  organizationOverride?: Partial<ThemeColors>
): ThemeColors {
  if (!organizationOverride) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    ...organizationOverride,
  };
}

