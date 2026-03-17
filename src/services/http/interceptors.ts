import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { buildApiUrl, env } from '@/config/env';
import { ProblemDetails, RefreshTokenResponse } from '@/shared/types/api';
import { toast } from '@/store/toast.store';
import { sanitizePayload } from './payloadSanitizer';
import { hydrateAuthenticatedSession } from '@/services/auth/sessionHydration';

/**
 * Formato de error del backend (ProblemDetails RFC 7807)
 * Usamos el tipo compartido desde api.ts
 */

/**
 * Formato de error de validaciÃ³n del backend
 */
interface ValidationError {
  errors?: Record<string, string[]>;
  message?: string;
}

type ApiErrorResponse = ProblemDetails | ValidationError;

/**
 * Extrae mensaje de error legible del response del backend
 * Prioriza: detail (mensaje descriptivo) > code (cÃ³digo de error) > mensaje por defecto
 */
function extractErrorMessage(data: ApiErrorResponse | undefined, status: number): string {
  if (!data) {
    return getDefaultMessage(status);
  }

  // ProblemDetails: priorizar 'detail' si tiene mensaje descriptivo
  if ('detail' in data && data.detail && typeof data.detail === 'string' && data.detail.trim()) {
    // Si el detail contiene informaciÃ³n Ãºtil (no solo el cÃ³digo), usarlo
    // Esto es especialmente Ãºtil para errores como "General.ErrorInesperado" que incluyen el mensaje
    return data.detail;
  }

  // Si tiene cÃ³digo explÃ­cito (backend standard), retornarlo.
  // El hook useErrorHandler lo traducirÃ¡ como errors.Codigo
  if ('code' in data && data.code) {
    return data.code;
  }

  // Backwards compatibility: si tiene extension 'code' (ProblemDetails older style)
  if ('extensions' in data) {
    const ext = (data as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
    if (ext?.code) {
      return ext.code as string;
    }
  }

  // ProblemDetails standard errors (sin cÃ³digo especÃ­fico)
  if (status >= 400 && status < 600) {
    return getDefaultMessage(status);
  }

  // Validation errors format fallback
  if ('errors' in data && data.errors) {
    const firstError = Object.values(data.errors)[0];
    if (firstError && firstError.length > 0) {
      // Si el error de validaciÃ³n es un cÃ³digo, devolverlo tal cual.
      // Si es texto libre, retornarlo (aunque no se traducirÃ¡).
      return firstError[0];
    }
  }

  return getDefaultMessage(status);
}

/**
 * Detecta si un error 403 es por violaciÃ³n de tenancy
 * Preferido: detectar por campo code (cuando backend lo agregue)
 * Fallback: detectar por title o detail (acotado, sin depender de texto largo)
 */
function isTenancyViolation(data: Partial<ProblemDetails> | undefined): boolean {
  if (!data) { return false; }

  // Preferido: detectar por campo code (cuando backend lo agregue)
  if (data.code === 'TENANCY_VIOLATION' || data.code === 'TenancyViolation') {
    return true;
  }

  // Preferido alternativo: extensions.code
  const ext = (data as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
  if (ext?.code === 'TENANCY_VIOLATION' || ext?.code === 'TenancyViolation') {
    return true;
  }

  // Fallback: detectar por title (acotado, sin depender de texto largo)
  const title = data.title?.toLowerCase() || '';
  if (title.includes('tenant') || title.includes('organizaciÃ³n')) {
    return true;
  }

  // Fallback adicional: detectar por detail (solo si contiene palabras clave especÃ­ficas)
  const detail = data.detail?.toLowerCase() || '';
  if (detail.includes('otra organizaciÃ³n') || detail.includes('cross-tenant')) {
    return true;
  }

  return false;
}

/**
 * Mensajes por defecto segÃºn cÃ³digo HTTP
 * Retorna KEYS de traducciÃ³n, no texto hardcodeado.
 */
function getDefaultMessage(status: number): string {
  switch (status) {
    case 0: return 'network';
    case 400: return 'HTTP_400';
    case 401: return 'HTTP_401';
    case 403: return 'HTTP_403';
    case 404: return 'HTTP_404';
    case 409: return 'HTTP_409';
    case 429: return 'HTTP_429';
    case 500: return 'HTTP_500';
    default: return 'unexpected';
  }
}

/**
 * Extrae el cÃ³digo de error del backend para que useErrorHandler pueda traducirlo.
 * Prioriza code en raÃ­z, luego extensions.code, luego fallback por status.
 */
function extractErrorCode(data: ApiErrorResponse | undefined, status: number): string {
  if (!data) return getDefaultMessage(status);
  if ('code' in data && data.code && typeof data.code === 'string') return data.code;
  const ext = (data as Record<string, unknown>).extensions as Record<string, unknown> | undefined;
  if (ext?.code && typeof ext.code === 'string') return ext.code;
  return getDefaultMessage(status);
}

/** Adjunta metadata de error para contrato uniforme (shouldRetry, useErrorHandler). */
function attachErrorMetadata(
  error: unknown,
  message: string,
  code: string,
  status: number,
  data?: ApiErrorResponse
): Error {
  const err = (error instanceof Error ? error : new Error(message)) as Error & {
    code?: string;
    status?: number;
    problemDetails?: ApiErrorResponse;
  };
  err.message = message;
  err.code = code;
  err.status = status;
  if (data) err.problemDetails = data;
  return err;
}

/**
 * Configura los interceptores de request y response
 */
export function setupInterceptors(client: AxiosInstance): void {
  /**
   * Single-flight refresh:
   * - Si 10 requests reciben 401 al mismo tiempo, solo 1 ejecuta /auth/refresh.
   * - El resto espera en una cola y luego reintenta con el nuevo access token.
   *
   * Evita loops:
   * - Marcamos la request original con `_retry = true` para no reintentar infinitamente.
   * - Excluimos explÃ­citamente /auth/refresh y /auth/logout del refresh.
   */
  let isRefreshing = false;
  let refreshPromise: Promise<string> | null = null;
  const pendingRequests: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }> = [];

  type RetryableConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  function isExcludedFromRefresh(url?: string): boolean {
    if (!url) return false;
    return url.includes('/auth/refresh') || url.includes('auth/refresh') || url.includes('/auth/logout') || url.includes('auth/logout');
  }
  async function safeLogoutBestEffort(): Promise<void> {
    // Best-effort: intentar invalidar cookie refresh en backend; si falla, igual limpiamos local.
    try {
      await axios.post(buildApiUrl('auth/logout'), null, { withCredentials: env.apiWithCredentials });
    } catch {
      // noop
    }

    useAuthStore.getState().logout();
    useTenantStore.getState().clearOrganization();
    // No tocamos arquitectura de theming: usamos reset al tema base del sistema.
    useThemeStore.getState().resetToDefault();

    window.location.href = '/login';
  }

  async function refreshAccessToken(): Promise<string> {
    if (refreshPromise) return refreshPromise;

    isRefreshing = true;
    refreshPromise = (async () => {
      const resp = await axios.post<RefreshTokenResponse>(buildApiUrl('auth/refresh'), null, { withCredentials: env.apiWithCredentials });
      const data = resp.data;
      if (!data?.accessToken) {
        throw new Error('Respuesta inválida de refresh');
      }
      hydrateAuthenticatedSession(data, data.accessToken);
      return data.accessToken;
    })().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

    return refreshPromise;
  }

  function enqueuePendingRequest(): Promise<string> {
    return new Promise((resolve, reject) => pendingRequests.push({ resolve, reject }));
  }

  function resolvePending(token: string): void {
    pendingRequests.splice(0).forEach((p) => p.resolve(token));
  }

  function rejectPending(err: unknown): void {
    pendingRequests.splice(0).forEach((p) => p.reject(err));
  }

  // Request interceptor - agrega token de auth y sanitiza payloads
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const state = useAuthStore.getState();

      // Agregar JWT si existe
      if (state.token && config.headers) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }

      // Sanitizar body si es JSON (POST/PUT/PATCH)
      if (config.data &&
        (config.method === 'post' || config.method === 'put' || config.method === 'patch') &&
        typeof config.data === 'object' &&
        !(config.data instanceof FormData) &&
        !(config.data instanceof Blob) &&
        !(config.data instanceof File) &&
        !Array.isArray(config.data)) {
        config.data = sanitizePayload(config.data);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - manejo de errores centralizado
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status || 0;
      const originalConfig = error.config as RetryableConfig | undefined;

      // Log mÃ­nimo solo en desarrollo y para respuestas HTTP reales (evita ruido por desconexiÃ³n de backend).
      if (import.meta.env.DEV && status > 0) {
        console.warn('[API Error]', { status, url: error.config?.url });
      }

      // 401: intentar refresh automÃ¡tico SOLO si el usuario estaba autenticado y no es endpoint excluido.
      if (
        status === 401 &&
        originalConfig &&
        !originalConfig._retry &&
        !isExcludedFromRefresh(originalConfig.url) &&
        useAuthStore.getState().isAuthenticated
      ) {
        originalConfig._retry = true;

        try {
          // Si ya hay refresh en curso, esperar en cola.
          const token = isRefreshing ? await enqueuePendingRequest() : await refreshAccessToken();
          if (!isRefreshing) resolvePending(token);

          // Reintentar request original con el nuevo token.
          originalConfig.headers = originalConfig.headers ?? {};
          (originalConfig.headers as Record<string, string>).Authorization = `Bearer ${token}`;
          return client(originalConfig);
        } catch (refreshErr) {
          rejectPending(refreshErr);
          await safeLogoutBestEffort();
          const data = error.response?.data as ApiErrorResponse | undefined;
          const message = extractErrorMessage(data, status);
          const code = extractErrorCode(data, status);
          return Promise.reject(attachErrorMetadata(error, message, code, status, data));
        }
      }

      // Si el 401 ocurriÃ³ en refresh/logout (o ya reintentamos), o no estÃ¡ autenticado -> logout solo si estaba autenticado.
      if (status === 401 && useAuthStore.getState().isAuthenticated) {
        if (isExcludedFromRefresh(originalConfig?.url) || originalConfig?._retry) {
          await safeLogoutBestEffort();
        }
      }

      // 403: Distinguir entre tenancy violation (logout) y permisos (solo mensaje)
      if (status === 403) {
        const data = error.response?.data as ProblemDetails | undefined;
        const isTenancy = isTenancyViolation(data);

        if (isTenancy) {
          const { t: translate } = await import('i18next');
          toast.error(translate('errors.TenancyViolation'));
          await safeLogoutBestEffort();
          return Promise.reject(attachErrorMetadata(error, 'TenancyViolation', 'TenancyViolation', 403, data));
        } else {
          const message = extractErrorMessage(data, status);
          const code = extractErrorCode(data, 403);
          return Promise.reject(attachErrorMetadata(error, message, code, status, data));
        }
      }

      const data = error.response?.data as ApiErrorResponse | undefined;
      const message = extractErrorMessage(data, status);
      const code = extractErrorCode(data, status);
      return Promise.reject(attachErrorMetadata(error, message, code, status, data));
    }
  );
}


