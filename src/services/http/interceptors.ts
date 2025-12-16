import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, useTenantStore, useThemeStore } from '@/store';
import { buildApiUrl, env } from '@/config/env';

/**
 * Formato de error del backend (ProblemDetails RFC 7807)
 */
interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

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
function extractErrorMessage(data: ApiErrorResponse | undefined, status: number): string {
  if (!data) {
    return getDefaultMessage(status);
  }

  // ProblemDetails format
  if ('detail' in data && data.detail) {
    return data.detail;
  }
  
  if ('title' in data && data.title) {
    return data.title;
  }

  // Validation errors format  
  if ('errors' in data && data.errors) {
    const firstError = Object.values(data.errors)[0];
    if (firstError && firstError.length > 0) {
      return firstError[0];
    }
  }

  if ('message' in data && data.message) {
    return data.message;
  }

  return getDefaultMessage(status);
}

/**
 * Mensajes por defecto según código HTTP
 */
function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Datos inválidos. Verifique la información ingresada.';
    case 401:
      return 'Credenciales incorrectas o sesión expirada.';
    case 403:
      return 'No tiene permisos para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 409:
      return 'El recurso ya existe o hay un conflicto.';
    case 429:
      return 'Demasiadas solicitudes. Intente nuevamente en unos segundos.';
    case 500:
      return 'Error interno del servidor. Intente más tarde.';
    default:
      return 'Error de conexión. Verifique su conexión a internet.';
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

  // Request interceptor - agrega token de auth y headers
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const state = useAuthStore.getState();
      
      // Agregar JWT si existe
      if (state.token && config.headers) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
      
      // Agregar organization ID para multi-tenant
      if (state.organizationId && config.headers) {
        config.headers['X-Organization-Id'] = state.organizationId;
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

      // Extraer mensaje de error legible
      const message = extractErrorMessage(error.response?.data, status);

      return Promise.reject(new Error(message));
    }
  );
}
