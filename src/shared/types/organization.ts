/**
 * Tipos para organización y theming white-label
 */

export interface ThemeColors {
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
}

export interface OrganizationTheme {
  id: string;
  name: string;
  logo: string;
  theme: ThemeColors;
}

export interface Organization {
  id: string;
  nombre: string;
  logoUrl?: string;
  activo: boolean;
}
