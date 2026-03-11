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
  /** Email del usuario (si está disponible en el error) */
  email?: string;
  /** Código de error estructurado del backend (ej: 'Auth.EmailNoVerificado'). Usar en lugar de string matching. */
  errorCode?: string;
  /** Código de estado HTTP retornado por la respuesta de error */
  status?: number;
  /** Extensiones adicionales del ProblemDetails (ej: emailVerificado, telefonoVerificado) */
  extensions?: Record<string, unknown>;
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
    // Extraer código de error estructurado y estado si el interceptor lo adjuntó
    const code = (error as any)?.code as string | undefined;
    const status = (error as any)?.status as number | undefined;
    // ASP.NET Core serializa ProblemDetails.Extensions como propiedades de primer nivel
    // en el JSON (no anidadas bajo "extensions"). Soportamos ambos formatos.
    const pd = (error as any)?.problemDetails as Record<string, unknown> | undefined;
    const extensions = (pd?.extensions as Record<string, unknown>) ?? pd;

    return {
      success: false,
      error: message,
      errorCode: code,
      status: status,
      extensions: extensions,
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
  errorCode?: string;
  email?: string;
  extensions?: any;
  status?: number;
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

    // Extraer rol: soportar claim corto 'role' y claim largo de ASP.NET Identity
    const roleClaim =
      payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      '';

    const user: AuthUser = {
      id: payload.sub || payload.nameid || '',
      nombre: response.nombre,
      email: response.email,
      rol: rolMap[roleClaim] || 'Operador',
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
  } catch (error: unknown) {
    const err = error as Record<string, unknown> & { response?: { data?: { errorCode?: string; code?: string } } };
    const message = error instanceof Error ? error.message : 'Error al iniciar sesión con Google';
    const rawCode =
      err?.response?.data?.errorCode ??
      (err?.errorCode as string | undefined) ??
      err?.code ??
      (err?.response?.data?.code as string | undefined);
    const errorCode: string | undefined = typeof rawCode === 'string' ? rawCode : undefined;
    const status = (error as any)?.status as number | undefined;

    // ASP.NET Core serializa ProblemDetails.Extensions como propiedades de primer nivel
    // en el JSON (no anidadas bajo "extensions"). Soportamos ambos formatos.
    const pd = (error as any)?.problemDetails as Record<string, unknown> | undefined;
    const extensions = (pd?.extensions as Record<string, unknown>) ?? pd;
    const email = (extensions?.email as string) || (error as any)?.email;

    return {
      success: false,
      error: message,
      errorCode,
      extensions,
      email,
      status
    };
  }
}

/**
 * Solicita un link de reseteo de password
 */
export async function solicitarResetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await authApi.solicitarResetPassword({ email });
    return { success: true };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Error al solicitar el restablecimiento de contraseña';
    return { success: false, error: message };
  }
}

function parseJwtPayload(token: string): Record<string, any> {
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
  solicitarResetPassword,
};

export default authService;
