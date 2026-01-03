/**
 * Servicio de autenticación
 * Maneja login, logout, y gestión de sesión
 */

import { authApi } from '@/services/endpoints';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser } from '@/shared/types';
import { OrganizationTheme } from '@/shared/types/organization';
import { getUiModeStorageKey } from '@/store/theme.store';
import { organizacionesApi } from '@/services/endpoints/organizaciones.api';
import { ThemeColors } from '@/shared/types/organization';

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Realiza login con email y password
 * @param rememberMe Si es true, sesión de 7 días. Si es false, sesión de 4 horas. Default: true.
 */
export async function login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResult> {
  try {
    const { token, user, theme } = await authApi.login(email, password, rememberMe);

    // Guardar en auth store
    useAuthStore.getState().login(user, token);

    // Aplicar UI mode preferido por usuario+organización (si existe).
    // Importante: NO forma parte del branding de empresa; es preferencia del usuario.
    let preferredIsDark = useThemeStore.getState().isDarkMode;
    try {
      const raw = localStorage.getItem(getUiModeStorageKey(user.id, user.organizationId));
      preferredIsDark = raw === 'dark' ? true : raw === 'light' ? false : preferredIsDark;
    } catch {
      // noop (SSR/no storage)
    }

    // Cargar branding de empresa (company-wide) y aplicarlo como override.
    // IMPORTANTE: Siempre hacer fetch del DTO completo para obtener tipoOrganizacion
    // (necesario para mostrar/ocultar módulos como Marketplace según el tipo)
    try {
      // Siempre hacer fetch del DTO completo para tener tipoOrganizacion
      const orgDto = await organizacionesApi.getOrganizacionById(user.organizationId);
      const t = theme || orgDto.theme;

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/bb1a61ab-ff73-446c-aa2c-a9a0be282dee', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'auth.service.ts:49', message: '[HYP-A] orgDto recibido con tipoOrganizacion', data: { orgDtoId: orgDto.id, orgDtoNombre: orgDto.nombre, tipoOrganizacion: orgDto.tipoOrganizacion }, timestamp: Date.now(), sessionId: 'debug-marketplace', runId: 'run2', hypothesisId: 'A' }) }).catch(() => { });
      // #endregion

      // Usar setOrganizationFromDto para incluir tipoOrganizacion
      useTenantStore.getState().setOrganizationFromDto(orgDto);

      // Aplicar tema (usar theme del login si existe, sino del DTO)
      const override: Partial<ThemeColors> = {
        ...(t?.primary ? { primary: t.primary } : {}),
        ...(t?.primaryDark ? { primaryDark: t.primaryDark } : {}),
        ...(t?.secondary ? { secondary: t.secondary } : {}),
        ...(t?.roleAdminBg ? { roleAdminBg: t.roleAdminBg } : {}),
        ...(t?.roleAdminText ? { roleAdminText: t.roleAdminText } : {}),
        ...(t?.roleOperadorBg ? { roleOperadorBg: t.roleOperadorBg } : {}),
        ...(t?.roleOperadorText ? { roleOperadorText: t.roleOperadorText } : {}),
        ...(t?.roleAnalistaBg ? { roleAnalistaBg: t.roleAnalistaBg } : {}),
        ...(t?.roleAnalistaText ? { roleAnalistaText: t.roleAnalistaText } : {}),
      };

      // Actualizar tema si hay override del login response
      if (theme) {
        useTenantStore.getState().setOrganization({
          ...useTenantStore.getState().currentOrganization!,
          theme: override,
        });
      }

      useThemeStore.getState().setDarkMode(preferredIsDark, override);
    } catch {
      useThemeStore.getState().setDarkMode(preferredIsDark);
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Realiza login con email, password y organización seleccionada
 */
export async function loginWithOrganization(
  email: string,
  password: string,
  organization: OrganizationTheme
): Promise<LoginResult> {
  try {
    const { token, user } = await authApi.loginTradicional(email, password, organization.id);

    // Guardar en auth store
    useAuthStore.getState().login(user, token);

    // Guardar organización y tema
    useTenantStore.getState().setOrganization(organization);
    // UI mode preferido (usuario+organización) + branding override (empresa)
    const themeState = useThemeStore.getState();
    let preferredIsDark = themeState.isDarkMode;
    try {
      const raw = localStorage.getItem(getUiModeStorageKey(user.id, user.organizationId));
      preferredIsDark = raw === 'dark' ? true : raw === 'light' ? false : preferredIsDark;
    } catch {
      // noop
    }
    themeState.setDarkMode(preferredIsDark, organization.theme);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Cierra la sesión del usuario
 * Intenta revocar el refresh token en el backend (best-effort)
 */
export async function logout(): Promise<void> {
  try {
    // Intentar revocar refresh token en backend
    // Si falla (red, timeout, etc.), continuamos igual con cleanup local
    await authApi.logout();
  } catch (error) {
    // Best-effort: ignorar errores del backend
    console.warn('Error al revocar token en backend (continuando con logout local):', error);
  } finally {
    // Siempre limpiar stores locales, independientemente del resultado del backend

    // Limpiar auth store
    useAuthStore.getState().logout();

    // Limpiar tenant store
    useTenantStore.getState().clearOrganization();

    // Resetear tema al base del sistema para que /login quede estándar (sin override de empresa ni modo del usuario anterior).
    useThemeStore.getState().resetToDefault();
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

/**
 * Obtiene el token JWT actual
 */
export function getToken(): string | null {
  return useAuthStore.getState().token;
}

/**
 * Obtiene el usuario actual
 */
export function getCurrentUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

/**
 * Obtiene la organización actual
 */
export function getCurrentOrganization(): OrganizationTheme | null {
  return useTenantStore.getState().currentOrganization;
}

export const authService = {
  login,
  loginWithOrganization,
  logout,
  isAuthenticated,
  getToken,
  getCurrentUser,
  getCurrentOrganization,
};

export default authService;
