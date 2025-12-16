/**
 * Presets de theme para branding por organización.
 *
 * Reglas:
 * - Son opcionales y no guardan automáticamente.
 * - NO introducen nuevos tokens.
 * - Usan únicamente tokens soportados por backend/UI (subset de ThemeColors).
 */

import { ThemeColors } from '@/shared/types/organization';

export type ThemePreset = {
  id: 'clasico-corporativo' | 'dark-pro' | 'minimal-light';
  name: string;
  description: string;
  /**
   * Colores del preset como override parcial del tema base.
   * Debe ser compatible con ThemeColors, pero solo se usan claves soportadas por backend/UI.
   */
  colors: Partial<ThemeColors>;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'clasico-corporativo',
    name: 'Azul Corporativo',
    description: 'Branding sobrio y profesional.',
    colors: {
      primary: '#1D4ED8',
      secondary: '#0EA5E9',
      // BG por rol: SOLO HEX (sin alpha). La opacidad se resuelve en runtime vía CSS/variables.
      roleAdminBg: '#1D4ED8',
      roleAdminText: '#93C5FD',
      roleOperadorBg: '#0EA5E9',
      roleOperadorText: '#7DD3FC',
      roleAnalistaBg: '#22C55E',
      roleAnalistaText: '#86EFAC',
    },
  },
  {
    id: 'dark-pro',
    name: 'Verde Tech',
    description: 'Acentos verdes con contraste limpio.',
    colors: {
      primary: '#16A34A',
      secondary: '#22C55E',
      // BG por rol: SOLO HEX (sin alpha). La opacidad se resuelve en runtime vía CSS/variables.
      roleAdminBg: '#16A34A',
      roleAdminText: '#86EFAC',
      roleOperadorBg: '#22C55E',
      roleOperadorText: '#86EFAC',
      roleAnalistaBg: '#0EA5E9',
      roleAnalistaText: '#7DD3FC',
    },
  },
  {
    id: 'minimal-light',
    name: 'Violeta Moderno',
    description: 'Moderno y distintivo, sin perder legibilidad.',
    colors: {
      primary: '#7C3AED',
      secondary: '#3B82F6',
      // BG por rol: SOLO HEX (sin alpha). La opacidad se resuelve en runtime vía CSS/variables.
      roleAdminBg: '#7C3AED',
      roleAdminText: '#C4B5FD',
      roleOperadorBg: '#3B82F6',
      roleOperadorText: '#93C5FD',
      roleAnalistaBg: '#22C55E',
      roleAnalistaText: '#86EFAC',
    },
  },
];


