import axios, { AxiosInstance } from 'axios';
import { env, buildApiUrl } from '@/config/env';
import { setupInterceptors } from './interceptors';

/**
 * Cliente HTTP configurado para el API de TracAuto
 * Soporta modo mock y backends reales
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: `${env.apiBaseUrl}/${env.apiVersion}`,
  timeout: 120_000, // 2 min
  withCredentials: env.apiWithCredentials, // Enviar cookies (refresh token HttpOnly) en requests cross-origin
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Configurar interceptores
setupInterceptors(apiClient);

/**
 * Cliente HTTP para endpoints públicos (sin auth)
 * Evita interceptores de sesión que pueden causar redirecciones indeseadas
 */
const publicApiClient: AxiosInstance = axios.create({
  baseURL: `${env.apiBaseUrl}/${env.apiVersion}`,
  timeout: 120_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export { apiClient, publicApiClient, buildApiUrl };
export default apiClient;
