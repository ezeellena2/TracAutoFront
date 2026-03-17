import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser } from '@/shared/types';
import { AuthSessionSnapshotDto, OrganizacionThemeDto } from '@/shared/types/api';
import { getUiModeStorageKey } from '@/store/theme.store';
import { buildThemeOverride } from '@/shared/utils/buildThemeOverride';

const rolMap: Record<string, 'SuperAdmin' | 'Admin' | 'Operador' | 'Analista'> = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Administrador: 'Admin',
  Operador: 'Operador',
  Analista: 'Analista',
};

export function buildAuthUserFromSnapshot(snapshot: AuthSessionSnapshotDto): AuthUser {
  return {
    id: snapshot.usuarioId,
    nombre: snapshot.nombreUsuario,
    email: snapshot.email,
    rol: rolMap[snapshot.rol] || 'Operador',
    organizationId: snapshot.organizacionId,
    organizationName: snapshot.nombreOrganizacion,
  };
}

export function hydrateAuthenticatedSession(
  snapshot: AuthSessionSnapshotDto,
  token: string,
  theme?: OrganizacionThemeDto | null
): AuthUser {
  const user = buildAuthUserFromSnapshot(snapshot);
  useAuthStore.getState().login(user, token);

  let preferredIsDark = useThemeStore.getState().isDarkMode;
  try {
    const raw = localStorage.getItem(getUiModeStorageKey(user.id, user.organizationId));
    preferredIsDark = raw === 'dark' ? true : raw === 'light' ? false : preferredIsDark;
  } catch {
    // noop
  }

  const effectiveTheme = theme ?? snapshot.theme;
  useTenantStore.getState().setOrganizationFromLogin({
    id: snapshot.organizacionId,
    nombre: snapshot.nombreOrganizacion,
    theme: effectiveTheme,
    modulosActivos: snapshot.modulosActivos ?? [],
  });

  const override = buildThemeOverride(effectiveTheme);
  useThemeStore.getState().setDarkMode(preferredIsDark, override);

  return user;
}
