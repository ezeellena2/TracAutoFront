/**
 * Servicio de endpoints de autenticación
 * Conecta con AuthController del backend
 */

import { apiClient, publicApiClient } from '../http/apiClient';
import {
  RegistrarEmpresaRequest,
  RegistroEmpresaResponse,
  VerificarCuentaRequest,
  VerificacionCuentaResponse,
  ReenviarCodigoRequest,
  ReenviarCodigoResponse,
  LoginConGoogleRequest,
  GoogleAuthResponse,
  LoginResponse,
  SolicitarResetPasswordRequest,
  ResetPasswordRequest,
} from '@/shared/types/api';

const AUTH_BASE = 'auth';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function login(email: string, password: string, rememberMe: boolean = true): Promise<LoginResponse> {
  const response = await publicApiClient.post<LoginResponse>(`${AUTH_BASE}/login`, {
    email,
    password,
    rememberMe,
  });

  return response.data;
}

export async function registrarEmpresa(data: RegistrarEmpresaRequest): Promise<RegistroEmpresaResponse> {
  const response = await publicApiClient.post<RegistroEmpresaResponse>(
    `${AUTH_BASE}/registrar-empresa`,
    data
  );
  return response.data;
}

export async function verificarCuenta(data: VerificarCuentaRequest): Promise<VerificacionCuentaResponse> {
  const response = await publicApiClient.post<VerificacionCuentaResponse>(
    `${AUTH_BASE}/verificar-cuenta`,
    data
  );
  return response.data;
}

export async function reenviarCodigo(data: ReenviarCodigoRequest): Promise<ReenviarCodigoResponse> {
  const response = await publicApiClient.post<ReenviarCodigoResponse>(
    `${AUTH_BASE}/reenviar-codigo`,
    data
  );
  return response.data;
}

export async function loginConGoogle(data: LoginConGoogleRequest): Promise<GoogleAuthResponse> {
  const response = await publicApiClient.post<GoogleAuthResponse>(
    `${AUTH_BASE}/google`,
    data
  );
  return response.data;
}

/**
 * Solicita un link de reseteo de password
 * POST /api/v1/auth/solicitar-reset-password
 */
export async function solicitarResetPassword(data: SolicitarResetPasswordRequest): Promise<void> {
  await publicApiClient.post(`${AUTH_BASE}/solicitar-reset-password`, data);
}


export async function logout(): Promise<void> {
  await apiClient.post(`${AUTH_BASE}/logout`);
}

/**
 * Resetea el password usando el token recibido por email
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  await publicApiClient.post(`${AUTH_BASE}/reset-password`, data);
}

/**
 * Valida un token de reseteo de password
 * GET /api/v1/auth/reset-password/{token}
 */
export async function validarResetToken(token: string): Promise<{ email: string }> {
  const response = await publicApiClient.get(`${AUTH_BASE}/reset-password/${token}`);
  return response.data;
}

export const authApi = {
  login,
  registrarEmpresa,
  verificarCuenta,
  reenviarCodigo,
  loginConGoogle,
  solicitarResetPassword,
  validarResetToken,
  resetPassword,
  logout,
};
