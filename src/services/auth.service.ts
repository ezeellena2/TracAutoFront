/**
 * Servicio de autenticación
 * Maneja login, logout, y gestión de sesión
 */

import i18next from 'i18next';
import { authApi } from '@/services/endpoints';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser } from '@/shared/types';
import { OrganizationTheme } from '@/shared/types/organization';
import { AuthSessionSnapshotDto, GoogleAuthResponse } from '@/shared/types/api';
import { hydrateAuthenticatedSession } from '@/services/auth/sessionHydration';

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  /** Email del usuario (si está disponible en el error) */
  email?: string;
  /** Código de error estructurado del backend (ej: 'Auth.EmailNoVerificado'). Usar en lugar de string matching. */
  errorCode?: string;
  status?: number;
  extensions?: Record<string, unknown>;
}

export async function login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResult> {
  try {
    const response = await authApi.login(email, password, rememberMe);
    const user = hydrateAuthenticatedSession(response, response.token);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : i18next.t('errors.HTTP_401');
    const code = (error as any)?.code as string | undefined;
    const status = (error as any)?.status as number | undefined;
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

export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Error al revocar token en backend (continuando con logout local):', error);
  } finally {
    useAuthStore.getState().logout();
    useTenantStore.getState().clearOrganization();
    useThemeStore.getState().resetToDefault();
  }
}

export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated;
}

export function getToken(): string | null {
  return useAuthStore.getState().token;
}

export function getCurrentUser(): AuthUser | null {
  return useAuthStore.getState().user;
}

export function getCurrentOrganization(): OrganizationTheme | null {
  return useTenantStore.getState().currentOrganization;
}

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

function toAuthSessionSnapshot(response: GoogleAuthResponse): AuthSessionSnapshotDto | null {
  if (
    !response.usuarioId ||
    !response.organizacionId ||
    !response.nombreUsuario ||
    !response.nombreOrganizacion ||
    !response.rol ||
    !response.token
  ) {
    return null;
  }

  return {
    usuarioId: response.usuarioId,
    organizacionId: response.organizacionId,
    nombreUsuario: response.nombreUsuario,
    email: response.email,
    nombreOrganizacion: response.nombreOrganizacion,
    rol: response.rol,
    theme: response.theme,
    modulosActivos: response.modulosActivos ?? [],
  };
}

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

    if (!response.token) {
      return { success: false, error: i18next.t('errors.unexpected') };
    }

    const snapshot = toAuthSessionSnapshot(response);
    if (!snapshot) {
      return { success: false, error: i18next.t('errors.unexpected') };
    }

    hydrateAuthenticatedSession(snapshot, response.token, response.theme);
    return { success: true };
  } catch (error: unknown) {
    const err = error as Record<string, unknown> & { response?: { data?: { errorCode?: string; code?: string } } };
    const message = error instanceof Error ? error.message : i18next.t('errors.unexpected');
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
