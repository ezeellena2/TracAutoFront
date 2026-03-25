import axios from 'axios';
import { env } from '@/config/env';

/**
 * Cliente HTTP para endpoints publicados bajo /api/public/v1.
 * Para endpoints anónimos que viven en /api/v1 o /api/<controller>,
 * reutilizar el publicApiClient exportado desde apiClient.ts.
 */
export const publicApiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/public/${env.apiVersion}`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Construye la URL completa del API público para un path dado
 */
export function buildPublicApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${env.apiBaseUrl}/public/${env.apiVersion}/${cleanPath}`;
}
