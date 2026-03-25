/**
 * Servicio de autenticación
 * Maneja login, logout, cambio de contexto y gestión de sesión
 */

import i18next from 'i18next';
import { authApi } from '@/services/endpoints';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { AuthUser, AvailableAuthContext } from '@/shared/types';
import { OrganizationTheme } from '@/shared/types/organization';
import { AuthSessionSnapshotDto } from '@/shared/types/api';
import { hydrateAuthenticatedSession } from '@/services/auth/sessionHydration';
import { ensureAuthSessionSnapshot, snapshotFromGoogleAuthResponse } from '@/services/auth/authSessionSnapshot';

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  email?: string;
  errorCode?: string;
  status?: number;
  extensions?: Record<string, unknown>;
}

export interface GoogleLoginResult {
  success: boolean;
  requiereRegistro?: boolean;
  requiereActivacion?: boolean;
  googleData?: {
    email: string;
    nombre: string;
    fotoUrl: string | null;
    idToken: string;
  };
  activationData?: {
    email: string;
    personaId?: string | null;
    nombre: string;
    tokenActivacion?: string | null;
  };
  error?: string;
  errorCode?: string;
  email?: string;
  extensions?: Record<string, unknown>;
  status?: number;
}

export interface ChangeContextResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

function ensureSnapshot(snapshot: AuthSessionSnapshotDto): AuthSessionSnapshotDto {
  return ensureAuthSessionSnapshot(snapshot);
}

export async function login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResult> {
  try {
    const response = await authApi.login(email, password, rememberMe);
    const user = hydrateAuthenticatedSession(ensureSnapshot(response), response.token);

    return {
      success: true,
      user,
    };
  } catch (error) {
    const err = error as {
      code?: string;
      status?: number;
      message?: string;
      problemDetails?: Record<string, unknown>;
      response?: {
        status?: number;
        data?: Record<string, unknown>;
      };
    } | undefined;
    const responseData = err?.response?.data;
    const message =
      (typeof responseData?.detail === 'string' && responseData.detail) ||
      (typeof responseData?.title === 'string' && responseData.title) ||
      (error instanceof Error ? error.message : i18next.t('errors.HTTP_401'));
    const code =
      err?.code ||
      (typeof responseData?.code === 'string' ? responseData.code : undefined) ||
      (typeof responseData?.errorCode === 'string' ? responseData.errorCode : undefined) ||
      (typeof responseData?.extensions === 'object' && responseData.extensions && typeof (responseData.extensions as Record<string, unknown>).code === 'string'
        ? (responseData.extensions as Record<string, unknown>).code as string
        : undefined);
    const status = err?.status ?? err?.response?.status;
    const pd = err?.problemDetails ?? responseData;
    const extensions = (pd?.extensions as Record<string, unknown>) ?? pd;

    return {
      success: false,
      error: message,
      errorCode: code,
      status,
      extensions,
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

export async function cambiarContexto(contexto: AvailableAuthContext): Promise<ChangeContextResult> {
  try {
    const response = await authApi.cambiarContexto({
      tipoContexto: contexto.tipo,
      contextoId: contexto.id ?? null,
    });

    const snapshot: AuthSessionSnapshotDto = ensureSnapshot({
      usuarioId: response.usuarioId,
      personaId: response.personaId ?? null,
      organizacionId: response.organizacionId ?? null,
      nombreUsuario: response.nombreUsuario,
      email: response.email,
      nombreOrganizacion: response.nombreOrganizacion ?? null,
      rol: response.rol ?? null,
      theme: response.theme ?? null,
      modulosActivos: response.modulosActivos ?? [],
      capacidadesEfectivas: response.capacidadesEfectivas ?? [],
      contextoActivo: response.contextoActivo,
      contextosDisponibles: response.contextosDisponibles ?? [],
    });

    const user = hydrateAuthenticatedSession(snapshot, response.accessToken, response.theme);
    return { success: true, user };
  } catch (error) {
    const message = error instanceof Error ? error.message : i18next.t('errors.unexpected');
    return { success: false, error: message };
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

    if (response.requiereActivacion) {
      return {
        success: false,
        requiereActivacion: true,
        activationData: {
          email: response.email,
          personaId: response.personaId ?? null,
          nombre: response.nombre,
          tokenActivacion: response.tokenActivacion ?? null,
        },
      };
    }

    if (!response.token) {
      return { success: false, error: i18next.t('errors.unexpected') };
    }

    const snapshot = snapshotFromGoogleAuthResponse(response);
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
      (err.errorCode as string | undefined) ??
      err.code ??
      (err?.response?.data?.code as string | undefined);
    const errorCode: string | undefined = typeof rawCode === 'string' ? rawCode : undefined;
    const status = (error as { status?: number } | undefined)?.status;
    const pd = (error as { problemDetails?: Record<string, unknown> } | undefined)?.problemDetails;
    const extensions = (pd?.extensions as Record<string, unknown>) ?? pd;
    const email = typeof extensions?.email === 'string' ? extensions.email : (error as { email?: string } | undefined)?.email;

    return {
      success: false,
      error: message,
      errorCode,
      extensions,
      email,
      status,
    };
  }
}

export async function solicitarResetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await authApi.solicitarResetPassword({ email });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al solicitar el restablecimiento de contraseña';
    return { success: false, error: message };
  }
}

export const authService = {
  login,
  logout,
  cambiarContexto,
  isAuthenticated,
  getToken,
  getCurrentUser,
  getCurrentOrganization,
  loginWithGoogle,
  solicitarResetPassword,
};

export default authService;
