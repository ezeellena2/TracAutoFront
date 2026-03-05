import axios from 'axios';
import { env } from '@/config/env';
import { setupPublicApiInterceptors } from './publicApiInterceptors';

/**
 * Cliente HTTP para endpoints publicos (sin autenticacion).
 * Base URL: /api/public/v1
 * Usado por: marketplace publico, soporte, etc.
 */
export const publicApiClient = axios.create({
  baseURL: `${env.apiBaseUrl}/public/${env.apiVersion}`,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptores B2C (token auth cliente)
setupPublicApiInterceptors(publicApiClient);

/**
 * Construye la URL completa del API publica para un path dado
 */
export function buildPublicApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${env.apiBaseUrl}/public/${env.apiVersion}/${cleanPath}`;
}
