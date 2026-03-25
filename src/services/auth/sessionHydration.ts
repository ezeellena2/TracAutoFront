import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser } from '@/shared/types';
import { AuthSessionSnapshotDto, OrganizacionThemeDto } from '@/shared/types/api';
import { getUiModeStorageKey } from '@/store/theme.store';
import { buildThemeOverride } from '@/shared/utils/buildThemeOverride';
import { ensureAuthSessionSnapshot } from './authSessionSnapshot';

const rolMap: Record<string, 'SuperAdmin' | 'Admin' | 'Operador' | 'Analista'> = {
  SuperAdmin: 'SuperAdmin',
  Admin: 'Admin',
  Administrador: 'Admin',
  Operador: 'Operador',
  Analista: 'Analista',
};

function normalizeRole(rawRole?: string | null): 'SuperAdmin' | 'Admin' | 'Operador' | 'Analista' | null {
  if (!rawRole) return null;

  return rolMap[rawRole] ?? null;
}

export function buildAuthUserFromSnapshot(snapshot: AuthSessionSnapshotDto): AuthUser {
  const normalizedSnapshot = ensureAuthSessionSnapshot(snapshot);

  return {
    id: normalizedSnapshot.usuarioId,
    personaId: normalizedSnapshot.personaId ?? null,
    nombre: normalizedSnapshot.nombreUsuario,
    email: normalizedSnapshot.email,
    rol: normalizeRole(normalizedSnapshot.rol),
    organizationId: normalizedSnapshot.organizacionId ?? null,
    organizationName: normalizedSnapshot.nombreOrganizacion ?? null,
    contextoActivo: normalizedSnapshot.contextoActivo,
    contextosDisponibles: normalizedSnapshot.contextosDisponibles.map((contexto) => ({
      tipo: contexto.tipo,
      id: contexto.id ?? null,
      nombre: contexto.nombre,
      modulosActivos: contexto.modulosActivos ?? [],
      capacidadesEfectivas: contexto.capacidadesEfectivas ?? [],
      organizacionId: contexto.organizacionId ?? null,
      rol: normalizeRole(contexto.rol),
    })),
  };
}

export function hydrateAuthenticatedSession(
  snapshot: AuthSessionSnapshotDto,
  token: string,
  theme?: OrganizacionThemeDto | null
): AuthUser {
  const normalizedSnapshot = ensureAuthSessionSnapshot(snapshot);
  const user = buildAuthUserFromSnapshot(normalizedSnapshot);
  useAuthStore.getState().login(user, token);

  let preferredIsDark = useThemeStore.getState().isDarkMode;
  const uiScopeKey = user.organizationId ?? user.contextoActivo.id ?? 'personal';
  try {
    const raw = localStorage.getItem(getUiModeStorageKey(user.id, uiScopeKey));
    preferredIsDark = raw === 'dark' ? true : raw === 'light' ? false : preferredIsDark;
  } catch {
    // noop
  }

  const effectiveTheme = theme ?? normalizedSnapshot.theme;
  if (normalizedSnapshot.organizacionId && normalizedSnapshot.nombreOrganizacion) {
    useTenantStore.getState().setOrganizationFromLogin({
      id: normalizedSnapshot.organizacionId,
      nombre: normalizedSnapshot.nombreOrganizacion,
      theme: effectiveTheme,
      modulosActivos: normalizedSnapshot.modulosActivos ?? [],
    });
  } else {
    useTenantStore.getState().clearOrganization();
  }

  const override = buildThemeOverride(effectiveTheme);
  useThemeStore.getState().setDarkMode(preferredIsDark, override);

  return user;
}
