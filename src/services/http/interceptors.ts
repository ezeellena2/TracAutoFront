import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { buildApiUrl, env } from '@/config/env';
import { ProblemDetails } from '@/shared/types/api';
import { toast } from '@/store/toast.store';
import { sanitizePayload } from './payloadSanitizer';

/**
 * Formato de error del backend (ProblemDetails RFC 7807)
 * Usamos el tipo compartido desde api.ts
 */

/**
 * Formato de error de validación del backend
 */
interface ValidationError {
  errors?: Record<string, string[]>;
  message?: string;
}

type ApiErrorResponse = ProblemDetails | ValidationError;

/**
 * Extrae mensaje de error legible del response del backend
 */
/**
 * Extrae mensaje de error legible del response del backend
 */
function extractErrorMessage(data: ApiErrorResponse | undefined, status: number): string {
  if (!data) {
    return getDefaultMessage(status);
  }

  // Si tiene código explícito (backend standard), retornarlo.
  // El hook useErrorHandler lo traducirá como errors.Codigo
  if ('code' in data && data.code) {
    return data.code;
  }

  // Backwards compatibility: si tiene extension 'code' (ProblemDetails older style)
  if ('extensions' in data && (data as any).extensions?.code) {
    return (data as any).extensions.code;
  }

  // ProblemDetails standard errors (sin código específico)
  if (status >= 400 && status < 600) {
    return getDefaultMessage(status);
  }

  // Validation errors format fallback
  if ('errors' in data && data.errors) {
    const firstError = Object.values(data.errors)[0];
    if (firstError && firstError.length > 0) {
      // Si el error de validación es un código, devolverlo tal cual.
      // Si es texto libre, retornarlo (aunque no se traducirá).
      return firstError[0];
    }
  }

  return getDefaultMessage(status);
}

/**
 * Detecta si un error 403 es por violación de tenancy
 * Preferido: detectar por campo code (cuando backend lo agregue)
 * Fallback: detectar por title o detail (acotado, sin depender de texto largo)
 */
function isTenancyViolation(data: Partial<ProblemDetails> | undefined): boolean {
  if (!data) { return false; }

  // Preferido: detectar por campo code (cuando backend lo agregue)
  if (data.code === 'TENANCY_VIOLATION' || data.code === 'TenancyViolation') {
    return true;
  }

  // Fallback: detectar por title (acotado, sin depender de texto largo)
  const title = data.title?.toLowerCase() || '';
  if (title.includes('tenant') || title.includes('organización')) {
    return true;
  }

  // Fallback adicional: detectar por detail (solo si contiene palabras clave específicas)
  const detail = data.detail?.toLowerCase() || '';
  if (detail.includes('otra organización') || detail.includes('cross-tenant')) {
    return true;
  }

  return false;
}

/**
 * Mensajes por defecto según código HTTP
 * Retorna KEYS de traducción, no texto hardcodeado.
 */
function getDefaultMessage(status: number): string {
  switch (status) {
    case 400: return 'HTTP_400';
    case 401: return 'HTTP_401';
    case 403: return 'HTTP_403';
    case 404: return 'HTTP_404';
    case 409: return 'HTTP_409';
    case 429: return 'HTTP_429';
    case 500: return 'HTTP_500';
    default: return 'network'; // o 'unexpected'
  }
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
   * - Excluimos explícitamente /auth/refresh y /auth/logout del refresh.
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

  function extractAccessToken(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const anyData = data as Record<string, unknown>;
    const token = anyData.accessToken ?? anyData.token;
    return typeof token === 'string' && token.trim() ? token : null;
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
      const resp = await axios.post(buildApiUrl('auth/refresh'), null, { withCredentials: env.apiWithCredentials });
      const newToken = extractAccessToken(resp.data);
      if (!newToken) {
        throw new Error('Respuesta inválida de refresh');
      }
      useAuthStore.getState().setToken(newToken);
      return newToken;
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

      // REMOVER: Header X-Organization-Id (redundante, backend lo obtiene del token)
      // if (state.organizationId && config.headers) {
      //   config.headers['X-Organization-Id'] = state.organizationId;
      // }

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

      // Log mínimo (sin PII)
      console.warn('[API Error]', { status, url: error.config?.url });

      // 401: intentar refresh automático SOLO si el usuario estaba autenticado y no es endpoint excluido.
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
          (originalConfig.headers as any).Authorization = `Bearer ${token}`;
          return client(originalConfig);
        } catch (refreshErr) {
          rejectPending(refreshErr);
          await safeLogoutBestEffort();
          // Rechazar con mensaje legible (igual ya redirigimos)
          const message = extractErrorMessage((error.response?.data as ApiErrorResponse | undefined), status);
          return Promise.reject(new Error(message));
        }
      }

      // Si el 401 ocurrió en refresh/logout (o ya reintentamos), o no está autenticado -> logout solo si estaba autenticado.
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
          // Tenancy violation: mensaje específico + logout + redirección
          toast.error(
            'No se puede acceder a datos de otra organización. Por favor inicie sesión nuevamente.'
          );
          await safeLogoutBestEffort();
          return Promise.reject(new Error('Violación de tenancy'));
        } else {
          // 403 por permisos/roles: solo mostrar mensaje, NO logout
          const message = extractErrorMessage(data, status);
          return Promise.reject(new Error(message));
        }
      }

      // Extraer mensaje de error legible para otros errores
      const message = extractErrorMessage(error.response?.data, status);
      const err = new Error(message);
      // Adjuntar el mensaje como código para que useErrorHandler intente traducirlo
      (err as any).code = message;
      (err as any).status = status;
      return Promise.reject(err);
    }
  );
}
