/**
 * Servicio de endpoints de autenticaciÃ³n.
 * Reexporta un cliente reusable por web y futuros clientes mobile.
 */

import { createAuthSessionClient } from '@/services/auth/authSessionClient';
import { apiClient, publicApiClient } from '../http/apiClient';
import type {
  AuthSessionClientOptions,
  CambiarContextoRequest,
  LogoutSessionOptions,
  RefreshSessionOptions,
} from '@/services/auth/authSessionClient';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const authSessionClient = createAuthSessionClient({
  authenticatedClient: apiClient,
  anonymousClient: publicApiClient,
});

export const login = authSessionClient.login;
export const registrarEmpresa = authSessionClient.registrarEmpresa;
export const verificarCuenta = authSessionClient.verificarCuenta;
export const validarActivacionCuenta = authSessionClient.validarActivacionCuenta;
export const activarCuenta = authSessionClient.activarCuenta;
export const reenviarCodigo = authSessionClient.reenviarCodigo;
export const loginConGoogle = authSessionClient.loginConGoogle;
export const loginConApple = authSessionClient.loginConApple;
export const refreshSession = authSessionClient.refreshSession;
export const getContextosDisponibles = authSessionClient.getContextosDisponibles;
export const cambiarContexto = authSessionClient.cambiarContexto;
export const solicitarResetPassword = authSessionClient.solicitarResetPassword;
export const validarResetToken = authSessionClient.validarResetToken;
export const resetPassword = authSessionClient.resetPassword;
export const logout = authSessionClient.logout;

export type {
  AuthSessionClientOptions,
  CambiarContextoRequest,
  RefreshSessionOptions,
  LogoutSessionOptions,
};

export const authApi = authSessionClient;
