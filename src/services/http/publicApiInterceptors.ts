import type { AxiosInstance } from 'axios';
import { useAuthClienteStore } from '@/store/authCliente.store';

/**
 * Interceptores B2C para publicApiClient.
 * Mucho mas simples que B2B: sin refresh token, sin tenancy, sin sanitization.
 *
 * - Request: agrega Bearer token si existe en el store B2C
 * - Response: en 401, si el usuario tenia token, hace logout
 *   (ProtectedRouteCliente se encarga de la redireccion)
 */
export function setupPublicApiInterceptors(client: AxiosInstance): void {
  // Request: adjuntar token B2C si existe
  client.interceptors.request.use(
    (config) => {
      const { token } = useAuthClienteStore.getState();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response: manejar 401
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;

      if (status === 401) {
        const state = useAuthClienteStore.getState();
        if (state.token) {
          // Token invalido o expirado en servidor: limpiar sesion
          state.logout();
        }
      }

      return Promise.reject(error);
    },
  );
}
