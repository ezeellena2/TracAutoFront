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

// ==================== Google Login ====================

export interface GoogleLoginResult {
  success: boolean;
  requiereRegistro?: boolean;
  googleData?: {
    email: string;
    nombre: string;
    fotoUrl: string | null;
    idToken: string;
  };
  error?: string;
}

/**
 * Login con Google.
 * Envía el ID Token JWT de Google al backend para validación.
 * - Si el usuario ya existe → inicia sesión (token + sesión completa).
 * - Si no existe → retorna datos de Google para redirigir a registro.
 */
export async function loginWithGoogle(idToken: string): Promise<GoogleLoginResult> {
  try {
    const response = await authApi.loginConGoogle({ idToken });

    if (response.requiereRegistro) {
      return {
        success: false,
        requiereRegistro: true,
        googleData: {
          email: response.email,
          nombre: response.nombre,
          fotoUrl: response.fotoUrl,
          idToken,
        },
      };
    }

    if (!response.token || !response.organizacionId) {
      return { success: false, error: 'Respuesta incompleta del servidor' };
    }

    // Decodificar JWT para obtener usuarioId y rol (no vienen en la respuesta directa)
    const payload = parseJwtPayload(response.token);

    const rolMap: Record<string, 'Admin' | 'Operador' | 'Analista'> = {
      Admin: 'Admin',
      Administrador: 'Admin',
      Operador: 'Operador',
      Analista: 'Analista',
    };

    const user: AuthUser = {
      id: payload.sub || payload.nameid || '',
      nombre: response.nombre,
      email: response.email,
      rol: rolMap[payload.role || ''] || 'Operador',
      organizationId: response.organizacionId,
      organizationName: response.nombreOrganizacion || '',
    };

    // Guardar en auth store
    useAuthStore.getState().login(user, response.token);

    // Aplicar UI mode preferido
    let preferredIsDark = useThemeStore.getState().isDarkMode;
    try {
      const raw = localStorage.getItem(getUiModeStorageKey(user.id, user.organizationId));
      preferredIsDark = raw === 'dark' ? true : raw === 'light' ? false : preferredIsDark;
    } catch {
      // noop
    }

    useTenantStore.getState().setOrganizationFromLogin({
      id: user.organizationId,
      nombre: user.organizationName,
      tipoOrganizacion: response.tipoOrganizacion ?? 1,
      theme: response.theme,
    });

    const override = buildThemeOverride(response.theme);
    useThemeStore.getState().setDarkMode(preferredIsDark, override);

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al iniciar sesión con Google';
    return { success: false, error: message };
  }
}

/**
 * Decodifica el payload de un JWT sin validar la firma (para leer claims).
 * La validación la hace el backend; aquí solo leemos campos.
 */
function parseJwtPayload(token: string): Record<string, string> {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export const authService = {
  login,
  logout,
  isAuthenticated,
  getToken,
  getCurrentUser,
  getCurrentOrganization,
  loginWithGoogle,
};

export default authService;
