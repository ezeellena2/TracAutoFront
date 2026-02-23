/**
 * Servicio de autenticación
 * Maneja login, logout, y gestión de sesión
 */

import { authApi } from '@/services/endpoints';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser } from '@/shared/types';
import { OrganizationTheme } from '@/shared/types/organization';
import { getUiModeStorageKey } from '@/store/theme.store';
import { buildThemeOverride } from '@/shared/utils/buildThemeOverride';

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  /** Código de error estructurado del backend (ej: 'Auth.EmailNoVerificado'). Usar en lugar de string matching. */
  errorCode?: string;
}

/**
 * Realiza login con email y password
 * @param rememberMe Si es true, sesión de 7 días. Si es false, sesión de 4 horas. Default: true.
 */
export async function login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResult> {
  try {
    const { token, user, tipoOrganizacion, theme } = await authApi.login(email, password, rememberMe);

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

    // Cargar organización desde login response (sin segunda API call)
    useTenantStore.getState().setOrganizationFromLogin({
      id: user.organizationId,
      nombre: user.organizationName,
      tipoOrganizacion,
      theme,
    });

    const override = buildThemeOverride(theme);
    useThemeStore.getState().setDarkMode(preferredIsDark, override);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    // Extraer código de error estructurado si el interceptor lo adjuntó
    const code = (error as any)?.code as string | undefined;
    return {
      success: false,
      error: message,
      errorCode: code,
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
  logout,
  isAuthenticated,
  getToken,
  getCurrentUser,
  getCurrentOrganization,
};

export default authService;
