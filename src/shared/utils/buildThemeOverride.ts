import { OrganizacionThemeDto } from '@/shared/types/api';
import { ThemeColors } from '@/shared/types/organization';

/**
 * Construye un override parcial de ThemeColors a partir de un OrganizacionThemeDto.
 * Solo incluye campos con valor truthy (no null, undefined ni string vacío).
 * Centraliza la lógica que antes estaba duplicada en auth.service.ts y tenant.store.ts.
 */
export function buildThemeOverride(
  theme: Partial<OrganizacionThemeDto> | null | undefined
): Partial<ThemeColors> {
  if (!theme) return {};

  const override: Partial<ThemeColors> = {};

  const keys: (keyof OrganizacionThemeDto & keyof ThemeColors)[] = [
    'primary', 'primaryDark', 'secondary',
    'background', 'surface',
    'text', 'textMuted',
    'border', 'success', 'warning', 'error',
    'roleAdminBg', 'roleAdminText',
    'roleOperadorBg', 'roleOperadorText',
    'roleAnalistaBg', 'roleAnalistaText',
  ];

  for (const key of keys) {
    const value = theme[key];
    if (value) {
      override[key] = value;
    }
  }

  return override;
}
