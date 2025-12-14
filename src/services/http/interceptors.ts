import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store';

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
    (error: AxiosError<ApiErrorResponse>) => {
      const status = error.response?.status || 0;
      
      // Log para debugging
      console.error('[API Error]', {
        status,
        url: error.config?.url,
        data: error.response?.data,
      });

      // Sesión expirada o token inválido
      if (status === 401) {
        // Solo hacer logout si el usuario estaba autenticado
        const wasAuthenticated = useAuthStore.getState().isAuthenticated;
        useAuthStore.getState().logout();
        
        if (wasAuthenticated) {
          // Redirigir al login
          window.location.href = '/login';
        }
      }

      // Extraer mensaje de error legible
      const message = extractErrorMessage(error.response?.data, status);

      return Promise.reject(new Error(message));
    }
  );
}
