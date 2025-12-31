/**
 * Tipos para organización y theming white-label
 */

import { TipoOrganizacion } from './api';

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
  // Tokens semánticos para roles
  roleAdmin: string;
  roleAdminBg: string;
  roleAdminText: string;
  roleOperador: string;
  roleOperadorBg: string;
  roleOperadorText: string;
  roleAnalista: string;
  roleAnalistaBg: string;
  roleAnalistaText: string;
  roleDefault: string;
  roleDefaultBg: string;
  roleDefaultText: string;
}

export interface OrganizationTheme {
  id: string;
  name: string;
  logo: string;
  tipoOrganizacion?: TipoOrganizacion;
  /**
   * Override parcial del tema base
   * Solo se especifican los valores que la organización quiere personalizar
   */
  theme: Partial<ThemeColors>;
}

export interface Organization {
  id: string;
  nombre: string;
  activo: boolean;
}
