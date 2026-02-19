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
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Configurar interceptores
setupInterceptors(apiClient);

export { apiClient, buildApiUrl };
export default apiClient;
