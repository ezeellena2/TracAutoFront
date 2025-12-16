/**
 * Configuración de entorno centralizada
 * Lee las variables de entorno de Vite y las expone de forma tipada
 */

export const env = {
  /** URL base del API */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5200/api',
  
  /** Versión del API */
  apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
  
  /** Flag para usar datos mockeados */
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',

  /**
   * Si es true, Axios enviará cookies en requests cross-site (necesario para refresh token HttpOnly).
   * En same-site no es necesario, y en algunos entornos CORS puede requerir configuración del backend.
   */
  apiWithCredentials: import.meta.env.VITE_API_WITH_CREDENTIALS === 'true',
} as const;

/**
 * Construye la URL completa del API para un path dado
 * @param path - Path del endpoint (ej: 'auth/login')
 * @returns URL completa (ej: 'http://localhost:5000/api/v1/auth/login')
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${env.apiBaseUrl}/${env.apiVersion}/${cleanPath}`;
}

export default env;
